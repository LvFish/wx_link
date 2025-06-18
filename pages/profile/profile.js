const app = getApp()
const defaultAvatarUrl = `${app.globalData.baseUrl}/images/a6c71f73-4fbf-4ee9-b453-2ff1658625d4.jpg`


Page({
    data: {
        motto: '软件定义硬件',
        avatarUrl: defaultAvatarUrl,
        userNickName:""
    },
    onLoad: function() {
      console.log('app.globalData')
      console.log(app.globalData)
      const that = this;
      // 第一步 登陆 or 注册

      if (app.globalData.isLogin) {
        that.setData({
              avatarUrl: app.globalData.userInfo.avatarUrl,
              userNickName: app.globalData.userInfo.nickName,
          })
          if (app.globalData.userInfo.avatarUrl) {
            this.setData({
              avatarUrl: `${app.globalData.baseUrl}/images${app.globalData.userInfo.avatarUrl}`,
            })
          }
        } else {
          that.startLogin()
        }
    },
    onChooseAvatar(e) {
      const {
        avatarUrl
      } = e.detail
      this.setData({
        avatarUrl,
      })
      console.log(avatarUrl, "avatarUrl");
      this.base64(avatarUrl, "png").then(res => {
        console.log(res, 'base64路径') //res是base64路径
        //todo 异步保存到服务器并返回服务器图片地址
        var url = `${app.globalData.baseUrl}/image/${app.globalData.userInfo.openid}/upload`
        wx.request({
          url: url,
          data: res,
          method: 'POST',
          header: {
            'content-type': 'text/plain' // 设置请求头为 text/plain，表示发送纯文本数据
          },
          success: function (res) {
            console.log('请求成功', res.data);
            // 在这里处理请求成功后的逻辑，例如更新页面数据等
          },
          fail: function (err) {
            console.log('请求失败', err);
            // 处理请求失败的情况，比如提示用户错误信息
          }
        })
      })
      console.log(avatarUrl, '1');
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
    saveInputValue(e) {
      console.log(e)
      console.log("nickName:",this.data.userNickName)
    },
    // 图片转64代码
    base64(url, type) {
      return new Promise((resolve, reject) => {
        wx.getFileSystemManager().readFile({
          filePath: url, //选择图片返回的相对路径
          encoding: 'base64', //编码格式
          success: res => {
            // resolve('data:image/' + type.toLocaleLowerCase() + ';base64,' + res.data)
            resolve(res.data)
            if (r.data.code == 200) {
              this.setData({
                avatarUrl:`${app.globalData.baseUrl}/images${res.data.data}`,
              })
            }
          },
          fail: res => reject(res.errMsg)
        })
      })
    },
});