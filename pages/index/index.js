// index.js
Page({
  data: {
    // 设备列表，模拟数据
    deviceList: [
    ]
  },
  onLoad: function() {
    this.getDevicesList();
  },

  getDevicesList: function() {
    wx.request({
      url: 'http://8.130.106.15:8080/device/list/123',
      method: 'GET',
      success: (res) => {
        console.log(res)
        if (res.data.code === 200) {
          this.setData({
            deviceList: res.data.data
          });
        }
      },
      fail: (err) => {
        console.log(err.errMsg)
        wx.showToast({
          title: '获取设备列表失败',
          icon: 'none'
        });
      }
    })
  },
  // 添加设备函数，可跳转到添加页面或弹出添加弹窗
  addDevice() {
    wx.showToast({
      title: '暂未实现添加功能',
      icon: 'none'
    });
  },
  // 编辑设备函数
  editDevice(e) {
    console.log(e.currentTarget)
    const deviceId = e.currentTarget.dataset.id;
    let deviceInfo;
    this.data.deviceList.forEach(function(num) {
      if (num.deviceId === deviceId) {
        deviceInfo = num;
      }
    });
    wx.navigateTo({
      url: `/pages/detail/detail?id=${deviceId}&name=${deviceInfo.name}`  // 替换为您要跳转的页面路径
    });
  },
  handleDelete: function (e) {
    // 获取 data-device-id 属性的值
    const deviceId = e.currentTarget.dataset.id;
    // 显示确认提示框
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该设备吗？',
      success: (res) => {
        if (res.confirm) {
          const url = `http://8.130.106.15:8080/device/delete/123/${deviceId}`;
          // 用户点击确定，发送 POST 请求
          wx.request({
            url: url, // 替换为实际的删除接口地址
            method: 'POST',
            header: {
              'content-type': 'application/json' // 默认值
            },
            success: (res) => {
              console.log(res)
              if (res.data.code === 200) {
                // 删除成功，给出提示
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                // 调用重新渲染页面的函数
                this.reloadPage(deviceId);
              } else {
                // 删除失败，给出提示
                wx.showToast({
                  title: '删除失败',
                  icon: 'none'
                });
              }
            },
            fail: (err) => {
              // 请求失败，给出提示
              wx.showToast({
                title: '请求失败',
                icon: 'none'
              });
            }
          });
        } else if (res.cancel) {
          // 用户点击取消，给出提示
          wx.showToast({
            title: '已取消删除',
            icon: 'none'
          });
        }
      }
    });
  },
  reloadPage: function (deletedDeviceId) {
    // 过滤掉已删除的设备
    const newDeviceList = this.data.deviceList.filter(device => device.deviceId!== deletedDeviceId);
    // 更新页面数据
    this.setData({
        deviceList: newDeviceList
    });
  }
});