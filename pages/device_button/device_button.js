const app = getApp();

Page({
    data: {
        deviceMapping: {},
        list: [],
        clickCounts: [0,0,0,0,1,1],
        text: '数据拉取中',
        rpxRatio: 1,
        currentUp: '/icon/up.png',
        currentDown: '/icon/down.png',
        currentLeft: '/icon/left.png',
        currentRight: '/icon/right.png',
        currentModel: '/icon/open.png',
        currentLight: '/icon/open.png',
        modelActive: true,
        lightActive: true
    },
    onLoad () {
        const _this = this;
        wx.setNavigationBarTitle({
          title: app.globalData.deviceMapping.baseDeviceName
        });
        if (app.globalData.deviceMapping) {
          const result = app.globalData.deviceMapping.buttons.map(button => {
            const { name } = button;
            // 检查name是否为“模式”或“灯光”（严格匹配，区分大小写）
            return name === '模式' || name === '灯光' ? 1 : 0;
          });
          _this.setData({
            deviceMapping: app.globalData.deviceMapping,
            list: app.globalData.deviceMapping.buttons,
            clickCounts: result,
            modelActive: true,
            lightActive: true
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
      let temp = this.data.currentLight
      let lightActive = this.data.lightActive
      lightActive = !lightActive
      if (lightActive) {
        temp = "/icon/open_active.png"
      } else {
        temp = "/icon/open.png"
      }
      this.setData({
        currentLight: temp,
        lightActive: lightActive,
      })
      this.startClick('灯光')
    },
    handleModule(){
      console.log('module')
      let temp = this.data.currentModel
      let modelActive = this.data.modelActive
      modelActive = !modelActive
      if (modelActive) {
        temp = "/icon/open_active.png"
      } else {
        temp = "/icon/open.png"
      }
      
      this.setData({
        currentModel: temp,
        modelActive: modelActive,
      })
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
          let url = `${getApp().globalData.baseUrl}/device/${deviceMapping.deviceId}/base/${deviceMapping.baseDeviceId}/click/${item.id}?clickCount=${clickCounts[index]}`
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
    },

    handleTouchStart(e) {
      const params = e.currentTarget.dataset;
      if (params) {
        if (params.name == "left") {
          this.setData({
            currentLeft: '/icon/left_active.png'
          });
        } else if (params.name == "right") {
          this.setData({
            currentRight: '/icon/right_active.png'
          });
        } else if (params.name == "up") {
          this.setData({
            currentUp: '/icon/up_active.png'
          });
        } else if (params.name == "down") {
          this.setData({
            currentDown: '/icon/down_active.png'
          });
        }
      }
    
    },
    handleTouchEnd(e) {
      const params = e.currentTarget.dataset;
      if (params) {
        if (params.name == "left") {
          this.setData({
            currentLeft: '/icon/left.png'
          });
        } else if (params.name == "right") {
          this.setData({
            currentRight: '/icon/right.png'
          });
        } else if (params.name == "up") {
          this.setData({
            currentUp: '/icon/up.png'
          });
        } else if (params.name == "down") {
          this.setData({
            currentDown: '/icon/down.png'
          });
        }
      }
    }
});