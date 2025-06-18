// pages/detail/detail.js
Page({
  data: {
    buttonList: [
      
    ] // 存储按钮的列表
  },

  getButtonList: function(e) {
    console.log(e)
    const url = `http://localhost:8080/device/${e}/button/list`
    wx.request({
      url: url,
      method: 'GET',
      success: (res) => {
        console.log(res)
        if (res.data.code === 200) {
          this.setData({
            buttonList: res.data.data
          });
          console.log(this.data.buttonList)
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '获取设备列表失败',
          icon: 'none'
        });
      }
    })
  },

  clickButton(e) {
    const index = e.currentTarget.dataset.id
    const list = this.data.buttonList
    list.forEach(function(item) {
      if (index === item.id) {
        console.log(item)
        const url = `http://8.130.106.15:8080/device/${item.deviceId}/button/${index}/click`
        wx.request({
          url: url,
          method: 'POST',
          success: (res) => {
            console.log(res)
            if (res.data.code === 200) {
              console.log("点击了按钮")
            }
          },
          fail: (err) => {
            wx.showToast({
              title: '点击按钮失败',
              icon: 'none'
            });
          }
        })
      }
    })
  },

  onLoad: function(options) {
    console.log(options)
    let title = options.name
    let deviceId = options.id
    wx.setNavigationBarTitle({
      title: title
    })
    this.getButtonList(deviceId)
  }
})