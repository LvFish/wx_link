// pages/personal/suggest/suggest.js
Page({
  data: {
    feedbackText: '',
    contactInfo: '',
    charCount: 0,
    imageList: [], // 存储本地图片路径
    imageUriMap: {}, // 存储本地路径到服务器URI的映射
    imageCount: 0
  },

  onInputChange(e) {
    const text = e.detail.value;
    this.setData({
      feedbackText: text,
      charCount: text.length
    });
  },

  onContactChange(e) {
    this.setData({
      contactInfo: e.detail.value
    });
  },

  chooseImage() {
    const { imageCount } = this.data;
    const count = 4 - imageCount;
    
    wx.chooseImage({
      count: count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        
        // 直接显示本地图片
        this.setData({
          imageList: [...this.data.imageList, ...tempFilePaths],
          imageCount: this.data.imageCount + tempFilePaths.length
        });
        
        // 后台异步上传图片
        this.uploadImagesAsync(tempFilePaths);
      }
    });
  },

  // 异步上传图片（不影响界面显示）
  uploadImagesAsync(filePaths) {
    const uploadPromises = filePaths.map(filePath => this.uploadImage(filePath));
    
    Promise.all(uploadPromises)
      .then(results => {
        // results包含上传成功的URI信息
        console.log('图片上传成功，URI列表:', results);
        // 更新URI映射
        const newUriMap = { ...this.data.imageUriMap };
        filePaths.forEach((filePath, index) => {
          if (results[index]) {
            newUriMap[filePath] = results[index];
          }
        });
        this.setData({
          imageUriMap: newUriMap
        });
      })
      .catch(error => {
        console.error('图片上传失败:', error);
        // 上传失败不影响界面显示，用户仍然可以提交反馈
      });
  },

  // 上传图片到服务器
  uploadImage(filePath) {
    return new Promise((resolve, reject) => {
      // 读取文件并转换为base64
      wx.getFileSystemManager().readFile({
        filePath: filePath,
        encoding: 'base64',
        success: (res) => {
          const base64Image = res.data;
          
          // 调用上传接口
          wx.request({
            url: `${getApp().globalData.baseUrl}/oss/upload-base64`,
            method: 'POST',
            header: {
              'content-type': 'application/json'
            },
            data: base64Image,
            success: (response) => {
              if (response.statusCode === 200 && response.data) {
                // 假设接口返回格式为 { code: 0, data: { uri: 'xxx' } }
                if (response.data.code === 200 && response.data.data) {
                  resolve(response.data.data);
                } else {
                  reject(new Error('接口返回数据格式错误'));
                }
              } else {
                reject(new Error('上传失败，状态码：' + response.statusCode));
              }
            },
            fail: (error) => {
              reject(error);
            }
          });
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const imageList = this.data.imageList;
    const deletedPath = imageList[index];
    
    imageList.splice(index, 1);
    
    // 同时删除对应的URI映射
    const imageUriMap = { ...this.data.imageUriMap };
    delete imageUriMap[deletedPath];
    
    this.setData({
      imageList: imageList,
      imageUriMap: imageUriMap,
      imageCount: imageList.length
    });
  },

  submitFeedback() {
    const { feedbackText, contactInfo, charCount, imageList, imageUriMap } = this.data;
    const app = getApp();
    
    if (!feedbackText.trim()) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none'
      });
      return;
    }

    if (charCount < 10) {
      wx.showToast({
        title: '请填写10个字以上的问题描述',
        icon: 'none'
      });
      return;
    }

    // 显示提交中提示
    wx.showLoading({
      title: '提交中...',
    });

    // 将本地图片路径转换为服务器URI
    const serverImages = imageList.map(localPath => {
      return imageUriMap[localPath] || localPath; // 如果有服务器URI则使用，否则使用本地路径
    });

    // 准备请求参数
    const requestData = {
      openid: getApp().globalData.openid,
      suggest: feedbackText,
      images: serverImages,
      contactInfo: contactInfo || ''
    };

    // 调用提交接口
    wx.request({
      url: `${app.globalData.baseUrl}/callback/create`,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: requestData,
      success: (response) => {
        wx.hideLoading();
        
        if (response.statusCode === 200 && response.data) {
          // 假设接口返回格式为 { code: 0, message: 'success' }
          if (response.data.code === 200) {
            wx.showModal({
              title: '提交成功',
              content: '您的反馈已成功提交，感谢您的宝贵意见！',
              showCancel: false,
              confirmText: '确认',
              success: (res) => {
                if (res.confirm) {
                  // 清空表单
                  this.setData({
                    feedbackText: '',
                    contactInfo: '',
                    charCount: 0,
                    imageList: [],
                    imageUriMap: {},
                    imageCount: 0
                  });
                  
                  // 跳转到个人中心页面
                  wx.switchTab({
                    url: '/pages/profile/profile'
                  });
                }
              }
            });
          } else {
            wx.showToast({
              title: response.data.message || '提交失败',
              icon: 'none'
            });
          }
        } else {
          wx.showToast({
            title: '提交失败，请重试',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
        console.error('提交失败:', error);
      }
    });
  }
})