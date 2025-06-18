const app = getApp()

let UDPsocket;
Page({
    data: {
      default_value: new Array(1500).fill(49), // 初始化元素为49
      data_umcode_length: 105, 
      data_umcode: new Array(105).fill(0), // 初始化元素为0
      isWaiting: false,
      motto: 'Hello World',
      errorMessage:'',
      modalShown: 0,
      wifiInfo: {
          ssid:'',
          password:'',
          bssid:'',
          ip_address:''
      },
      udpResData:'',
      udp:'',
      run: true, // 变量 run，用于控制提前停止
      wifiList: [],
      selectedWifiIndex: -1,
      selectedWifi: null,
      password: '',
      ssid: '',
      bssid:'',
      result: ''
    },
  
    onLoad() {
      this.getAvailableWifiList();
      console.log('页面 index 开始加载事件onLoad()');
      //新建udp实例
      UDPsocket = wx.createUDPSocket();
      // 绑定错误事件
      UDPsocket.onError((err) => {
        console.error('UDP Socket error:', err);
        // 处理错误，例如记录日志、通知用户等
        // wx.showToast({
        //   title: 'UDP通信错误',
        //   icon: 'none',
        //   duration: 2000
        // });
      });
      console.log(UDPsocket);
      //udp绑定本机
      UDPsocket.bind(18266);
      //指定接收事件处理函数。监听收到消息的事件
      UDPsocket.onMessage(this.onUdpMessage);
      console.log('页面 index 加载完成事件onLoad()');
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
                console.log("res.wifilist", res.wifiList)
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
  
    startSmartConfig() {
      const { selectedWifi, password } = this.data;
      if (!selectedWifi || !password) {
        this.setData({
          result: '请选择有效的 Wi-Fi 并输入密码'
        });
        return;
      }
      console.log('selectedWifi', selectedWifi)
      console.log('selectedWifi ssid', selectedWifi.SSID)
      console.log('selectedWifi bssid', selectedWifi.BSSID)
      this.setData({
        ssid: selectedWifi.SSID,
        bssid: selectedWifi.BSSID,
        password: password
      })
      // 连接wifi
      console.log("start execute()")
      this.execute()
    },

    initWIFI:function(){
        return new Promise((resolve, reject) => {
          let intervalId;
          let localip;
          let that = this;
          let ssid = that.data.ssid;
          let password = that.data.password;
          let bssid = that.data.bssid;
          console.log("start connectWifi()")
          wx.showLoading({
            title: '设置中...'
          })
          wx.getLocalIPAddress({
            success (res) {
              console.log("localip="+res.localip);
              localip = res.localip;
              that.setData({
                "wifiInfo.ip_address":localip,
                "wifiInfo.ssid":ssid,
                "wifiInfo.password":password,
                "wifiInfo.bssid":bssid,
                run: true,
                isWaiting: true
              })
              console.log('data:', that.data)
            },
            fail(err) {
              console.error("getLocalIPAddress is error" + err); // 错误信息
            }
          })
          //等待获取成功
          intervalId = setInterval(() => {
            if(localip && bssid)
            {
              this.setData({
                "wifiInfo.ip_address": localip,
                "wifiInfo.bssid": bssid,
              });
              console.log(`ip_address=${this.data.wifiInfo.ip_address}, bssid=${this.data.wifiInfo.bssid}`);
              this.make_datumcode();
    
              clearInterval(intervalId);
              resolve(); // 或者可以根据情况调用 reject() 表示失败
            }
          }, 100);
        });
      },
  
    stringToUint8Array(str) {
      const len = str.length;
      const arr = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        arr[i] = str.charCodeAt(i);
      }
      return arr;
    },
    execute: async function(){
      await this.initWIFI();

      for(let i = 0; i< 10; i++){
        console.log("start for send code")
        await this.send_guidecode();
        await this.send_datumcode();
      }
  
      this.setData({ //停止等待
        isWaiting: false
      });
    },
    //发送send_guidecode，515、514、513、512
    send_guidecode:function(){
      return new Promise((resolve, reject) => {
        console.log("start send_guidecode")
        let intervalId;  // 保存定时器 ID
        let duration = 2000;  // 总持续时间 5 秒
        let interval = 8;  // 每次打印的间隔 8 毫秒
        const arr = [515, 514, 513, 512];  // 打印的数组
        let index = 0;  // 当前数组的索引
        const uint8Array = Uint8Array.from(this.data.default_value);
        intervalId = setInterval(() => {
          if (!this.data.run) {
            // 如果 run 变为 false
            clearInterval(intervalId);
            console.log('提前停止打印');
            resolve(); // 或者可以根据情况调用 reject() 表示失败
          } else {
            // 打印数组中的元素
            // console.log(arr[index]);
            //向指定的IP和port发送信息
            UDPsocket.send({
              address: '255.255.255.255',
              port: 7001,
              message: uint8Array.buffer,
              length: arr[index]
            })
            index++;
  
            // 当数组末尾时重新开始
            if (index >= arr.length) {
              index = 0;  // 重置索引，重新开始打印
            }
          }
        }, interval);
        
        // 5 秒后停止打印
        setTimeout(() => {
          clearInterval(intervalId);  // 停止 setInterval
          console.log('打印完成');
          resolve(); // 表示异步操作成功完成
        }, duration);
      });
    },
  
    //发送 datumcode
    send_datumcode:function(){
      return new Promise((resolve, reject) => {
        console.log("start send_datumcode")
        let intervalId;  // 保存定时器 ID
        let duration = 4000;  // 总持续时间 5 秒
        let interval = 8;  // 每次打印的间隔 8 毫秒
        const arr = this.data.data_umcode;  // 打印的数组
        let index = 0;  // 当前数组的索引
        const uint8Array = Uint8Array.from(this.data.default_value);
        intervalId = setInterval(() => {
          if (!this.data.run) {
            // 如果 run 变为 false
            clearInterval(intervalId);
            console.log('提前停止打印');
            resolve(); // 表示异步操作成功完成
          } else {
            // 打印数组中的元素
            // console.log(arr[index]+40);
            //向指定的IP和port发送信息
            UDPsocket.send({
              address: '255.255.255.255',
              port: 7001,
              message: uint8Array.buffer,
              length: arr[index]+40
            })
            index++;
  
            // 当数组末尾时重新开始
            if (index >= this.data.data_umcode_length) {
              index = 0;  // 重置索引，重新开始打印
            }
          } 
        }, interval);
  
        // 10 秒后停止打印
        setTimeout(() => {
          clearInterval(intervalId);  // 停止 setInterval
          console.log('打印完成');
          resolve(); // 表示异步操作成功完成
        }, duration);
      });
    },
  
    //将ssid、password进行编码
    string_crc8: function(data) {
      let crc = 0x00;
      for (let i = 0; i < data.length; i++) {
          crc ^= data.charCodeAt(i);
          for (let j = 0; j < 8; j++) {
              if (crc & 0x80) {
                  crc = (crc << 1) ^ 0x07; // 0x07 是 CRC-8-CCITT 的多项式
              } else {
                  crc <<= 1;
              }
              crc &= 0xFF; // 确保 crc 保持在 8 位范围内
          }
      }
      return crc;
    },
  
    number_crc8: function(data) {
      let crc = 0x00;
      for (let i = 0; i < data.length; i++) {
          crc ^= data[i];
          for (let j = 0; j < 8; j++) {
              if (crc & 0x01) {
                  crc = (crc >> 1) ^ 0x8C; // 0x07 是 CRC-8-CCITT 的多项式
              } else {
                  crc >>= 1;
              }
              crc &= 0xFF; // 确保 crc 保持在 8 位范围内
          }
      }
      return crc;
    },
  
    single_crc8:function(crc, data){
      crc ^= data;
      for (let j = 0; j < 8; j++) {
          if (crc & 0x01) {
              crc = (crc >> 1) ^ 0x8C; // 0x07 是 CRC-8-CCITT 的多项式
          } else {
              crc >>= 1;
          }
          crc &= 0xFF; // 确保 crc 保持在 8 位范围内
      }
      return crc;
    },
  
    xor_update_buf: function(result, arr){
      if(arr.length === 0){
        throw new Error("数组不能为空");
      }
  
      for(let i = 0; i<arr.length; i++)
      {
        result ^= arr[i];
      }
  
      return result;
    },
  
    LONIB:function(X){
      return (X & 0x0f);
    },
  
    HINIB:function(X){
      return (this.LONIB(X >> 4));
    },
  
    MKBYTE:function(H, L){
      return ((H << 4) | (L & 0x0f));
    },
  
    MKINT16:function(H, L){
      return ((H << 8) | (L & 0xff));
    },
  
    tricode:function(data, index, tricode, n, comment){
      let crc = 0;
      crc = this.single_crc8(crc, data);
      console.log("data is "+ data + ", crc data:" + crc);
      crc = this.single_crc8(crc, index);
      console.log("crc index:" + crc);
  
      tricode[n] = this.MKINT16(0x00, this.MKBYTE(this.HINIB(crc), this.HINIB(data)));
      let temp_value = this.MKBYTE(this.HINIB(crc), this.HINIB(data));
      console.log(`${temp_value}, ${this.HINIB(crc)} ,${this.HINIB(data)}`);
      tricode[n+1] = this.MKINT16(0x01, index);
      tricode[n+2] = this.MKINT16(0x00, this.MKBYTE(this.LONIB(crc), this.LONIB(data)));
  
      console.log("TriCode: data=" + data + ",index="+index + ",comment=" + comment + " -> " + `tricode[${n}]=${tricode[n].toString(16)}, tricode[${n+1}]=${tricode[n+1].toString(16)}, tricode[${n+2}]=${tricode[n+2].toString(16)}`);
  
      return 3;
    },
  
    make_datumcode:function(){
      //ssid
      const ssid = this.data.wifiInfo.ssid;//"IoT_Test";
      console.log('ssid is:'+ssid);
      const arr = ssid.split("");
      console.log(arr);
      const ssidNumber = arr.map(letter => letter.charCodeAt(0));
      console.log(ssidNumber);
  
      //passwd
      const APpasswd = this.data.wifiInfo.password;//"Asdf123456"
      console.log("passwd: " + APpasswd + ", length is " + APpasswd.length);
      const Passwordarr = APpasswd.split("");
      console.log(Passwordarr);
      const passwordNumber = Passwordarr.map(letter => letter.charCodeAt(0));
      console.log(passwordNumber);
  
      //mac地址 bssid
      const MacAddress = this.data.wifiInfo.bssid;//"00:1A:2B:3C:4D:5E";
      const MacArray = MacAddress.split(":");
      console.log(MacArray);
      const MacArrayNum = MacArray.map(string => parseInt(string, 16));
      let bssid_len = MacArrayNum.length;
      console.log(MacArrayNum);
  
      //ip
      const ipAddress = this.data.wifiInfo.ip_address;//"192.168.148.129";
      const ipArray = ipAddress.split(".");
      console.log(ipArray);
      const ipArrayNum = ipArray.map(string => Number(string));
      let ip_len = ipArrayNum.length;
      console.log(ipArrayNum);
  
      let ssid_len = ssidNumber.length;
      let ssid_crc = this.number_crc8(ssidNumber);
      console.log('ssid length: ' + ssid_len +', ssid number crc:'+ ssid_crc);
    
      let bssid_crc = this.number_crc8(MacArrayNum);
      console.log('bssid number crc:'+ bssid_crc);
      let password_len = APpasswd.length;
  
      //总长度
      let total_len = 0;
      total_len = 1 + 1 + 1 + 1 + 1 + 4 + password_len + ssid_len;
      total_len %= 256;
      console.log("total_len is " + total_len);
  
      //xor结果
      let total_xor = 0;
      total_xor ^= total_len;
      total_xor ^= password_len;
      total_xor ^= ssid_crc;
      total_xor ^= bssid_crc;
      console.log("total_xor1 result: " + total_xor);
      total_xor = this.xor_update_buf(total_xor, ipArrayNum);
      console.log("total_xor2 result: " + total_xor);
      total_xor = this.xor_update_buf(total_xor, passwordNumber);
      console.log("total_xor3 result: " + total_xor);
      total_xor = this.xor_update_buf(total_xor, ssidNumber);
      console.log("total_xor result: " + total_xor);
    
      //let length = 105;
      const datumcode = this.data.data_umcode;//Array.from({ length: length }, () => 0); // 初始化元素为0
      console.log(datumcode); // [0, 0, 0, 0, 0]
        
      let n = 0;
      let t = 0;
      n += this.tricode(total_len,  t++, datumcode, n,"total_len");  
      n += this.tricode(password_len, t++, datumcode, n, "passwd_len"); 
      n += this.tricode(ssid_crc,  t++, datumcode, n, "essid_crc"); 
      n += this.tricode(bssid_crc,  t++, datumcode, n, "bssid_crc");  
      n += this.tricode(total_xor,  t++, datumcode, n, "total_xor"); 
  
      for (let i=0; i<ip_len; i++)
      {
        n += this.tricode(ipArrayNum[i], t++, datumcode , n, "ipaddr");
      }
    
      for (let i=0; i<password_len; i++)
      {
        n += this.tricode(passwordNumber[i], t++, datumcode , n, "ap_pwd");
      }
    
      for (let i=0; i<ssid_len; i++)
      {
        n += this.tricode(ssidNumber[i], t++, datumcode , n, "ssid");
      }
  
      for (let i=0; i<bssid_len; i++)
      {
        n += this.tricode(MacArrayNum[i], t++, datumcode , n, "bssid");
      }
    
      this.setData({
        "data_umcode": datumcode,
        "data_umcode_length": n
      });
      console.log(`dcode_len = ${n}, data_umcode_length=${this.data.data_umcode_length}`);
    },
  
    //UDP接收到数据的事件处理函数，参数res={message,remoteInfo}
    onUdpMessage: function(res) {
      let isRun = this.data.run
      if(res.remoteInfo.size > 0 && isRun) {
        console.log('onUdpMessage() 接收数据'+res.remoteInfo.size +'字节：'+JSON.stringify(res,null,'\t'));
        let mac = this.ExtractMacAddress(new Uint8Array(res.message))
        console.log("res.message", res.message)
        console.log("res.message unit8", new Uint8Array(res.message))
        console.log("mac address", mac)
        // todo start add device
        this.setData({
          udpResData: 'UDP接收到的内容:'+ mac
        })
        //收到设备的回信, run设置为false, 提前退出
        if(res.remoteInfo.size == 1+6+4){
          if (isRun) {
            console.log("start register device")
            let url = `${getApp().globalData.baseUrl}/device/add`
            wx.request({
              url: url,
              header: { 'content-type': 'application/json' },
              method: 'POST',
              data: { 
                name: "宠物精灵",
                mac: mac,
                openId: getApp().globalData.openid,
                url:"https://img1.baidu.com/it/u=2445505683,2852819399&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500"
              },
            success(res) {
                if (res.data.code == 200) {
                  console.log(res.data)
                } else wx.showModal({
                    title: '提示',
                    content: res.data.msg,
                    showCancel: false,
                    success(res) {
                        if (res.confirm) {
                            console.log('用户点击确定')
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
                            console.log('用户点击确定')
                        }
                    }
                });
            },
                complete() {
                    wx.hideLoading();
                }
            });
          }
          this.setData({
            run: false
          })
        }
      }
    },
    ExtractMacAddress: function(data) {
        // 确保数据长度正确
        if (data.length !== 11) {
            throw new Error('数据长度必须为11字节');
        }
        
        // 提取第2位到第7位（索引1-6）
        const macBytes = Array.from(data.slice(1, 7));
        
        // 转换为16进制字符串并拼接
        return macBytes
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    },
  
  });
  