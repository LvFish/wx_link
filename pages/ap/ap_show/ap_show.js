// pages/ap_show/ap_show.js
Page({
  data: {
    isWifiSelected: true, // 模拟已选中WiFi，实际可根据选中状态修改
  },
  gotoWifiSetting() {
    // 调用微信API跳转到系统WiFi设置页面
    wx.openSetting({
      success: (res) => {
        console.log('进入WiFi设置页面成功', res);
      },
      fail: (err) => {
        console.error('进入WiFi设置页面失败', err);
      }
    });
  },
  goNext() {
    console.log('goNext')
    // 点击“下一步”的逻辑，比如跳转到下一个配置页面
    wx.navigateTo({
      url: "../ap_next_step/ap_next_step",
    });
  }
});