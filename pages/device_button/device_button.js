const app = getApp();

Page({
    data: {
        deviceMapping: {},
        list: [],
        clickCounts: [],
        text: '数据拉取中',
        rpxRatio: 1,
    },
    onLoad () {
        const _this = this;
        console.log("onload button list")
        if (app.globalData.deviceMapping) {
          const newArray = new Array(app.globalData.deviceMapping.buttons.length).fill(0);
          _this.setData({
            deviceMapping: app.globalData.deviceMapping,
            list: app.globalData.deviceMapping.buttons,
            clickCounts: newArray
          })
        } else {
          app.globalData.redirect = '/pages/device/device'
          console.log("redirect login")
          wx.navigateTo({
              url: '/pages/login/login',
              success (res) {
                  console.log(res)
              }
          })
      }
    },
    onReady () {},
    onShow () {
        
    },
    onHide () {},
    onUnload () {},
    onPullDownRefresh () {},
    onReachBottom () {},
    onShareAppMessage () {},
    showModal: function () {
      this.setData({
        isModalShow: true
      });
    },
    onListClick (e) {
      let _this = this;
      const index = e.currentTarget.dataset.index;
      const item = this.data.list[index];
      const clickCounts = this.data.clickCounts;
      const deviceMapping = this.data.deviceMapping
      console.log(item)
      console.log(deviceMapping)
      clickCounts[index]++
      this.setData({
        clickCounts
      });

      let url = `${getApp().globalData.baseUrl}/device/${deviceMapping.deviceId}/base/${deviceMapping.mappingId}/click/${item.id}?clickCount=${clickCounts[index]}`
      wx.request({
        url: url,
        header: { 'content-type': 'application/json' },
        method: 'POST',
        success(res) {
            if (res.data.code == 200) {
              console.log(res.data)
              if (res.data.data && res.data.data.length) {
                console.log("点击成功")
              }
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
      // todo 发起按钮点击
    },
  
    hideModal: function () {
      this.setData({
        isModalShow: false
      });
    }
});