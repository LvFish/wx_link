// app.js
App({
  globalData: {
    baseUrl: 'https://www.paswlink.top', // 基础域名前缀
    userInfo: null,
    openid: null,
    sessionKey: null,
    device: {},
    deviceMapping: {},
    location: {
        latitude: 23.099994,
        longitude: 113.324520
    },
    redirect: null,
    isLogin : false,
    hasCheckedDeviceVersion: []
  },

  onLaunch() {
    // this.startLogin(); 
    // const _this = this;
  },
  checkNewVersion () { // 检查版本更新
      // 获取小程序更新机制兼容
      if (wx.canIUse("getUpdateManager")) {
          const updateManager = wx.getUpdateManager();
          updateManager.onCheckForUpdate(function(res) {
              // 请求完新版本信息的回调
              if (res.hasUpdate) {
                  updateManager.onUpdateReady(function() {
                      wx.showModal({
                          title: "更新提示",
                          content: "新版本已经准备好，是否重启应用？",
                          success: function(res) {
                              if (res.confirm) {
                                  // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                                  updateManager.applyUpdate();
                              }
                          }
                      });
                  });
                  updateManager.onUpdateFailed(function() {
                      // 新的版本下载失败
                      wx.showModal({
                          title: "已经有新版本了哟~",
                          content: "新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~"
                      });
                  });
              }
          });
      } else {
          wx.showModal({
              title: "提示",
              content: "当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。"
          });
      }
  },
  startLogin() {
    return new Promise((resolve, reject) => {
    
    const that = this;
    if (that.globalData.openid) {
      resolve(that.globalData.openid);
      return;
    }
    //弹窗 
    // 开始登陆
    wx.login({
      success (res) {
          if (res.code) {
              console.log("resCode", res.code)
              wx.request({
                  url: `${that.globalData.baseUrl}/api/auth/login`,
                  header: { 'content-type': 'application/json' },
                  method: 'POST',
                  data: { code: res.code },
                  success (r) {
                    console.log("login success data:", r.data)
                      if (r.data.code == 200) {
                        that.globalData.userInfo = r.data.data.userInfo
                        that.globalData.sessionKey = r.data.data.sessionKey
                        that.globalData.openid = r.data.data.openid
                        that.globalData.isLogin = r.data.data.login
                        resolve(that.globalData.openid);
                        return;
                      } else {
                        reject(new Error('登陆失败，请重试'));
                        return;
                      }
                  },
                  fail(err) {
                    reject(new Error('登陆失败，请重试'));
                    return;
                  },
              })
          } else {
            reject(new Error('登陆失败，请重试'));
            return;
          }
      }
    });
    });
  }
  
})
