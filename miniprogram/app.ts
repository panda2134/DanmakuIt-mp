// app.ts
import { loginIntoServer } from './utils/util'

App<IAppOption>({
  globalData: {},
  async onLaunch() {
    await loginIntoServer()
  },
})