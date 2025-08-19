Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer: 'onShowChange'
    },
    title: {
      type: String,
      value: '昵称'
    },
    placeholder: {
      type: String,
      value: '请输入你的昵称'
    },
    nickname: {
      type: String,
      value: ''
    }
  },
  
  data: {
    currentNickname: ''
  },
  
  attached() {
    this.setData({
      currentNickname: this.properties.nickname
    });
  },
  
  methods: {
    onShowChange(newVal) {
      if (newVal) {
        this.setData({
          currentNickname: this.properties.nickname || ''
        });
      }
    },
    
    onNicknameInput(e) {
      this.setData({
        currentNickname: e.detail.value
      });
    },
    
    onMaskTap() {
      this.triggerEvent('close');
    },
    
    onCancel() {
      this.triggerEvent('cancel', {
        nickname: this.data.currentNickname
      });
    },
    
    onConfirm() {
      this.triggerEvent('confirm', {
        nickname: this.data.currentNickname
      });
    }
  }
});