// index.ts

import { BASE_URL, makeRequest } from "../../utils/util"

// 获取应用实例
const app = getApp<IAppOption>()
type UserInfoResult = WechatMiniprogram.GetUserProfileSuccessCallbackResult

Page({
  data: {
    hasUserInfo: false,
    avatarUrl: '',
    nickName: '',
    roomId: '',
    currentDanmaku: '',
    iPhoneXPlus: false,
  },
  async updateLocalUserInfo() {
    const lastProfileUpdate = Number(wx.getStorageSync('lastProfileUpdate'))
    const hasUserInfo = (Date.now() - lastProfileUpdate) < 7 * 24 * 3600 * 1000
    this.setData({ hasUserInfo })
    if (hasUserInfo) {
      const avatarUrl: string = wx.getStorageSync('avatarUrl')
      const nickName: string = wx.getStorageSync('nickName')
      this.setData({
        avatarUrl: avatarUrl,
        nickName: nickName
      })
    }
  },
  async onLoad (query) {
    const sysInfo = await wx.getSystemInfo()
    if (sysInfo.screenHeight != sysInfo.safeArea.height + sysInfo.statusBarHeight) {
      this.setData({iPhoneXPlus: true})
    }
    console.log(query)
    const scene = decodeURIComponent(query.scene ?? '')
    if (scene) {
      this.setData({roomId: scene})
    }
    await this.updateLocalUserInfo()
  },
  handleInput(evt: {detail: {value: string}}) {
    this.setData({currentDanmaku: evt.detail.value})
  },
  async getUserProfile() {
    const lastProfileUpdate = Number(wx.getStorageSync('lastProfileUpdate'))
    const enforceUpdate = (Date.now() - lastProfileUpdate) < 7 * 24 * 3600 * 1000
    const uploadedToThisRoom = wx.getStorageSync('uploaded_'+this.data.roomId)
    if (!enforceUpdate && uploadedToThisRoom) {
      return
    }

    wx.showLoading({title: '加载中', mask: true})
    const res = await wx.getUserProfile({
      desc: '用于弹幕墙显示头像昵称'
    })
    await wx.hideLoading()
    wx.setStorageSync('avatarUrl', res.userInfo.avatarUrl)
    wx.setStorageSync('nickName', res.userInfo.nickName)
    wx.setStorageSync('lastProfileUpdate', Date.now())
    this.updateLocalUserInfo()
    this.uploadUserProfile(res)

    wx.setStorageSync('uploaded_'+this.data.roomId, true)
  },
  async sendDanmaku() {
    if (! this.data.currentDanmaku) {
      await wx.showToast({
        icon: 'error',
        title: '弹幕不能为空'
      })
      return
    }
    try {
      await makeRequest({
        url: BASE_URL + `/wechat-mp/${this.data.roomId}/danmaku`,
        method: 'POST',
        data: {
          content: this.data.currentDanmaku
        }
      })
      wx.showToast({
        icon: 'success',
        title: '发送成功'
      })
      this.setData({currentDanmaku: ''})
    } catch (e) {
      wx.showToast({
        icon: 'error',
        title: '发送失败：'+e
      })
    }
  },
  async uploadUserProfile(userInfoRes: UserInfoResult) {
    if (!this.data.roomId) {
      return
    }
    try {
      await makeRequest({
        url: BASE_URL + `/wechat-mp/${this.data.roomId}/profile`,
        method: 'POST',
        data: userInfoRes
      })
    } catch (e) {
      wx.showToast({
        title: `上传头像失败: ${e}`,
        icon: 'error'
      })
      return
    }
    wx.showToast({
      title: '上传头像成功',
      icon: 'success'
    })
  },
  async promptSetRoomId() {
    const modalResult = await wx.showModal({
      editable: true,
      title: '设置房间号',
      placeholderText: '123456789'
    })
    if (!modalResult.confirm || modalResult.cancel) return
    if (! modalResult.content) {
      wx.showToast({
        title: '房间号不能为空',
        icon: 'error'
      })
      return
    }
    this.setData({
      roomId: modalResult.content
    })
    wx.showModal({
      title: '上传头像昵称？',
      content: '你的头像和昵称将被用于显示弹幕发送人',
      success: async (res) => {
        if (res.cancel || !res.confirm) return
        await this.getUserProfile()
      }
    })
  }
})
