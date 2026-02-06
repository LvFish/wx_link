/**
 * 蓝牙权限检查工具
 * 用于判断用户是否开启系统设置的蓝牙和小程序的蓝牙授权
 */

/**
 * 检查蓝牙授权状态
 * @returns {Promise<Object>} 返回授权状态对象
 * {
 *   systemEnabled: boolean,  // 系统蓝牙是否开启
 *   appAuthorized: boolean,  // 小程序是否已授权
 *   authStatus: string,      // 授权状态码
 *   message: string          // 提示信息
 * }
 */
function checkBluetoothAuth() {
  return new Promise((resolve) => {
    // 1. 先检查系统蓝牙是否开启
    wx.getSystemInfo({
      success: (res) => {
        const systemEnabled = res.bluetoothEnabled || false;

        if (!systemEnabled) {
          resolve({
            systemEnabled: false,
            appAuthorized: false,
            authStatus: 'system_disabled',
            message: '系统蓝牙未开启，请在系统设置中开启蓝牙'
          });
          return;
        }

        // 2. 检查小程序的蓝牙授权状态
        wx.getSetting({
          success: (settingRes) => {
            const authSetting = settingRes.authSetting || {};
            const bluetoothAuth = authSetting['scope.bluetooth'];

            if (bluetoothAuth === true) {
              // 已授权
              resolve({
                systemEnabled: true,
                appAuthorized: true,
                authStatus: 'authorized',
                message: '蓝牙授权已开启'
              });
            } else if (bluetoothAuth === false) {
              // 已拒绝授权
              resolve({
                systemEnabled: true,
                appAuthorized: false,
                authStatus: 'denied',
                message: '蓝牙权限已被拒绝，请前往设置开启'
              });
            } else {
              // 未询问过（undefined）
              resolve({
                systemEnabled: true,
                appAuthorized: false,
                authStatus: 'undetermined',
                message: '尚未请求蓝牙授权'
              });
            }
          },
          fail: () => {
            resolve({
              systemEnabled: true,
              appAuthorized: false,
              authStatus: 'check_failed',
              message: '无法获取授权状态'
            });
          }
        });
      },
      fail: () => {
        resolve({
          systemEnabled: false,
          appAuthorized: false,
          authStatus: 'check_failed',
          message: '无法获取系统信息'
        });
      }
    });
  });
}

/**
 * 请求蓝牙授权
 * @returns {Promise<Object>} 返回授权结果
 */
function requestBluetoothAuth() {
  return new Promise((resolve) => {
    wx.authorize({
      scope: 'scope.bluetooth',
      success: () => {
        resolve({
          success: true,
          message: '蓝牙授权成功'
        });
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          resolve({
            success: false,
            message: '用户拒绝授权',
            needOpenSetting: true
          });
        } else {
          resolve({
            success: false,
            message: '授权失败',
            needOpenSetting: false
          });
        }
      }
    });
  });
}

/**
 * 打开设置页面
 * @returns {Promise<boolean>} 是否成功打开
 */
function openBluetoothSetting() {
  return new Promise((resolve) => {
    wx.openSetting({
      success: (res) => {
        const authSetting = res.authSetting || {};
        const bluetoothAuth = authSetting['scope.bluetooth'];
        resolve(bluetoothAuth === true);
      },
      fail: () => {
        resolve(false);
      }
    });
  });
}

/**
 * 完整的蓝牙授权检查和请求流程
 * @param {boolean} autoRequest - 是否自动请求授权（默认true）
 * @returns {Promise<Object>} 完整的授权状态
 */
async function checkAndRequestBluetooth(autoRequest = true) {
  // 1. 检查授权状态
  const authStatus = await checkBluetoothAuth();

  // 如果系统未开启，直接返回
  if (!authStatus.systemEnabled) {
    return authStatus;
  }

  // 如果已授权，直接返回
  if (authStatus.appAuthorized) {
    return authStatus;
  }

  // 如果未授权且自动请求
  if (autoRequest && authStatus.authStatus === 'undetermined') {
    const requestResult = await requestBluetoothAuth();
    if (requestResult.success) {
      return {
        systemEnabled: true,
        appAuthorized: true,
        authStatus: 'authorized',
        message: '蓝牙授权成功'
      };
    }
  }

  return authStatus;
}

module.exports = {
  checkBluetoothAuth,
  requestBluetoothAuth,
  openBluetoothSetting,
  checkAndRequestBluetooth
};
