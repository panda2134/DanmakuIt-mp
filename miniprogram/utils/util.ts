export const BASE_URL = 'https://danmakuit.panda2134.site'

interface LoginResponse{
  token: string;
}

type RequestParams = WechatMiniprogram.RequestOption<string | Record<string, any> | ArrayBuffer>
export async function makeRequest(params: RequestParams, omitToken: boolean = false) {
  const extParams: Optional<RequestParams> = {}
  if (!omitToken) {
    const token = wx.getStorageSync('token')
    extParams.header = {
      'Authorization': `Bearer ${token}`
    }
  }
  return new Promise((resolve, reject) => wx.request({
    ...params,
    ...extParams,
    success: x => {
      if (x.statusCode >= 400) {
        reject(`请求错误：${x.statusCode}`)
      } else {
        resolve(x.data)
      }
    },
    fail: x => reject(x.errMsg)
  }))
}

export async function loginIntoServer() {
  // 登录
  const { code } = await wx.login()
  const res = await makeRequest({
    url: BASE_URL + '/wechat-mp/login',
    data: { code },
    method: 'POST',
  }, true)
  const { token } = (res as Record<string,any>) as LoginResponse
  wx.setStorageSync('token', token)
  console.log('token', token)
}