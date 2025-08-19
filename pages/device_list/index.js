const app = getApp();

Page({
    data: {
        list: [],
        text: '数据拉取中',
        rpxRatio: 1,
        openId:'123',
        nowTime:0
    },
    onLoad () {
        const _this = this;
        this.timer = setInterval(() => {
          const currentTime = (Date.now()-60*1000);
          // console.log("currentTime", currentTime)
          _this.setData({ nowTime: currentTime});
        }, 1000);
        if (app.globalData.session_key) {
          wx.navigateTo({
              url: '/pages/device/device',
              success (res) {
                  console.log(res)
              }
          })
        } else {
          app.globalData.redirect = '/pages/device/device'
          console.log("redirect login")
          wx.navigateTo({
              url: '/pages/profile/profile',
              success (res) {
                  console.log("jump login", res)
              }
          })
        }
    },
    onReady () {},
    onShow () {
        this.getDeviceInfo();
    },
    onHide () {},
    onUnload () {},
    onPullDownRefresh () {},
    onReachBottom () {},
    onShareAppMessage () {},
    onListClick (e) {
      console.log(e)
        const params = e.currentTarget.dataset
        if (!params) { 
          wx.showModal({
            title: '设备不存在或离线',
            showCancel: false
          });
        } else { 
          if (!params.device || params.device.status == 1) {
            wx.showModal({
              title: '设备不存在或离线',
              showCancel: false
            });
          } 
        }
        app.globalData.device = params.device
        console.log(app.globalData.device)
        wx.navigateTo({
          url: '/pages/device_detail/detail',
          success (res) {
              console.log(res)
          }
        })
    },
    getDeviceInfo() {
        let _this = this;
        let openId = this.data.openId
        if (app.globalData.openid) {
          openId = app.globalData.openid;
        }
        console.log("app.globalData.openid", app.globalData.openid)
        if (app.globalData.openid == null) {
          app.globalData.redirect = '/pages/device/device'
          console.log("redirect login")
          wx.navigateTo({
              url: '/pages/profile/profile',
              success (res) {
                  console.log("jump login", res)
              }
          })
        }
        console.log("openId:", openId)
        wx.showLoading({ title: '加载中' });
        wx.request({
            url: `${app.globalData.baseUrl}/device/list/${openId}`,
            header: { 'content-type': 'application/json' },
            success(res) {
                if (res.data.code == 200) {
                  console.log("device list", res.data.data)
                    if (res.data.data.length) _this.setData({ list: res.data.data });
                    else _this.setData({ text: '暂无数据' });
                } else wx.showModal({
                    title: '提示',
                    content: res.data.msg,
                    showCancel: false,
                    success(res) {
                        if (res.confirm) {
                            console.log('用户点击确定')
                        }
                    }
                });
            },
            fail(err) {
                wx.showModal({
                    title: '提示',
                    content: err.errMsg,
                    showCancel: false,
                    success(res) {
                        if (res.confirm) {
                            console.log('用户点击确定')
                        }
                    }
                });
            },
            complete() {
                wx.hideLoading();
            }
        });
    },
    addDevice() {
      console.log("start add device")
      wx.navigateTo({
        url: '/pages/smartConfig/smartConfig',
        success (res) {
            console.log(res)
        }
      })
    }
});