const app = getApp()
const defaultAvatarUrl = `https://pic.imgdb.cn/item/64367f2c0d2dde5777557749.png`


Page({
    data: {
        avatarUrl: null,
        userNickName: null
    },
    onShow:function() { 
      console.log('onShow', app.globalData.userInfo)
      if (app.globalData.userInfo) {
        let that = this;
        let avatarUrl
        if (app.globalData.userInfo.avatarUrl == "/f9f6f665-1e4c-44e7-9634-5bbde432ad6e.jpg" && (app.globalData.userInfo.nickName == '默认用户'||app.globalData.userInfo.nickName == '铲屎官momo')) {
          avatarUrl = defaultAvatarUrl
        } else {
          avatarUrl = `${app.globalData.baseUrl}/images${app.globalData.userInfo.avatarUrl}`
        }
        that.setData({
            avatarUrl: avatarUrl,
            userNickName: app.globalData.userInfo.nickName,
        })
      }
    },
    onLoad: function() {
      console.log('onLoad')
      console.log('global data', app.globalData)
      console.log('init info isLogin', app.globalData.isLogin)
      console.log('init info userInfo', app.globalData.userInfo)
      const that = this;
      
      // 第一步 登陆 or 注册

      if (app.globalData.isLogin) {
        console.log('init info')
        let avatarUrl
        if (app.globalData.userInfo.avatarUrl == "/f9f6f665-1e4c-44e7-9634-5bbde432ad6e.jpg" && (app.globalData.userInfo.nickName == '默认用户'||app.globalData.userInfo.nickName == '铲屎官momo')) {
          avatarUrl = defaultAvatarUrl
        } else {
          avatarUrl = `${app.globalData.baseUrl}/images${app.globalData.userInfo.avatarUrl}`
        }
        that.setData({
            avatarUrl: avatarUrl,
            userNickName: app.globalData.userInfo.nickName,
        })
      }
    },
     // 点击头像或昵称
    onTapAvatar() {
      if (!this.data.userNickName) {
        this.startLogin();
      } else {
        console.log('start click user info todo jump')
        wx.navigateTo({
          url: '/pages/setting/setting',
        })
      }
    },
    startLogin() {
      const that = this;
      wx.showLoading({
        title: '登录中',
      });
      //弹窗 
      // 开始登陆
      wx.login({
        success (res) {
            if (res.code) {
                console.log("resCode", res.code)
                wx.request({
                    url: `${app.globalData.baseUrl}/api/auth/login`,
                    header: { 'content-type': 'application/json' },
                    method: 'POST',
                    data: { code: res.code },
                    success (r) {
                      console.log("login success data:", r.data)
                        if (r.data.code == 200) {
                          app.globalData.userInfo = r.data.data.userInfo
                          app.globalData.sessionKey = r.data.data.sessionKey
                          app.globalData.openid = r.data.data.openid
                          app.globalData.isLogin = r.data.data.login
                          if (r.data.data.userInfo) {
                            that.setData({
                              avatarUrl: `${app.globalData.baseUrl}/images${r.data.data.userInfo.avatarUrl}`,
                              userNickName:r.data.data.userInfo.nickName,
                            })
                          }
                          wx.hideLoading();
                          console.log("r.data.login", r.data.data.login)
                          if (!r.data.data.login) {
                            if (true) {
                              //跳转到注册页面，注册成功回调当前页面
                              app.globalData.redirect = '/pages/profile/profile'
                              wx.navigateTo({
                                  url: '/pages/register/register',
                                  success (res) {
                                      console.log(res)
                                  }
                              })
                            }
                          }
                        } else {
                          wx.showModal({
                            title: '登录失败',
                            content: r.data.message,
                            confirmText: '重试',
                            cancelText: '取消',
                            success: (res) => {
                              if (res.confirm) {
                                // 点击重试后的逻辑，这里可以调用登录函数重新登录
                                that.startLogin()
                              }
                            }
                          });
                        }
                    },
                    fail(err) {
                      wx.showModal({
                        title: '登录失败',
                        content: '请检查您的网络或账号信息，是否重试？',
                        confirmText: '重试',
                        cancelText: '取消',
                        success: (res) => {
                          if (res.confirm) {
                            // 点击重试后的逻辑，这里可以调用登录函数重新登录
                            that.startLogin()
                          }
                        }
                      });
                    },
                })
            } else {
                console.log(res.errMsg)
            }
        }
      });
    },
    goToPrivacy() {
      wx.navigateTo({
        url: '/pages/personal/privacy/privacy',
      })
    },
    goToAboutUs() {
      wx.navigateTo({
        url: '/pages/personal/about_us/about_us',
      })
    },
    goToSuggest() {
      wx.navigateTo({
        url: '/pages/personal/suggest/suggest',
      })
    },
});