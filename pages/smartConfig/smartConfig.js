Page({
  data: {
    wifiList: [],
    selectedWifiIndex: -1,
    selectedWifi: null,
    password: '',
    result: ''
  },

  onLoad() {
    this.getAvailableWifiList();
  },

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
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
    wx.startWifi({
        success: () => {
            wx.getSetting({
                success: (res) => {
                    if (!res.authSetting['scope.userLocation']) {
                        wx.authorize({
                            scope: 'scope.userLocation',
                            success: () => {
                                this.fetchWifiList();
                            },
                            fail: (err) => {
                                console.error('获取 Wi-Fi 权限失败:', err);
                            }
                        });
                    } else {
                        this.fetchWifiList();
                    }
                }
            });
        },
        fail: (err) => {
            console.error('开启 Wi-Fi 模块失败:', err);
        }
    });
  },

  fetchWifiList() {
    wx.getWifiList({
        success: () => {
            wx.onGetWifiList((res) => {
                this.setData({
                    wifiList: res.wifiList
                });
            });
        },
        fail: (err) => {
            console.error('获取 Wi-Fi 列表失败:', err);
        }
    });
  },

  sendDefaultDfg() {
    console.log("call sendCfg")
  },

  getAvailableWifiList() {
    wx.startWifi({
      success: () => {
        this.getWifiList();
      },
      fail: (err) => {
        this.setData({
          result: `开启 Wi-Fi 模块失败：${err.errMsg}`
        });
      }
    });
  },

  startConnectWifi(ssid, password) {
    wx.connectWifi({
      SSID: ssid,
      password: password,
      forceNewApi: true,
      success(res) {
          wx.showLoading({
              title: '设置中...'
          })
          // 链接成功，发送配置信息
          console.log("start call")
          const socket = wx.createUDPSocket();
          console.log(socket);

          
          const port = socket.bind();
          console.log("port",port)
          const packet = `${ssid}|${password}`;
          // 自定义函数将字符串转换为 Uint8Array
          const len = packet.length;
          const buffer = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            buffer[i] = packet.charCodeAt(i);
          }
          console.log("start send")
          // 发送 UDP 数据包
          for (let i = 0; i < 1000; i++) {
            socket.send({
              address: '255.255.255.255',
              port: 10000, // 根据设备要求修改端口号
              message: buffer,
              success: () => {
                console.log("正在配网，请稍候...")
              },
              fail: (err) => {
                console.log("发送数据包失败：err", err.errMsg)
              }
            });
          } 
      },
      fail(err) {
        console.log(err)
        console.log("连接失败 err", err.errMsg)
          // 链接失败
      }
    })
  },

  startSmartConfig() {
    const { selectedWifi, password } = this.data;
    if (!selectedWifi || !password) {
      this.setData({
        result: '请选择有效的 Wi-Fi 并输入密码'
      });
      return;
    }
    const ssid = selectedWifi.SSID;
    // 连接wifi
    this.startConnectWifi(ssid, password)
  },

  stringToUint8Array(str) {
    const len = str.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      arr[i] = str.charCodeAt(i);
    }
    return arr;
  }
});