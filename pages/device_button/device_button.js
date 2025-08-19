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
        wx.setNavigationBarTitle({
          title: app.globalData.deviceMapping.baseDeviceName
        });
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
    handleUp(){
      console.log('up')
      this.startClick('前进')
    },
    handleDown(){
      console.log('down')
      this.startClick('后退')
    },
    handleLeft(){
      console.log('left')
      this.startClick('左转')
    },
    handleRight(){
      console.log('right')
      this.startClick('右转')
    },
    handleLight(){
      console.log('light')
      this.startClick('灯光')
    },
    handleModule(){
      console.log('module')
      this.startClick('模式')
    },
    startClick(name) {
      let _this = this;
      let arr = _this.data.list
      let clickCounts = this.data.clickCounts
      let deviceMapping = this.data.deviceMapping
      for (let index = 0; index < arr.length; index++) {
        if (arr[index].name == name) {
          console.log("name equals idx:",index)
          clickCounts[index]++
          this.setData({
            clickCounts
          });
          let item = arr[index]
          // 执行点击逻辑
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
        }
      }
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