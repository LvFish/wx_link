// pages/ap/ap_next_step/ap_next_step.js
import logger from '../../../log.js'
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
      isModalShow: false,
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

    onHide() {
      // 页面隐藏时释放资源（推荐）
      this.releaseResources();
    },
    
    onUnload() {
      // 页面卸载时再次释放（确保双重保险）
      this.releaseResources();
    },
    releaseResources() {
      logger.info('release resource udpSocket', UDPsocket)
      if (UDPsocket) {
        UDPsocket.close(); // 触发 onClose 回调
        UDPsocket = null;
        logger.info('成功销毁实例')
      }
      this.setData({
        run: false
      })
      
    },
    initResources() {
      logger.info('init resource udpSocket', UDPsocket)
      if (!UDPsocket) {
        UDPsocket = wx.createUDPSocket();
         // 绑定错误事件
        UDPsocket.onError((err) => {
          logger.error('UDP Socket create error:', err);
        });
        //udp绑定本机
        UDPsocket.bind(18266);
        //指定接收事件处理函数。监听收到消息的事件
        UDPsocket.onMessage(this.onUdpMessage);
        logger.info('初始化实例成功');
      }
    },
  
    onLoad() {
      this.getAvailableWifiList();
      logger.info('页面 index 开始加载事件onLoad()');
      //新建udp实例
      this.initResources();
    },
  
    onPasswordInput(e) {
      this.setData({
        password: e.detail.value
      });
    },

    changeAp(e){
      console.log("jump ap")
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
                ssid: wifi.SSID,    // WiFi名称
                bssid: wifi.BSSID   // WiFi MAC地址
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
          "wifiInfo.ssid":selectedWifi.SSID,
          "wifiInfo.bssid":selectedWifi.BSSID,
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

    // 关闭弹窗
    closeModal() {
      this.setData({
        isModalShow: false
      });
    },

    startSmartConfig() {
      logger.info('start SmartConfig')
      const { wifiInfo, password } = this.data;
      logger.info('wifiInfo:', wifiInfo, ' password:', password)
      if (!wifiInfo || !wifiInfo.ssid || !password) {
        this.setData({
          result: '请选择有效的 Wi-Fi 并输入密码'
        });
        return;
      }
      logger.info('selectedWifi', wifiInfo)
      logger.info('selectedWifi ssid', wifiInfo.ssid)
      logger.info('selectedWifi bssid', wifiInfo.bssid)
      this.setData({
        ssid: wifiInfo.ssid,
        bssid: wifiInfo.bssid,
        password: password
      })
      // 连接wifi
      logger.info("start execute()")
      this.execute()
    },

    execute: async function(){
      await this.initWIFI();

      for(let i = 0; i< 10; i++){
        await this.send_guidecode();
        await this.send_datumcode();
      }
  
      this.setData({ //停止等待
        isWaiting: false
      });
    },

    initWIFI:function(){
      return new Promise((resolve, reject) => {
        let intervalId;
        let localip;
        let that = this;
        let ssid = that.data.ssid;
        let password = that.data.password;
        let bssid = that.data.bssid;
        logger.info("start connectWifi()")
        wx.showLoading({
          title: '设置中...'
        })
        wx.getLocalIPAddress({
          success (res) {
            localip = res.localip;
            that.setData({
              "wifiInfo.ip_address":localip,
              "wifiInfo.ssid":ssid,
              "wifiInfo.password":password,
              "wifiInfo.bssid":bssid,
              run: true,
              isWaiting: true
            })
            logger.info('get local ip success localip:', localip)
          },
          fail(err) {
            logger.error("getLocalIPAddress is error" + err); // 错误信息
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
            logger.info(`ip_address=${this.data.wifiInfo.ip_address}, bssid=${this.data.wifiInfo.bssid}`);
            this.make_datumcode();
  
            clearInterval(intervalId);
            resolve(); // 或者可以根据情况调用 reject() 表示失败
          }
        }, 100);
      });
    },
   
    send_guidecode:function(){
      return new Promise((resolve, reject) => {
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
            // logger.info('提前停止打印');
            resolve(); // 或者可以根据情况调用 reject() 表示失败
          } else {
            // 打印数组中的元素
            // logger.info(arr[index]);
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
          resolve(); // 表示异步操作成功完成
        }, duration);
      });
    },
  
    //发送 datumcode
    send_datumcode:function(){
      return new Promise((resolve, reject) => {
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
            // logger.info('提前停止打印');
            resolve(); // 表示异步操作成功完成
          } else {
            // 打印数组中的元素
            // logger.info(arr[index]+40);
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
      crc = this.single_crc8(crc, index);
  
      tricode[n] = this.MKINT16(0x00, this.MKBYTE(this.HINIB(crc), this.HINIB(data)));
      let temp_value = this.MKBYTE(this.HINIB(crc), this.HINIB(data));
      tricode[n+1] = this.MKINT16(0x01, index);
      tricode[n+2] = this.MKINT16(0x00, this.MKBYTE(this.LONIB(crc), this.LONIB(data)));
  
      return 3;
    },
    stringToBytes:function(str){
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
    },
    make_datumcode:function(){
      //ssid
      const ssid = this.data.wifiInfo.ssid;//"IoT_Test";
      logger.info('ssid is:'+ssid);
      const arr = ssid.split("");
      const ssidNumber = this.stringToBytes(ssid);
      console.log("arr is", arr)
      console.log("ssidNumber is", ssidNumber)
  
      //passwd
      const APpasswd = this.data.wifiInfo.password;//"Asdf123456"
      logger.info("passwd: " + APpasswd + ", length is " + APpasswd.length);
      const Passwordarr = APpasswd.split("");
      const passwordNumber = Passwordarr.map(letter => letter.charCodeAt(0));
  
      //mac地址 bssid
      const MacAddress = this.data.wifiInfo.bssid;//"00:1A:2B:3C:4D:5E";
      const MacArray = MacAddress.split(":");
      const MacArrayNum = MacArray.map(string => parseInt(string, 16));
      let bssid_len = MacArrayNum.length;
  
      //ip
      const ipAddress = this.data.wifiInfo.ip_address;
      logger.info("ipAddress", ipAddress);
      const ipArray = ipAddress.split(".");
      const ipArrayNum = ipArray.map(string => Number(string));
      let ip_len = ipArrayNum.length;
  
      let ssid_len = ssidNumber.length;
      let ssid_crc = this.number_crc8(ssidNumber);
      logger.info('ssid length: ' + ssid_len +', ssid number crc:'+ ssid_crc);
    
      let bssid_crc = this.number_crc8(MacArrayNum);
      logger.info('bssid number crc:'+ bssid_crc);
      let password_len = APpasswd.length;
  
      //总长度
      let total_len = 0;
      total_len = 1 + 1 + 1 + 1 + 1 + 4 + password_len + ssid_len;
      total_len %= 256;
      logger.info("total_len is " + total_len);
  
      //xor结果
      let total_xor = 0;
      total_xor ^= total_len;
      total_xor ^= password_len;
      total_xor ^= ssid_crc;
      total_xor ^= bssid_crc;
      total_xor = this.xor_update_buf(total_xor, ipArrayNum);
      total_xor = this.xor_update_buf(total_xor, passwordNumber);
      total_xor = this.xor_update_buf(total_xor, ssidNumber);
    
      //let length = 105;
      const datumcode = this.data.data_umcode;//Array.from({ length: length }, () => 0); // 初始化元素为0
      logger.info('datumcode:', datumcode); // [0, 0, 0, 0, 0]
        
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
      logger.info(`dcode_len = ${n}, data_umcode_length=${this.data.data_umcode_length}`);
    },

    
  
    //UDP接收到数据的事件处理函数，参数res={message,remoteInfo}
    onUdpMessage: function(res) {
      let isRun = this.data.run
      if(res.remoteInfo.size > 0 && isRun) {
        logger.info('onUdpMessage() 接收数据'+res.remoteInfo.size +'字节：'+JSON.stringify(res,null,'\t'));
        let mac = this.ExtractMacAddress(new Uint8Array(res.message))
        logger.info("res.message", res.message)
        logger.info("res.message unit8", new Uint8Array(res.message))
        logger.info("mac address", mac)
        // todo start add device
        this.setData({
          udpResData: 'UDP接收到的内容:'+ mac
        })
        //收到设备的回信, run设置为false, 提前退出
        if(res.remoteInfo.size == 1+6+4){
          if (isRun) {
            logger.info("start register device")
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
                          success (res) {
                              logger.info(res)
                          },
                          fail: (err)=> {
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
  