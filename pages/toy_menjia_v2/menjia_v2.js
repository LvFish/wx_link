// pages/toy_menjia_v2/menjia_v2.js
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    speedText: '静止',
    windSpeed: 0,
    windSpeedProgress: 0, // 百分比
    speedOptions: ['静止', '慢速', '中速', '高速'],
    deviceMapping: {},
    list: [],
    clickCounts: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const _this = this;
    wx.setNavigationBarTitle({
      title: app.globalData.deviceMapping.baseDeviceName || '控制界面'
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

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次页面显示时重置为静止状态
    this.setData({
      speedText: '静止',
      windSpeed: 0,
      windSpeedProgress: 0
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // startClick函数，用于处理按钮点击后发起http请求
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
          }
        });
      }
    }
  },

  // 速度减号按钮点击事件
  onMinusSpeed: function() {
    const currentIndex = this.data.speedOptions.indexOf(this.data.speedText);
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      let progress = 0;
      if (newIndex === 0) {
        progress = 0;
      } else if (newIndex === 1) {
        progress = 33;
      } else if (newIndex === 2) {
        progress = 66;
      } else {
        progress = 100;
      }
      this.setData({
        speedText: this.data.speedOptions[newIndex],
        windSpeed: newIndex * 2,
        windSpeedProgress: progress
      });
      // 调用startClick函数，发送http请求
      if (newIndex === 0) {
        // 静止状态，执行待机逻辑
        this.startClick('关');
      } else {
        this.startClick(this.data.speedOptions[newIndex]);
      }
    }
  },

  // 速度加号按钮点击事件
  onPlusSpeed: function() {
    const currentIndex = this.data.speedOptions.indexOf(this.data.speedText);
    if (currentIndex < this.data.speedOptions.length - 1) {
      const newIndex = currentIndex + 1;
      let progress = 0;
      if (newIndex === 0) {
        progress = 0;
      } else if (newIndex === 1) {
        progress = 33;
      } else if (newIndex === 2) {
        progress = 66;
      } else {
        progress = 100;
      }
      this.setData({
        speedText: this.data.speedOptions[newIndex],
        windSpeed: newIndex * 2,
        windSpeedProgress: progress
      });
      // 调用startClick函数，发送http请求
      this.startClick(this.data.speedOptions[newIndex]);
    }
  },

  // 开机按钮点击事件
  onPowerOn: function() {
    this.startClick('开');
    this.startClick('中速');
    this.setData({
      speedText: '中速',
      windSpeed: 4,
      windSpeedProgress: 66
    });
    wx.showToast({
      title: '已开机',
      icon: 'success'
    });
  },

  // 待机按钮点击事件
  onStandby: function() {
    this.startClick('关');
    this.setData({
      speedText: '静止',
      windSpeed: 0,
      windSpeedProgress: 0
    });
    wx.showToast({
      title: '已进入待机模式',
      icon: 'success'
    });
  },

  // 收绳按钮点击事件
  onRetract: function() {
    this.startClick('收绳');
    wx.showToast({
      title: '收绳功能已启动',
      icon: 'success'
    });
  },

  // 省电关机按钮点击事件
  onPowerOff: function() {
    wx.showModal({
      title: '提示',
      content: '确定要执行省电关机吗？关机后需要手动开启玩具开关才能再次远程控制。',
      success: (res) => {
        if (res.confirm) {
          this.startClick('关机');
          wx.showToast({
            title: '已执行省电关机',
            icon: 'success'
          });
        }
      }
    });
  }
})