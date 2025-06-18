// pages/register/register.js
const app = getApp();

Page({
  data: {
    avatarUrl: '',
    nickName: ''
  },
  onNicknameReview(e) {
    if (e.detail.pass) {
      console.log("无违规内容")
    } else {
      wx.showToast({
        title: '昵称包含违规内容',
        icon: 'none'
      });
    }
  },
  bindKeyInput(e) {
    console.log("bindKeyInput:", e)
  },
  bindKeyBlur(e) {
    if (e.detail.value) {
      this.setData({
        nickName: e.detail.value
      })
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
    
  },
  
  saveInputValue(e) {
    console.log(e)
    console.log("nickName:",this.data.nickName)
  },
  register() {
    // 开始注册
    const { avatarUrl, nickName } = this.data;
    if (!avatarUrl) {
      wx.showToast({
        title: '请上传头像',
        icon: 'none'
      });
      return;
    }
    if (!nickName) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    this.startRegister()
  },
  startRegister() {
    const that = this;
    const { avatarUrl, nickName } = that.data;
    wx.showLoading({
      title: '注册中',
    });
    //弹窗 
    // 开始登陆
    wx.login({
      success (res) {
          if (res.code) {
              console.log("resCode", res.code)
              const code = res.code
              that.base64(avatarUrl, "png").then(res => {
              console.log(res, 'base64路径') //res是base64路径
              //todo 异步保存到服务器并返回服务器图片地址
              var url = `${app.globalData.baseUrl}/api/auth/register`
              wx.request({
                url: url,
                data: {
                  "nickName":nickName,
                  "base64Image":res,
                  "code":code
                },
                method: 'POST',
                header: {
                  'content-type': 'application/json'
                },
                success: function (res) {
                  console.log('请求成功', res.data);
                  wx.hideLoading();
                  console.log(app.globalData.redirect)
                  wx.reLaunch({ url: app.globalData.redirect})
                  // 在这里处理请求成功后的逻辑，例如更新页面数据等
                },
                fail: function (err) {
                  console.log('请求失败', err);
                  wx.hideLoading();
                  wx.showModal({
                    title: '注册失败',
                    content: err.errMsg,
                    confirmText: '重试',
                    cancelText: '取消',
                    success: (res) => {
                      if (res.confirm) {
                        // 点击重试后的逻辑，这里可以调用登录函数重新登录
                        that.startRegister()
                      }
                    }
                  });
                  // 处理请求失败的情况，比如提示用户错误信息
                }
              })
            })
          }
      }
    });
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