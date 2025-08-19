const app = getApp();

Page({
  data: {
    isModalShow: false,
    isDeviceUpdate: false,
    inputValue:"",
    currentRepeater: { id: 1, name: '中继器1', status: true },
    repeaters: [
      { id: 1, name: '中继器1', status: true },
      { id: 2, name: '中继器2', status: false },
      { id: 3, name: '中继器3', status: true }
    ],
    list: [],
    currentDevice: null,
    toyList: [],
    toys: [
      { id: 1, name: '玩具1', disabled: false }, // 启用态
      { id: 2, name: '玩具2', disabled: true }  // 禁用态
    ]
  },

  onShow() {
    this.onLoad();
  },

  async onLoad(options) {
    const _this = this;
    console.log('openid',app.globalData.openid)
    if (app.globalData.openid == null) {
      console.log('start login')
      try {
        await app.startLogin();
        this.getDeviceInfo();
      } catch (error){
        console.error('登录或数据加载失败', error);
        wx.showModal({
          title: "登陆错误",
          content: "登陆错误，请重试",
          success: function(res) {
              if (res.confirm) {
                _this.onReloadLogin();
              }
          }
        });
      }
    } else {
      this.getDeviceInfo();
    }
  },

  onReloadLogin() {
    this.onLoad();
  },

  addMapping(deviceId, toyId) {
    console.log("addMapping: deviceId,", deviceId)
    console.log("addMapping: toyId,", toyId)
    let url = `${app.globalData.baseUrl}/device/${deviceId}/base/add`
    wx.request({
      url: url,
      data: {
        "deviceId":deviceId,
        "baseId":toyId
      },
      method: 'POST',
      header: { 'content-type': 'application/json' },
      success(res) {
          if (res.data.code == 200) {
            return true
          } else {
            return false
          }
      }
    });
    return false
  },

  deleteMapping(deviceId, toyId) {
    console.log("addMapping: deviceId,", deviceId)
    console.log("addMapping: toyId,", toyId)
    let url =  `${app.globalData.baseUrl}/device/${deviceId}/base/${toyId}/delete`
    wx.request({
      url: url,
      method: 'POST',
      header: { 'content-type': 'application/json' },
      success(res) {
          if (res.data.code == 200) {
            return true
          } else {
            return false
          }
      }
    });
    return false
  },

  getToyList() {
    console.log('start get toyList')
    let _this = this;
    let currentDevice = _this.data.currentDevice;
    console.log('currentDevice', currentDevice)
    let deviceId = currentDevice.deviceId
    if (app.globalData.openid) {
      wx.request({
        url: `${app.globalData.baseUrl}/device/${deviceId}/toy/list`,
        header: { 'content-type': 'application/json' },
        success(res) {
            if (res.data.code == 200) {
              console.log("toy list", res.data.data)
              if (res.data.data.length > 0) {
                _this.setData({ 
                  toyList: res.data.data
                });
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
        }
      });
    }
  },

  getDeviceInfo() {
    let _this = this;
    let openId;
    console.log('start getDeviceInfo')
    if (app.globalData.openid) {
      openId = app.globalData.openid;
      console.log('start getDeviceInfo2')
      wx.request({
        url: `${app.globalData.baseUrl}/device/list/${openId}`,
        header: { 'content-type': 'application/json' },
        success(res) {
            if (res.data.code == 200) {
              console.log("device list", res.data.data)
              if (res.data.data.length > 0) {
                _this.setData({ 
                  list: res.data.data,
                  currentDevice: res.data.data[0]
                });
                _this.getToyList();
              } else {
                _this.setData({ 
                  list: [],
                  currentDevice: null,
                  toyList: [],
                })
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
      // start load
    }
  },

  // 开关状态变化
  onSwitchChange(e) {
    console.log("e", e)
    const index = e.currentTarget.dataset.index;
    const toyList = [...this.data.toyList];
    toyList[index].enable = !toyList[index].enable; // 切换禁用状态
    const toy = toyList[index]
    if (toyList[index].enable) {
      // 启用，需要add
      this.addMapping(toy.deviceId, toy.baseDeviceId)
    } else {
      this.deleteMapping(toy.deviceId, toy.baseDeviceId)
    }
    this.setData({ toyList });
    console.log(123)
  },

  // 修改名称
  onModifyName() {
    this.setData({
      isDeviceUpdate: true,
      inputValue: this.data.currentDevice.name
    })
  },

  // 输入内容变化时更新临时值
  onInputChange(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  onSaveName() {
    if (this.data.inputValue == "") {
      wx.showToast({
        title: '名称不能为空',
        icon: 'none'
      });
      return;
    }
    let that = this;
    let currentDevice = this.data.currentDevice;
    let deviceId = currentDevice.deviceId
    currentDevice.name = this.data.inputValue;
    //修改device信息
    let url = `${app.globalData.baseUrl}/device/${deviceId}/update`;
    wx.request({
      url: url,
      data: {
        "name":this.data.inputValue
      },
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        console.log('请求成功', res.data);
        if (res.data.code == 200) {
          wx.showToast({
            title: '修改成功',
            icon: 'none'
          });
          console.log("currentDevice", currentDevice)
          let list = that.data.list;
          for(var index = 0; index < list, index++;) {
            if (list[index].deviceId == currentDevice.deviceId) {
              list[index] = currentDevice;
            }
          }
          that.setData({
            isDeviceUpdate: false,
            currentDevice: currentDevice,
            list: list,
          })
        } else {
          wx.showToast({
            title: '修改失败',
            icon: 'none'
          });
          that.setData({
            isDeviceUpdate: false,
          })
        }
      },
      fail: function (err) {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
        that.setData({
          isDeviceUpdate: false
        })
      }
    })
  },
  
  //切换中继器
  onSwitchDevice() {
    console.log('start switch')
    let that = this;
    const currentTime = (Date.now()-60*1000);
    console.log('currentTime', currentTime)
    let openId = app.globalData.openid;
    // 重新获取中继器
    wx.request({
      url: `${app.globalData.baseUrl}/device/list/${openId}`,
      header: { 'content-type': 'application/json' },
      success(res) {
        // 1751121080795 1751121055663
          if (res.data.code == 200) {
            console.log("device list", res.data.data)
            let tempList = res.data.data
            console.log('tempList.length', tempList.length);
            let index;
            for(index = 0; index < tempList.length; index++) {
              console.log('index', index);
              if (tempList[index].updateTime > currentTime) {
                tempList[index].status = 1
              } else {
                tempList[index].status = 0
              }
            }
            console.log('index', index)
            console.log('tempList', tempList)
            that.setData({
              isModalShow: true,
              list:tempList,
            });
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
    });
   
  },
  // 关闭弹窗
  closeModal() {
    this.setData({
      isModalShow: false
    });
  },
  // 切换中继器
  switchRepeater(e) {
    const repeaterId = e.currentTarget.dataset.id;
    const repeater = this.data.list.find(item => item.deviceId === repeaterId);
    console.log('repeater', repeater)
    if (repeater) {
      this.setData({
        currentDevice: repeater,
        isModalShow: false
      });
      this.getToyList();
    }
  },

  // 前往添加中继器页面
  goToAddRepeater() {
    this.closeModal();
    wx.navigateTo({
      url: '/pages/smartConfig/smartConfig',
      success (res) {
          console.log(res)
      }
    })
  },

  // 删除中继器
  onDeleteRepeater() {
    let that = this;
    wx.showModal({
      title: '提示',
      content: '确定要删除这个中继器吗？',
      success: (res) => {
        if (res.confirm) {
          let openId = app.globalData.openid;
          const deviceId = that.data.currentDevice.deviceId
          console.log('deviceId', deviceId)
          let url = `${app.globalData.baseUrl}/device/delete/${openId}/${deviceId}`
          wx.request({
            url: url,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            success(res) {
              if (res.data.code == 200) {
                wx.showToast({ title: '删除成功', icon: 'success' });
                that.onLoad();
              } else {
                wx.showToast({ title: '删除失败', icon: 'fail' });
              }
            }, fail(err) {
              wx.showToast({ title: '删除失败', icon: 'fail' });
            }
          });
          // 可添加：调用删除接口的逻辑
        }
      }
    });
  },

  onListClick (e) {
    console.log("e", e)
    const index = e.currentTarget.dataset.index;
    const item = this.data.toyList[index];
    console.log(item)
    if (!item.enable) {
      wx.showToast({
        title: '请先启用玩具',
        icon: 'none'
      });
      return;
    }
    app.globalData.deviceMapping = item
    console.log(app.globalData.deviceMapping)
    wx.navigateTo({
      url: '/pages/device_button/device_button',
      success (res) {
          console.log(res)
      }
    });
  },
})