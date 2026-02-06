let util = require('util2.js');
let onfire = require('../utils/onfire.js');
let crypto = require('/crypto/crypto-dh.js');
let md5 = require('/crypto/md5.min.js');
let aesjs = require('/crypto/aes.js');

let tempTimer = 0;
let sequenceControl = 0;
let client = null

let self = {
  data: {
    deviceId: null,
    isConnected: false,
    failure: false,
    value: 0,
    desc: "请耐心等待...",
    isChecksum: true,
    isEncrypt: true,
    flagEnd: false,
    defaultData: 1,
    ssidType: 2,
    passwordType: 3,
    meshIdType: 3,
    deviceId: "",
    ssid: "",
    uuid: "",
    serviceId: "",
    password: "",
    meshId: "",
    processList: [],
    result: [],
    service_uuid: "0000FFFF-0000-1000-8000-00805F9B34FB",
    characteristic_write_uuid: "0000FF01-0000-1000-8000-00805F9B34FB",
    characteristic_read_uuid: "0000FF02-0000-1000-8000-00805F9B34FB",
    customData: null,
    md5Key: 0,
  }
}

function buf2hex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

function getCharCodeat(str) {
  var list = [];
  for (var i = 0; i < str.length; i++) {
    list.push(str.charCodeAt(i));
  }
  return list;
}
function stringToBytes(str){
  let bytes = [];
  let len = str.length;
  
  for (let i = 0; i < len; i++) {
    let charCode = str.charCodeAt(i);
    
    // 处理单字节字符（0-127）
    if (charCode < 0x80) {
      bytes.push(charCode);
    } 
    // 处理双字节字符（128-2047）
    else if (charCode < 0x800) {
      bytes.push(0xC0 | (charCode >> 6));
      bytes.push(0x80 | (charCode & 0x3F));
    } 
    // 处理三字节字符（中文通常属于此类）
    else if (charCode < 0x10000) {
      bytes.push(0xE0 | (charCode >> 12));
      bytes.push(0x80 | ((charCode >> 6) & 0x3F));
      bytes.push(0x80 | (charCode & 0x3F));
    } 
    // 处理四字节字符（较少见）
    else if (charCode < 0x200000) {
      bytes.push(0xF0 | (charCode >> 18));
      bytes.push(0x80 | ((charCode >> 12) & 0x3F));
      bytes.push(0x80 | ((charCode >> 6) & 0x3F));
      bytes.push(0x80 | (charCode & 0x3F));
    }
  }
  
  return bytes;
}

//判断返回的数据是否加密
function isEncrypt(fragNum, list, md5Key) {
  var checksum = [],
    checkData = [];
  if (fragNum[7] == "1") { //返回数据加密
    if (fragNum[6] == "1") {
      var len = list.length - 2;
      list = list.slice(0, len);
    }
    var iv = this.generateAESIV(parseInt(list[2], 16));
    if (fragNum[3] == "0") { //未分包
      list = list.slice(4);
      self.data.flagEnd = true
    } else { //分包
      list = list.slice(6);
    }
  } else { //返回数据未加密
    if (fragNum[6] == "1") {
      var len = list.length - 2;
      list = list.slice(0, len);
    }
    if (fragNum[3] == "0") { //未分包
      list = list.slice(4);
      self.data.flagEnd = true
    } else { //分包
      list = list.slice(6);
    }
  }
  return list;
}

function getSecret(deviceId, serviceId, characteristicId, client, kBytes, pBytes, gBytes, data) {
  var obj = [],
    frameControl = 0;
  sequenceControl = parseInt(sequenceControl) + 1;
  if (!util._isEmpty(data)) {
    obj = util.isSubcontractor(data, true, sequenceControl);
    frameControl = util.getFrameCTRLValue(false, true, util.DIRECTION_OUTPUT, false, obj.flag);
  } else {
    data = [];
    data.push(util.NEG_SET_SEC_ALL_DATA);
    var pLength = pBytes.length;
    var pLen1 = (pLength >> 8) & 0xff;
    var pLen2 = pLength & 0xff;
    data.push(pLen1);
    data.push(pLen2);
    data = data.concat(pBytes);
    var gLength = gBytes.length;
    var gLen1 = (gLength >> 8) & 0xff;
    var gLen2 = gLength & 0xff;
    data.push(gLen1);
    data.push(gLen2);
    data = data.concat(gBytes);
    var kLength = kBytes.length;
    var kLen1 = (kLength >> 8) & 0xff;
    var kLen2 = kLength & 0xff;
    data.push(kLen1);
    data.push(kLen2);
    data = data.concat(kBytes);
    obj = util.isSubcontractor(data, true, sequenceControl);
    frameControl = util.getFrameCTRLValue(false, true, util.DIRECTION_OUTPUT, false, obj.flag);
  }
  var value = util.writeData(util.PACKAGE_VALUE, util.SUBTYPE_NEG, frameControl, sequenceControl, obj.len, obj.lenData);
  var typedArray = new Uint8Array(value);
  wx.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    value: typedArray.buffer,
    success: function (res) {
      if (obj.flag) {
        getSecret(deviceId, serviceId, characteristicId, client, kBytes, pBytes, gBytes, obj.laveData);
      }
    },
    fail: function (res) {}
  })
}

function writeDeviceRouterInfoStart(deviceId, serviceId, characteristicId, data) {
  var obj = {},
    frameControl = 0;
  sequenceControl = parseInt(sequenceControl) + 1;
  if (!util._isEmpty(data)) {
    obj = util.isSubcontractor(data, self.data.isChecksum, sequenceControl, self.data.isEncrypt);
    frameControl = util.getFrameCTRLValue(self.data.isEncrypt, self.data.isChecksum, util.DIRECTION_OUTPUT, false, obj.flag);
  } else {
    obj = util.isSubcontractor([self.data.defaultData], self.data.isChecksum, sequenceControl, true);
    frameControl = util.getFrameCTRLValue(self.data.isEncrypt, self.data.isChecksum, util.DIRECTION_OUTPUT, false, obj.flag);
  }
  var defaultData = util.encrypt(aesjs, self.data.md5Key, sequenceControl, obj.lenData, true);
  var value = util.writeData(util.PACKAGE_CONTROL_VALUE, util.SUBTYPE_WIFI_MODEl, frameControl, sequenceControl, obj.len, defaultData);
  var typedArray = new Uint8Array(value)
  wx.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    value: typedArray.buffer,
    success: function (res) {
      if (obj.flag) {
        writeDeviceRouterInfoStart(deviceId, serviceId, characteristicId, obj.laveData);
      } else {
        writeRouterSsid(deviceId, serviceId, characteristicId, null);
      }
    },
    fail: function (res) {}
  })
}

function writeCutomsData(deviceId, serviceId, characteristicId, data) {
  var obj = {},
    frameControl = 0;
  sequenceControl = parseInt(sequenceControl) + 1;
  if (!util._isEmpty(data)) {
    obj = util.isSubcontractor(data, self.data.isChecksum, sequenceControl, self.data.isEncrypt);
    frameControl = util.getFrameCTRLValue(self.data.isEncrypt, self.data.isChecksum, util.DIRECTION_OUTPUT, false, obj.flag);
  } else {
    var ssidData = stringToBytes(self.data.customData);
    obj = util.isSubcontractor(ssidData, self.data.isChecksum, sequenceControl, self.data.isEncrypt);
    frameControl = util.getFrameCTRLValue(self.data.isEncrypt, self.data.isChecksum, util.DIRECTION_OUTPUT, false, obj.flag);
  }
  var defaultData = util.encrypt(aesjs, self.data.md5Key, sequenceControl, obj.lenData, true);
  var value = util.writeData(util.PACKAGE_VALUE, util.SUBTYPE_CUSTOM_DATA, frameControl, sequenceControl, obj.len, defaultData);
  var typedArray = new Uint8Array(value)
  wx.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    value: typedArray.buffer,
    success: function (res) {
      if (obj.flag) {
        writeCutomsData(deviceId, serviceId, characteristicId, obj.laveData);
      }
    },
    fail: function (res) {
      //console.log(257);
    }
  })
}

function writeRouterSsid(deviceId, serviceId, characteristicId, data) {
  var obj = {},
    frameControl = 0;
  sequenceControl = parseInt(sequenceControl) + 1;
  if (!util._isEmpty(data)) {
    obj = util.isSubcontractor(data, self.data.isChecksum, sequenceControl, self.data.isEncrypt);
    frameControl = util.getFrameCTRLValue(self.data.isEncrypt, self.data.isChecksum, util.DIRECTION_OUTPUT, false, obj.flag);
  } else {
    var ssidData = stringToBytes(self.data.ssid);
    obj = util.isSubcontractor(ssidData, self.data.isChecksum, sequenceControl, self.data.isEncrypt);
    frameControl = util.getFrameCTRLValue(self.data.isEncrypt, self.data.isChecksum, util.DIRECTION_OUTPUT, false, obj.flag);
  }
  var defaultData = util.encrypt(aesjs, self.data.md5Key, sequenceControl, obj.lenData, true);
  var value = util.writeData(util.PACKAGE_VALUE, util.SUBTYPE_SET_SSID, frameControl, sequenceControl, obj.len, defaultData);
  var typedArray = new Uint8Array(value)
  wx.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    value: typedArray.buffer,
    success: function (res) {
      if (obj.flag) {
        writeRouterSsid(deviceId, serviceId, characteristicId, obj.laveData);
      } else {
        writeDevicePwd(deviceId, serviceId, characteristicId, null);
      }
    },
    fail: function (res) {
      //console.log(257);
    }
  })
}

function writeDevicePwd(deviceId, serviceId, characteristicId, data) {
  var obj = {},
    frameControl = 0;
  sequenceControl = parseInt(sequenceControl) + 1;
  if (!util._isEmpty(data)) {
    obj = util.isSubcontractor(data, self.data.isChecksum, sequenceControl, self.data.isEncrypt);
    frameControl = util.getFrameCTRLValue(self.data.isEncrypt, self.data.isChecksum, util.DIRECTION_OUTPUT, false, obj.flag);
  } else {
    var pwdData = stringToBytes(self.data.password);
    obj = util.isSubcontractor(pwdData, self.data.isChecksum, sequenceControl, self.data.isEncrypt);
    frameControl = util.getFrameCTRLValue(self.data.isEncrypt, self.data.isChecksum, util.DIRECTION_OUTPUT, false, obj.flag);
  }
  var defaultData = util.encrypt(aesjs, self.data.md5Key, sequenceControl, obj.lenData, true);
  var value = util.writeData(util.PACKAGE_VALUE, util.SUBTYPE_SET_PWD, frameControl, sequenceControl, obj.len, defaultData);
  var typedArray = new Uint8Array(value)

  wx.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    value: typedArray.buffer,
    success: function (res) {
      if (obj.flag) {
        writeDevicePwd(deviceId, serviceId, characteristicId, obj.laveData);
      } else {
        writeDeviceEnd(deviceId, serviceId, characteristicId, null);
      }
    },
    fail: function (res) {}
  })
}

function writeDeviceEnd(deviceId, serviceId, characteristicId) {
  sequenceControl = parseInt(sequenceControl) + 1;
  var frameControl = util.getFrameCTRLValue(self.data.isEncrypt, false, util.DIRECTION_OUTPUT, false, false);
  var value = util.writeData(self.data.PACKAGE_CONTROL_VALUE, util.SUBTYPE_END, frameControl, sequenceControl, 0, null);
  var typedArray = new Uint8Array(value)
  wx.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    value: typedArray.buffer,
    success: function (res) {},
    fail: function (res) {}
  })
}

function init() {
  console.log('start init')
  wx.onBLEConnectionStateChange(function (res) {
    console.log('init result: ', res)
    notifyDeviceMsgEvent({
      'type': BLUFI_TYPE.TYPE_STATUS_CONNECTED,
      'result': res.connected,
      'data': res
    });
  })
}

let BLUFI_TYPE = {
  TYPE_STATUS_CONNECTED: '-2', /// 设备连接状态回调
  TYPE_CLOSE_CONNECTED: '-1', ///主动关闭连接
  TYPE_CONNECTED: '0', //主动连接
  TYPE_GET_DEVICE_LISTS: '1', //发现设备列表回调
  TYPE_INIT_ESP32_RESULT: '2',
  TYPE_RECIEVE_CUSTON_DATA: '3', //接收到自定义数据
  TYPE_CONNECT_ROUTER_RESULT: '4',

  TYPE_GET_DEVICE_LISTS_START: ' 41', //发现设备列表回调开始
  TYPE_GET_DEVICE_LISTS_STOP: '42', //停止发现设备列表回调
};

function notifyDeviceMsgEvent(options) {
  onfire.fire("deviceMsg", options);
}

function listenDeviceMsgEvent(funtion) {
  console.log('start listenDeviceMsgEvent')
  onfire.on("deviceMsg", funtion)
}

function unListenDeviceMsgEvent() {
  onfire.un("deviceMsg")
}

function startDiscoverBle() {
  //第一步检查蓝牙适配器是否可用
  console.log("start startDiscoverBle()")
  wx.onBluetoothAdapterStateChange(function (res) {
    if (!res.available) {}
  });
  //第二步关闭适配器，重新来搜索
  wx.closeBluetoothAdapter({
    complete: function (res) {
      wx.openBluetoothAdapter({
        success: function (res) {
          console.log("wx.getBluetoothAdapterState")
          wx.getBluetoothAdapterState({
            success: function (res) {
              wx.startBluetoothDevicesDiscovery({
                success: function(res) {
                  wx.stopBluetoothDevicesDiscovery({
                    success: function (res) {
                      let devicesList = [];
                      let countsTimes = 0;
                      wx.onBluetoothDeviceFound(function (devices) {
                        //剔除重复设备，兼容不同设备API的不同返回值
                        var isnotexist = true;
                        if (devices.deviceId) {
                          if (devices.advertisData) {
                            devices.advertisData = buf2hex(devices.advertisData)
                          } else {
                            devices.advertisData = ''
                          }
                          for (var i = 0; i < devicesList.length; i++) {
                            if (devices.deviceId === devicesList[i].deviceId) {
                              isnotexist = false
                            }
                          }
                          if (isnotexist) {
                            devicesList.push(devices)
                          }
                        } else if (devices.devices) {
                          if (devices.devices[0].advertisData) {
                            devices.devices[0].advertisData = buf2hex(devices.devices[0].advertisData)
                          } else {
                            devices.devices[0].advertisData = ''
                          }
                          for (var i = 0; i < devicesList.length; i++) {
                            if (devices.devices[0].deviceId == devicesList[i].deviceId) {
                              isnotexist = false
                            }
                          }
                          if (isnotexist) {
                            devicesList.push(devices.devices[0])
                          }
                        } else if (devices[0]) {
                          if (devices[0].advertisData) {
                            devices[0].advertisData = buf2hex(devices[0].advertisData)
                          } else {
                            devices[0].advertisData = ''
                          }
                          for (var i = 0; i < devices_list.length; i++) {
                            if (devices[0].deviceId == devicesList[i].deviceId) {
                              isnotexist = false
                            }
                          }
                          if (isnotexist) {
                            devicesList.push(devices[0])
                          }
                        }
                        notifyDeviceMsgEvent({
                          'type': BLUFI_TYPE.TYPE_GET_DEVICE_LISTS,
                          'result': true,
                          'data': devicesList
                        });
                      })
                      wx.startBluetoothDevicesDiscovery({
                        allowDuplicatesKey: true,
                        success: function (res) {
                          notifyDeviceMsgEvent({
                            'type': BLUFI_TYPE.TYPE_GET_DEVICE_LISTS_START,
                            'result': true,
                            'data': res
                          });
                          //开始扫码，清空列表
                          devicesList.length = 0;
                        },
                        fail: function (res) {
                          notifyDeviceMsgEvent({
                            'type': BLUFI_TYPE.TYPE_GET_DEVICE_LISTS_START,
                            'result': false,
                            'data': res
                          });
                        }
                      });
                    },
                    fail: function (res) {
                      console.log("fail stopBluetoothDevicesDiscovery res:", res)
                      notifyDeviceMsgEvent({
                        'type': BLUFI_TYPE.TYPE_GET_DEVICE_LISTS_START,
                        'result': false,
                        'data': res
                      });
                    }
                  });
                },
              })
            },
            fail: function (res) {
              notifyDeviceMsgEvent({
                'type': BLUFI_TYPE.TYPE_GET_DEVICE_LISTS_START,
                'result': false,
                'data': res
              });
            }
          });
        },
        fail: function (res) {
          notifyDeviceMsgEvent({
            'type': BLUFI_TYPE.TYPE_GET_DEVICE_LISTS_START,
            'result': false,
            'data': res
          });
        }
      });
    }
  });
}

function stopDiscoverBle() {
  wx.stopBluetoothDevicesDiscovery({
    success: function (res) {
      clearInterval(tempTimer);
      notifyDeviceMsgEvent({
        'type': BLUFI_TYPE.TYPE_GET_DEVICE_LISTS_STOP,
        'result': true,
        'data': res
      });
    },
    fail: function (res) {
      notifyDeviceMsgEvent({
        'type': BLUFI_TYPE.TYPE_GET_DEVICE_LISTS_STOP,
        'result': false,
        'data': res
      });
    }
  })
}

function connectBle(deviceId, name) {
  console.log('connectBle', deviceId)
  wx.createBLEConnection({
    deviceId: deviceId,
    success: function (res) {
      self.data.deviceId = deviceId
      notifyDeviceMsgEvent({
        'type': BLUFI_TYPE.TYPE_CONNECTED,
        'result': true,
        'data': {
          deviceId: deviceId,
          name: name
        },
      });
    },
    fail: function (res) {
      self.data.deviceId = null
      notifyDeviceMsgEvent({
        'type': BLUFI_TYPE.TYPE_CONNECTED,
        'result': false,
        'data': res,
      });
    }
  });
}

function disconnectBle(deviceId, name) {
  wx.closeBLEConnection({
    deviceId: deviceId,
    success: function (res) {
      console.log('断开成功')
      self.data.deviceId = null
      notifyDeviceMsgEvent({
        'type': BLUFI_TYPE.TYPE_CLOSE_CONNECTED,
        'result': true,
        'data': {
          deviceId: deviceId,
          name: name
        }
      });
    },
    fail: function (res) {
      self.data.deviceId = null
      notifyDeviceMsgEvent({
        'type': BLUFI_TYPE.TYPE_CLOSE_CONNECTED,
        'result': false,
        'data': res,
      });
    }
  })
}

function initBleEsp32(deviceId) {
  sequenceControl = 0;
  self = null
  self = {
    data: {
      deviceId: null,
      isConnected: false,
      failure: false,
      value: 0,
      desc: "请耐心等待...",
      isChecksum: true,
      isEncrypt: true,
      flagEnd: false,
      defaultData: 1,
      ssidType: 2,
      passwordType: 3,
      meshIdType: 3,
      deviceId: "",
      ssid: "",
      uuid: "",
      serviceId: "",
      password: "",
      meshId: "",
      processList: [],
      result: [],
      service_uuid: "0000FFFF-0000-1000-8000-00805F9B34FB",
      characteristic_write_uuid: "0000FF01-0000-1000-8000-00805F9B34FB",
      characteristic_read_uuid: "0000FF02-0000-1000-8000-00805F9B34FB",
      customData: null,
      md5Key: 0,
    }
  }
  self.data.deviceId = deviceId
  wx.getBLEDeviceServices({
    // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
    deviceId: deviceId,
    success: function (res) {
      var services = res.services;
      if (services.length > 0) {
        for (var i = 0; i < services.length; i++) {
          if (services[i].uuid === self.data.service_uuid) {
            var serviceId = services[i].uuid;
            wx.getBLEDeviceCharacteristics({
              // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
              deviceId: deviceId,
              serviceId: serviceId,
              success: function (res) {
                var list = res.characteristics;
                if (list.length > 0) {
                  for (var i = 0; i < list.length; i++) {
                    var uuid = list[i].uuid;
                    if (uuid == self.data.characteristic_write_uuid) {
                      self.data.serviceId = serviceId;
                      self.data.uuid = uuid;
                      wx.notifyBLECharacteristicValueChange({
                        state: true, // 启用 notify 功能
                        deviceId: deviceId,
                        serviceId: serviceId,
                        characteristicId: list[1].uuid,
                        success: function (res) {
                          let characteristicId = self.data.characteristic_write_uuid
                          //通知设备交互方式（是否加密） start
                          client = util.blueDH(util.DH_P, util.DH_G, crypto);
                          var kBytes = util.uint8ArrayToArray(client.getPublicKey());
                          var pBytes = util.hexByInt(util.DH_P);
                          var gBytes = util.hexByInt(util.DH_G);
                          var pgkLength = pBytes.length + gBytes.length + kBytes.length + 6;
                          var pgkLen1 = (pgkLength >> 8) & 0xff;
                          var pgkLen2 = pgkLength & 0xff;
                          var data = [];
                          data.push(util.NEG_SET_SEC_TOTAL_LEN);
                          data.push(pgkLen1);
                          data.push(pgkLen2);
                          var frameControl = util.getFrameCTRLValue(false, false, util.DIRECTION_OUTPUT, false, false);
                          var value = util.writeData(util.PACKAGE_VALUE, util.SUBTYPE_NEG, frameControl, sequenceControl, data.length, data);
                          var typedArray = new Uint8Array(value);
                          wx.writeBLECharacteristicValue({
                            deviceId: deviceId,
                            serviceId: serviceId,
                            characteristicId: characteristicId,
                            value: typedArray.buffer,
                            success: function (res) {
                              getSecret(deviceId, serviceId, characteristicId, client, kBytes, pBytes, gBytes, null);
                            },
                            fail: function (res) {
                              notifyDeviceMsgEvent({
                                'type': BLUFI_TYPE.TYPE_INIT_ESP32_RESULT,
                                'result': false,
                                'data': res
                              });
                            }
                          })
                          //通知设备交互方式（是否加密） end
                          wx.onBLECharacteristicValueChange(function (res) {
                            console.log('decc res', res)
                            let list2 = (util.ab2hex(res.value));
                            console.log('decc list2', list2)
                            console.log('self data', self.data)
                            // start
                            let result = self.data.result;
                            console.log('decc result', result)
                            if (list2.length < 4) {
                              cosnole.log(407);
                              return false;
                            }
                            var val = parseInt(list2[0], 16),
                              type = val & 3,
                              subType = val >> 2;
                            var dataLength = parseInt(list2[3], 16);
                            if (dataLength == 0) {
                              return false;
                            }
                            var fragNum = util.hexToBinArray(list2[1]);
                            list2 = isEncrypt(fragNum, list2, self.data.md5Key);
                            result = result.concat(list2);
                            console.log('decc result 2', result)
                            self.data.result = result
                            if (self.data.flagEnd) {
                              self.data.flagEnd = false
                              if (type == 1) {
                                let what = [];
                                switch (subType) {
                                  case 15:
                                    if (result.length == 3) {
                                      notifyDeviceMsgEvent({
                                        'type': BLUFI_TYPE.TYPE_CONNECT_ROUTER_RESULT,
                                        'result': false,
                                        'data': {
                                          'progress': 0,
                                          'ssid': what.join('')
                                        }
                                      });
                                    } else {
                                      for (var i = 0; i <= result.length; i++) {
                                        var num = parseInt(result[i], 16) + "";
                                        if (i > 12) what.push(String.fromCharCode(parseInt(result[i], 16)));
                                      }
                                      notifyDeviceMsgEvent({
                                        'type': BLUFI_TYPE.TYPE_CONNECT_ROUTER_RESULT,
                                        'result': true,
                                        'data': {
                                          'progress': 100,
                                          'ssid': what.join('')
                                        }
                                      });
                                    }

                                    break;
                                  case 19: //自定义数据
                                    let customData = [];
                                    for (var i = 0; i <= result.length; i++) {
                                      customData.push(String.fromCharCode(parseInt(result[i], 16)));
                                    }
                                    notifyDeviceMsgEvent({
                                      'type': BLUFI_TYPE.TYPE_RECIEVE_CUSTON_DATA,
                                      'result': true,
                                      'data': customData.join('')
                                    });

                                    break;
                                  case util.SUBTYPE_NEGOTIATION_NEG:
                                    var arr = util.hexByInt(result.join(""));
                                    var clientSecret = client.computeSecret(new Uint8Array(arr));
                                    var md5Key = md5.array(clientSecret);
                                    self.data.md5Key = md5Key;
                                    notifyDeviceMsgEvent({
                                      'type': BLUFI_TYPE.TYPE_INIT_ESP32_RESULT,
                                      'result': true,
                                      'data': {
                                        deviceId,
                                        serviceId,
                                        characteristicId
                                      }
                                    });
                                    break;
                                  default:
                                    console.log(468);
                                    //self.setFailProcess(true, util.descFailList[4])
                                    console.log("入网失败 468 :", util.failList[4]);
                                    break;
                                }
                                self.data.result = []
                              } else {
                                //console.log(472);
                                console.log("入网失败 472:", util.failList[4]);
                              }
                            }
                            // end

                          })

                        },
                        fail: function (res) {
                          notifyDeviceMsgEvent({
                            'type': BLUFI_TYPE.TYPE_INIT_ESP32_RESULT,
                            'result': false,
                            'data': res
                          });
                        }
                      })
                    }
                  }
                }
              },
              fail: function (res) {
                notifyDeviceMsgEvent({
                  'type': BLUFI_TYPE.TYPE_INIT_ESP32_RESULT,
                  'result': false,
                  'data': res
                });
                console.log("fail getBLEDeviceCharacteristics:" + JSON.stringify(res))
              }
            })
            break;
          }
        }
      }
    },
    fail: function (res) {
      notifyDeviceMsgEvent({
        'type': BLUFI_TYPE.TYPE_INIT_ESP32_RESULT,
        'result': false,
        'data': res
      });
      console.log("fail getBLEDeviceServices:" + JSON.stringify(res))
    }
  })
}

function sendSsidAndPassword(ssid, password) {
  self.data.password = password
  self.data.ssid = ssid
  writeDeviceRouterInfoStart(self.data.deviceId, self.data.service_uuid, self.data.characteristic_write_uuid, null);
}

function sendCustomData(customData) {  
  self.data.customData = customData
  writeCutomsData(self.data.deviceId, self.data.service_uuid, self.data.characteristic_write_uuid, null);
}


module.exports = {
  BLUFI_TYPE,

  listenDeviceMsgEvent,
  unListenDeviceMsgEvent,

  startDiscoverBle,
  stopDiscoverBle,

  connectBle,
  disconnectBle,

  initBleEsp32,
  sendSsidAndPassword,
  sendCustomData,

  init,
};