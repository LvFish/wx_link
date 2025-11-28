// pages/blue_config/blue_config.js
import logger from '../../../log.js'
const app = getApp()
var blufi = require("../../../utils/blufi.js");
let _this = null;

Page({
    data: {
        devicesList: [],
        searching: false,
    },

    onLoad: function () {
        _this = this;
        blufi.init();
        blufi.listenDeviceMsgEvent(this.deviceMsgEventCallBack);
        blufi.startDiscoverBle()
    },
    
    onUnload: function () {
        if (this.data.searching) {
            blufi.startDiscoverBle()
        }
        blufi.unListenDeviceMsgEvent();
    },

    deviceMsgEventCallBack: function (options) {
        switch (options.type) {
            case blufi.BLUFI_TYPE.TYPE_GET_DEVICE_LISTS:
                if (options.result)
                    // 过滤出所有 name 等于 targetName 的数据
                    
                    _this.setData({
                        devicesList: options.data.filter(item => {
                            // 对每个元素判断 name 是否匹配
                            return item.name === "PawsLink";
                        })
                    });
                break;
            case blufi.BLUFI_TYPE.TYPE_CONNECTED:
              logger.info("连接回调：" + JSON.stringify(options))
                wx.hideLoading()
                if (options.result) {
                    wx.showToast({
                        title: '连接成功'
                    })
                    wx.navigateTo({
                        url: '../blue_device/blue_device?deviceId=' + options.data.deviceId + '&name=' + options.data.name,
                    });
                } else {
                    wx.showModal({
                        title: '温馨提示',
                        content: '蓝牙关闭，连接失败',
                        showCancel: false,
                    })
                }
                break;
            case blufi.BLUFI_TYPE.TYPE_GET_DEVICE_LISTS_START:
                if (!options.result) {
                    logger.info("蓝牙未开启 fail =》", options)
                    wx.showToast({
                        title: '蓝牙未开启',
                        icon: 'none'
                    })
                } else {
                    //蓝牙搜索开始
                    _this.setData({
                        searching: true
                    });
                }
                break;
            case blufi.BLUFI_TYPE.TYPE_GET_DEVICE_LISTS_STOP:
                logger.info('蓝牙停止搜索'+options.result?"ok":"ng")
                _this.setData({
                    searching: false
                });
                break;
        }
    },

    searchBtnClick: function () {
        if (this.data.searching) {
            blufi.stopDiscoverBle()
        } else {
            blufi.startDiscoverBle()
        }
    },

    connectBtnClick: function (e) {
        blufi.stopDiscoverBle()
        for (var i = 0; i < _this.data.devicesList.length; i++) {
            if (e.currentTarget.id === _this.data.devicesList[i].deviceId) {
                let name = _this.data.devicesList[i].name
                logger.info('点击了，蓝牙准备连接的deviceId:' + e.currentTarget.id)
                logger.info(_this.data.devicesList[i])
                blufi.connectBle(e.currentTarget.id, name);
                wx.showLoading({
                    title: '连接蓝牙设备中...',
                })
            }
        }
    },
});