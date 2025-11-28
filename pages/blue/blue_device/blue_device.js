// pages/blue/blue_device/blue_device.js
import logger from '../../../log.js'
var blufi = require("../../../utils/blufi.js");
var util = require("../../../utils/util2.js");
var _this = this

Page({
  data: {
    deviceId: '',
    connected: true,
    ssid: '',
    password: '',
    wifiList: [],
    selectedWifiIndex: -1,
    selectedWifi: null,
    isModalShow: false,
    isChecked:false,
    wifiInfo: {
      ssid: '',
      password: '',
      bssid: '',
      ip_address: ''
    },
  },

  onShow: function (options) {
    this.getAvailableWifiList();
  },

  onLoad: function (options) {
    _this = this
    this.setData({
      name: options.name,
      deviceId: options.deviceId,
    })

    blufi.listenDeviceMsgEvent(this.deviceMsgEventCallBack);
    blufi.initBleEsp32(options.deviceId)
    util.showLoading("设备初始化中")
  },

  onUnload: function () {
    blufi.disconnectBle(this.data.deviceId, this.data.name);
    blufi.unListenDeviceMsgEvent();
  },

  handleRadioChange(e) {
    let temp = this.data.isChecked
    logger.info('temp:', temp)
    this.setData({
      isChecked: !temp
    });
  },

  deviceMsgEventCallBack: function (options) {
    logger.info("options", options)
    switch (options.type) {
      case blufi.BLUFI_TYPE.TYPE_STATUS_CONNECTED:
        _this.setData({
          connected: options.result
        });
        if (!options.result) {
          wx.showModal({
            title: '很抱歉提醒你！',
            content: '手机蓝牙关闭，小程序和设备断开',
            showCancel: false,
            success: function (res) {
              wx.navigateBack({
                delta: 1,
              })
            },
          })
        }
        break;
      case blufi.BLUFI_TYPE.TYPE_CONNECT_ROUTER_RESULT:
        wx.hideLoading();
        if (!options.result)
          wx.showModal({
            title: '温馨提示',
            content: '配网失败，请重试',
            showCancel: false,
          })
        else {
          if (options.data.progress == 100) {
            wx.showModal({
              title: '温馨提示',
              content: `连接成功路由器【${options.data.ssid}】`,
              showCancel: false, //是否显示取消按钮
              success: function (res) {
                wx.setStorage({
                  key: options.data.ssid,
                  data: _this.data.password
                })
              }
            })
          }
        }
        break;
      case blufi.BLUFI_TYPE.TYPE_RECIEVE_CUSTON_DATA:
        logger.info("收到设备发来的自定义数据结果：", (options.data))
        logger.info('options.data', options.data)
        let tempData = options.data
        logger.info('tempData', tempData)
        tempData = tempData.replaceAll('\u0000', '');
        logger.info('tempData', tempData)
        const customData = JSON.parse(tempData);
        logger.info("customData resultCode", customData.resultCode)
        if (customData.resultCode == 2) {
          wx.hideLoading();
          wx.showModal({
            title: '温馨提示',
            content: '配网失败，请重试',
            showCancel: false,
          })
        } else if (customData.resultCode == 0){
          // logger.info("start register device")
          // logger.info("customData.mac", customData.mac)
          let url = `${getApp().globalData.baseUrl}/device/add`
          wx.request({
            url: url,
            header: {
              'content-type': 'application/json'
            },
            method: 'POST',
            data: {
              name: "宠物精灵",
              mac: customData.mac,
              openId: getApp().globalData.openid,
              url: "https://img1.baidu.com/it/u=2445505683,2852819399&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500"
            },
            success(res) {
              logger.info('add config result', res.data)
              if (res.data.code == 200) {
                logger.info(res.data)
                wx.showModal({
                  title: '配网成功啦',
                  content: '配网成功啦',
                  showCancel: false,
                  success(res) {
                    if (res.confirm) {
                      wx.switchTab({
                        url: '/pages/new_device/new_device',
                        success(res) {
                          logger.info(res)
                        },
                        fail: (err) => {
                          logger.info('jump err: ', err)
                        },
                      })
                    }
                  }
                })
              } else wx.showModal({
                title: '提示',
                content: res.data.msg,
                showCancel: false,
                success(res) {
                  if (res.confirm) {
                    logger.info('用户点击确定')
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
                    logger.info('用户点击确定')
                  }
                }
              });
            },
            complete() {
              wx.hideLoading();
            }
          });
        }

        //todo 添加mac 跳转到我的设备
        break;
      case blufi.BLUFI_TYPE.TYPE_INIT_ESP32_RESULT:
        wx.hideLoading();
        logger.info("初始化结果：", JSON.stringify(options))
        if (!options.result) {
          wx.showModal({
            title: '温馨提示',
            content: `设备初始化失败`,
            showCancel: false, //是否显示取消按钮
            success: function (res) {
              wx.navigateBack({
                delta: 1,
              })
            }
          })
        }
        break;
    }
  },

  okBtnClick: function () {
    const {
      wifiInfo,
      password
    } = this.data;
    logger.info('start BlueConfig', 'wifiInfo:', wifiInfo, ' password:', password)
    if (!wifiInfo || !wifiInfo.ssid || !password) {
      util.showToast("请选择有效的 Wi-Fi 并输入密码")
      return;
    }
    this.setData({
      ssid: wifiInfo.ssid,
      bssid: wifiInfo.bssid,
      password: password
    })
    util.showLoading("正在配网")
    logger.info(this.data)
    blufi.sendSsidAndPassword(this.data.ssid, this.data.password)
  },


  onSSIDInput: function (e) {
    this.setData({
      ssid: e.detail.value
    })
  },

  onPasswordInput: function (e) {
    this.setData({
      password: e.detail.value
    })
  },

  onWifiChange(e) {
    const index = e.detail.value;
    const selectedWifi = this.data.wifiList[index];
    this.setData({
      selectedWifiIndex: index,
      selectedWifi: selectedWifi
    });
  },

  getWifiList() {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              this.fetchWifiList();
            },
            fail: (err) => {
              logger.error('获取 Wi-Fi 权限失败:', err);
            }
          });
        } else {
          this.fetchWifiList();
        }
      }
    });
  },

  getConnectedWifi() {
    let that = this;
    wx.getConnectedWifi({
      success: (res) => {
        logger.info("获取WiFi信息成功:", res);
        const wifi = res.wifi;
        // 检查是否获取到SSID和BSSID
        if (wifi.SSID && wifi.BSSID) {
          that.setData({
            wifiInfo: {
              ssid: wifi.SSID, // WiFi名称
              bssid: wifi.BSSID // WiFi MAC地址
            },
          });
          return;
        }
        logger.info('获取wifi失败, wifi:', wifi)
        // 成功获取WiFi信息
      },
      fail: (err) => {
        logger.error("获取WiFi信息失败:", err);
      }
    });
  },

  fetchWifiList() {
    wx.getWifiList({
      success: () => {
        wx.onGetWifiList((res) => {
          logger.info("res.wifilist", res.wifiList)
          // 假设resList是从接口获取的WiFi列表数据
          const filteredList = res.wifiList.filter(item => item.SSID && item.SSID.trim() !== '');
          this.setData({
            wifiList: filteredList,
          });
        });
      },
      fail: (err) => {
        logger.error('获取 Wi-Fi 列表失败:', err);
      }
    });
  },

  getAvailableWifiList() {
    logger.info('start getAvailableWifiList')
    let that = this;
    wx.startWifi({
      success: () => {
        logger.info("WiFi模块初始化成功");
        that.getConnectedWifi();
      },
      fail: (err) => {
        logger.error("WiFi模块初始化失败");
        that.setData({
          result: `开启 Wi-Fi 模块失败：${err.errMsg}`
        });
      }
    });
  },

  switchWifi(e) {
    logger.info('start switchWifi:e', e);
    const ssid = e.currentTarget.dataset.id;
    const selectedWifi = this.data.wifiList.find(item => item.SSID === ssid);
    let that = this;
    logger.info('selectedWifi', selectedWifi)
    if (selectedWifi) {
      that.setData({
        "wifiInfo.ssid": selectedWifi.SSID,
        "wifiInfo.bssid": selectedWifi.BSSID,
        isModalShow: false,
      })
    }
  },

  onSwitchWiFi() {
    logger.info('start switch')
    let that = this;
    this.getWifiList();
    // 获取wifiList
    that.setData({
      isModalShow: true,
    });

  },

  initWifi() {
    wx.startWifi();
    wx.getConnectedWifi({
      success: function (res) {
        if (res.wifi.SSID.indexOf("5G") != -1) {
          wx.showToast({
            title: '当前为5G网络',
            icon: 'none',
            duration: 3000
          })
        }
        let password = wx.getStorageSync(res.wifi.SSID)
        logger.info("password=>", password)
        _this.setData({
          ssid: res.wifi.SSID,
          password: password == undefined ? "" : password
        })
      },
      fail: function (res) {
        logger.info(res);
        _this.setData({
          ssid: null,
        })
      }
    });
  }
})