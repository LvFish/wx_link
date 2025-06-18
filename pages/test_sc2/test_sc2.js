// pages/test_sc2/test_sc2.js
// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

const MydefaultAvatarUrl = '../image/my_avatar.jpg'

const app = getApp()
let Utf8ArrayToStr = require('./Utf8ArrayToStr.js');

let UDPsocket;

Page({
  data: {
    default_value: new Array(1500).fill(49), // 初始化元素为49
    data_umcode_length: 105, 
    data_umcode: new Array(105).fill(0), // 初始化元素为0
    run: true, // 变量 run，用于控制提前停止
    isWaiting: false,
    motto: 'Hello World',
    errorMessage:'',
    modalShown: 0,
    wifiInfo: {
    ssid:'TP-LINK_07B0',
    password:'hw970821',
    bssid:'',
    ip_address:''
    },
    userInfo: {
      avatarUrl: MydefaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    udpResData:'',
    udp:''
  },

  handleModalClose() {
    this.setData({
      errorMessage: '',
      modalShown: 0
    });
  },

  //记录输入的SSID
  onInputWifiSSID(e) {
    const ssid = e.detail.value
    this.setData({
      "wifiInfo.ssid": "TP-LINK_07B0",
    })
  },

  //记录输入的PASSWORD
  onInputWifiPassWord(e) {
    const password = e.detail.value
    this.setData({
      "wifiInfo.password": "hw970821",
    })
  },

  //获得IP地址
  get_IP_address: function(){
    wx.getLocalIPAddress({
      success (res) {
        console.log("localip="+res.localip);
      }
    })
  },

  //获得wifi信息
  get_wifi_info:function(res){
    wx.getConnectedWifi({
      success(res) {
        console.log(res.wifi); // 获取到的Wi-Fi信息
        // res.wifi 包含以下字段：
        console.log(`SSID=${res.wifi.SSID}, BSSID=${res.wifi.BSSID}, signalStrength=${res.wifi.signalStrength}`);
        this.get_IP_address();
      },
      fail(err) {
        console.error("getConnectedWifi is error" + err); // 错误信息
      }
    })
  },

  //初始化wifi功能
  initWIFI:function(){
    return new Promise((resolve, reject) => {
      let localip;
      let bssid;
      let intervalId;

      wx.startWifi({
        success (res) {
          wx.getConnectedWifi({
            success(res) {
              console.log(res.wifi); // 获取到的Wi-Fi信息
              // res.wifi 包含以下字段：
              bssid = res.wifi.BSSID;
            },
            fail(err) {
              console.error("getConnectedWifi is error" + err); // 错误信息
            }
          }),
          //
          wx.getLocalIPAddress({
            success (res) {
              console.log("localip="+res.localip);
              localip = res.localip;
            },
            fail(err) {
              console.error("getLocalIPAddress is error" + err); // 错误信息
            }
          })
        },
        fail (err){
          console.log("startWifi init error="+err);
        },
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

  //发送send_guidecode，515、514、513、512
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
  
  //异步处理
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

  //点击处理事件
  send: function(e) {
    console.log("this.data.wifiInfo", this.data.wifiInfo)
    //判断是否输入了
    if(!this.data.wifiInfo.ssid || !this.data.wifiInfo.password){
      this.setData({
        errorMessage: "请输入SSID 或者 PASSWORD",
        modalShown: 1
      });
    }
    else{
      //设置run为true
      this.setData({
        run: true
      });
      //等待发送OK
      this.setData({
        isWaiting: true
      });
      //发送
      this.execute();
    }
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
    let resStr = Utf8ArrayToStr.Utf8ArrayToStr(new Uint8Array(res))
    console.log("response:", resStr)
    if(res.remoteInfo.size > 0) {
      for (let index = 0; index < res.remoteInfo.size; index++) {
        console.log('res.remoteInfo[i]', res.remoteInfo[index])
      }
      console.log('onUdpMessage() 接收数据'+res.remoteInfo.size +'字节：'+JSON.stringify(res,null,'\t'));
      let messageStr = Utf8ArrayToStr.ExtractMacAddress(new Uint8Array(res.message))
      console.log("res.message", res.message)
      console.log("res.message unit8", new Uint8Array(res.message))
      console.log("messageStr", messageStr)
      this.setData({
        udpResData: 'UDP接收到的内容:'+ messageStr,
        run: false
      })
      //收到设备的回信, run设置为false, 提前退出
      if(res.remoteInfo.size == 1+6+4)
      {
        this.setData({
          run: false
        })
      }
    }
  },

  //页面加载完成事件由系统调用
  onLoad: function(){
    console.log('页面 index 开始加载事件onLoad()');
    //新建udp实例
    UDPsocket = wx.createUDPSocket();
    // 绑定错误事件
    UDPsocket.onError((err) => {
      console.error('UDP Socket error:', err);
      // 处理错误，例如记录日志、通知用户等
      wx.showToast({
        title: 'UDP通信错误',
        icon: 'none',
        duration: 2000
      });
    });

    console.log(UDPsocket);
    //udp绑定本机
    UDPsocket.bind(18266);
    //指定接收事件处理函数。监听收到消息的事件
    UDPsocket.onMessage(this.onUdpMessage);
 
    console.log('页面 index 加载完成事件onLoad()');
  },

  //图标更换
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const { nickName } = this.data.userInfo
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },

  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
})