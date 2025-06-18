const app = getApp();

Page({
    data: {
        list: [],
        text: '数据拉取中',
        rpxRatio: 1,
        deviceId: 0,
        addOptions: [],
        isModalShow: false // 控制选择框的显示与隐藏
    },
    onLoad () {
        const _this = this;
        console.log("onload")
        console.log("app.globalData.session_key", app.globalData.session_key)
        if (app.globalData.device) {
          _this.setData({
            deviceId: app.globalData.device.deviceId
          })
        } 
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
              url: '/pages/login/login',
              success (res) {
                  console.log(res)
              }
          })
      }
    },
    onReady () {},
    onShow () {
        this.getBaseDeviceList();
        this.getBaseDeviceInfo();
    },
    onHide () {},
    onUnload () {},
    onPullDownRefresh () {},
    onReachBottom () {},
    onShareAppMessage () {},
    getBaseDeviceInfo() {
        let _this = this;
        const deviceId = this.data.deviceId;
        console.log(this.data)
        console.log(app.globalData.baseUrl)
        wx.showLoading({ title: '加载中' });
        let url = `${getApp().globalData.baseUrl}/device/${deviceId}/base/list`
        wx.request({
            url: url,
            header: { 'content-type': 'application/json' },
            success(res) {
                if (res.data.code == 200) {
                  console.log(res.data)
                  if (res.data.data && res.data.data.length) {
                    console.log("填充 list")
                    _this.setData({ list: res.data.data });
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
    },
    getBaseDeviceList() {
      let _this = this;
        console.log("getBaseDeviceList")
        wx.showLoading({ title: '加载中' });
        wx.request({
            url: `${app.globalData.baseUrl}/device/base/list`,
            header: { 'content-type': 'application/json' },
            success(res) {
                if (res.data.code == 200) {
                  console.log(res.data)
                  if (res.data.data && res.data.data.length) {
                    console.log("fill base list")
                    _this.setData({ addOptions: res.data.data });
                  } else {
                    console.log("没数据")
                    _this.setData({ text: '暂无数据' });
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
    },
    showModal: function () {
      this.setData({
        isModalShow: true
      });
    },
    selectOption: function (e) {
      let _this = this;
      const index = e.currentTarget.dataset.index;
      const selectedOption = this.data.addOptions[index];
      const list = this.data.list;
      const deviceId = this.data.deviceId;
      console.log("selectedOption:", selectedOption)
      let url = `${app.globalData.baseUrl}/device/${deviceId}/base/add`
      wx.request({
            url: url,
            data: {
              "deviceId":deviceId,
              "baseId":selectedOption.id
            },
            method: 'POST',
            header: { 'content-type': 'application/json' },
            success(res) {
                if (res.data.code == 200) {
                  console.log("")
                  _this.setData({
                    isModalShow: false
                  });
                  _this.getBaseDeviceInfo()
                } else {
                  _this.setData({
                    isModalShow: false
                  });
                  wx.showModal({
                    title: '提示',
                    content: res.data.msg,
                    showCancel: false,
                    success(res) {
                        if (res.confirm) {
                            console.log('用户点击确定')
                        }
                    }
                });
              }
            },
            fail(err) {
              _this.setData({
                isModalShow: false
              });
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
    deleteItem: function(e) {
      let _this = this;
      const index = e.currentTarget.dataset.index;
      const item = this.data.list[index];
      console.log(item)
      const deviceId = this.data.deviceId;
      let url =  `${app.globalData.baseUrl}/device/${deviceId}/base/delete/${item.mappingId}`
      wx.request({
        url: url,
        method: 'POST',
        header: { 'content-type': 'application/json' },
        success(res) {
            if (res.data.code == 200) {
              console.log("删除成功")
              _this.getBaseDeviceInfo()
            } else {
              wx.showModal({
                title: '提示',
                content: res.data.msg,
                showCancel: false,
                success(res) {
                    if (res.confirm) {
                        console.log('用户点击确定')
                    }
                }
            });
          }
        },
        fail(err) {
          _this.setData({
            isModalShow: false
          });
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
    onListClick (e) {
      let _this = this;
      const index = e.currentTarget.dataset.index;
      const item = this.data.list[index];
      console.log(item)
      app.globalData.deviceMapping = item
      console.log(app.globalData.device)
      console.log(app.globalData.deviceMapping)
      wx.navigateTo({
        url: '/pages/device_button/device_button',
        success (res) {
            console.log(res)
        }
      });
    },
  
    hideModal: function () {
      this.setData({
        isModalShow: false
      });
    }
});