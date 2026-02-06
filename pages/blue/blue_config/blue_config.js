// pages/blue_config/blue_config.js
import logger from '../../../log.js'
const app = getApp()
var blufi = require("../../../utils/blufi.js");
var locationUtil = require("../../../utils/location.js");
var bluetoothUtil = require("../../../utils/bluetooth.js");
let _this = null;

Page({
    data: {
        devicesList: [],
        searching: false,
    },

    onLoad: async function () {
        _this = this;

        // 先检查位置授权
        const locationAuthStatus = await locationUtil.checkLocationAuth();

        if (!locationAuthStatus.systemEnabled) {
            wx.showModal({
                title: '温馨提示',
                content: '系统位置服务未开启，请在系统设置中开启位置服务',
                showCancel: false,
                success: () => {
                    wx.navigateBack();
                }
            });
            return;
        }

        if (!locationAuthStatus.appAuthorized) {
            if (locationAuthStatus.authStatus === 'denied') {
                wx.showModal({
                    title: '温馨提示',
                    content: '位置权限已被拒绝，请前往设置开启',
                    confirmText: '去设置',
                    success: (res) => {
                        if (res.confirm) {
                            locationUtil.openLocationSetting();
                        }
                        wx.navigateBack();
                    }
                });
            } else {
                wx.showModal({
                    title: '温馨提示',
                    content: '需要位置权限才能使用蓝牙功能',
                    confirmText: '去授权',
                    success: (res) => {
                        if (res.confirm) {
                            locationUtil.requestLocationAuth().then((result) => {
                                if (result.success) {
                                    _this.checkBluetoothPermission();
                                } else {
                                    wx.navigateBack();
                                }
                            });
                        } else {
                            wx.navigateBack();
                        }
                    }
                });
            }
            return;
        }

        // 位置授权正常，检查蓝牙授权
        this.checkBluetoothPermission();
    },

    checkBluetoothPermission: async function () {
        // 检查蓝牙授权
        const bluetoothAuthStatus = await bluetoothUtil.checkBluetoothAuth();

        if (!bluetoothAuthStatus.systemEnabled) {
            wx.showModal({
                title: '温馨提示',
                content: '系统蓝牙未开启，请在系统设置中开启蓝牙',
                showCancel: false,
                success: () => {
                    wx.navigateBack();
                }
            });
            return;
        }

        if (!bluetoothAuthStatus.appAuthorized) {
            if (bluetoothAuthStatus.authStatus === 'denied') {
                wx.showModal({
                    title: '温馨提示',
                    content: '蓝牙权限已被拒绝，请前往设置开启',
                    confirmText: '去设置',
                    success: (res) => {
                        if (res.confirm) {
                            bluetoothUtil.openBluetoothSetting();
                        }
                        wx.navigateBack();
                    }
                });
            } else {
                wx.showModal({
                    title: '温馨提示',
                    content: '需要蓝牙权限才能使用蓝牙功能',
                    confirmText: '去授权',
                    success: (res) => {
                        if (res.confirm) {
                            bluetoothUtil.requestBluetoothAuth().then((result) => {
                                if (result.success) {
                                    _this.initBluetooth();
                                } else {
                                    wx.navigateBack();
                                }
                            });
                        } else {
                            wx.navigateBack();
                        }
                    }
                });
            }
            return;
        }

        // 蓝牙授权正常，初始化蓝牙
        this.initBluetooth();
    },

    initBluetooth: function () {
        console.log("start blufi init");
        blufi.init();
        console.log("start blufi listenDeviceMsgEvent");
        blufi.listenDeviceMsgEvent(this.deviceMsgEventCallBack);
        console.log("start blufi startDiscoverBle");
        blufi.startDiscoverBle();
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
              console.log("options", options)
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