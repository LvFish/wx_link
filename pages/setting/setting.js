const app = getApp()
// pages/setting/setting.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userNickName:'默认用户',
    avatarUrl: 'https://pic.imgdb.cn/item/64367f2c0d2dde5777557749.png',
    isShowName: false,
    openId: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    console.log('init info userInfo', app.globalData.userInfo)
    const userInfo = app.globalData.userInfo;
    this.setData({
      userNickName: userInfo.nickName,
      avatarUrl: `${app.globalData.baseUrl}/images${userInfo.avatarUrl}`,
      openId: userInfo.openid,
    })
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
  onUpdateNickName() {
    this.setData({
      'isShowName':true,
    })
  },
  onNickNameCancel() {
    this.setData({
      'isShowName':false,
    })
  },
  onNickNameConfirm(e) {
    console.log(e.detail)
    let that = this;
    let userNickName = e.detail.nickname;
    let openId = that.data.openId;
    if (!userNickName) {
      wx.showToast({
        title: '昵称不能为空',
      })
    } else {
      let url = `${app.globalData.baseUrl}/api/auth/${openId}/update`
      wx.request({
        url: url,
        method: 'POST',
        data: {
          "nickName":userNickName
        },
        success: (res) => {
          console.log(res)
          if (res.data.code === 200) {
            console.log("保存成功")
            app.globalData.userInfo.nickName = userNickName;
            console.log(app.globalData.userInfo)
            that.setData({
              userNickName: userNickName,
              isShowName: false,
            })
            wx.reLaunch('/pages/profile/profile')
          }
        },
        fail: (err) => {
          wx.showToast({
            title: '保存失败，请重试',
            icon: 'none'
          });
        }
      })
    }
  },
  onChooseAvatar(e) {
    let that = this;
    let openId = that.data.openId;
    const {
      avatarUrl
    } = e.detail
    that.base64(avatarUrl, "png").then(res => {
      console.log(res, 'base64路径') //res是base64路径
      // 执行保存图片操作
      let url = `${app.globalData.baseUrl}/api/auth/${openId}/update`
      wx.request({
        url: url,
        method: 'POST',
        data: {
          "base64Image":res
        },
        success: (res) => {
          console.log(res)
          if (res.data.code === 200) {
            console.log("保存成功", res.data.data)
            app.globalData.userInfo.avatarUrl = res.data.data.avatarUrl;
            wx.reLaunch('/pages/profile/profile')
          }
          that.setData({
            avatarUrl,
          })
        },
        fail: (err) => {
          wx.showToast({
            title: '保存失败，请重试',
            icon: 'none'
          });
        }
      })
    });
  },
  // 图片转64代码
  base64(url, type) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: url, //选择图片返回的相对路径
        encoding: 'base64', //编码格式
        success: res => {
          // resolve('data:image/' + type.toLocaleLowerCase() + ';base64,' + res.data)
          resolve(res.data)
          if (r.data.code == 200) {
            this.setData({
              avatarUrl:`${app.globalData.baseUrl}/images${res.data.data}`,
            })
          }
        },
        fail: res => reject(res.errMsg)
      })
    })
  }
})