export default class ByteUtil {
	static splitUint8To2bytes(uint8) {
		if (uint8 < 0 || uint8 > 0xff) {
			console.log("ByteUtil Out of Boundary");
		}
		//String hexString = Integer.toHexString(uint8);
		let hexString = uint8.toString(16) //数字变量可以转成16进制字符串
		let result = new Uint8Array([0x0, 0x0]) // high low

		if (hexString.length > 1) {
			result[0] = parseInt(hexString.substring(0, 1), 16);
			result[1] = parseInt(hexString.substring(1, 2), 16);
		} else {
			result[0] = 0;
			result[1] = parseInt(hexString.substring(0, 1), 16)
		}

		return result;
	}

	/**
	 * @param {Object} high byte
	 * @param {Object} low byte
	 */
	static combine2bytesToOne(high, low) {
		if (high < 0 || high > 0xf || low < 0 || low > 0xf) {
			console.log("combine2bytesToOne Out of Boundary");
		}

		return (high << 4 | low);
	}

	/**
	 * @param {Object} b byte 
	 */
	static convertByte2Uint8(b) {
		// char will be promoted to int for char don't support & operator
		// & 0xff could make negatvie value to positive
		return (b & 0xff);
	}

	/**
	 * @param {Object} high byte
	 * @param {Object} low byte
	 */
	static combine2bytesToU16(high, low) {
		let tmp = new Uint8Array(2);
		//char highU8 = convertByte2Uint8(high);
		tmp[0] = ByteUtil.convertByte2Uint8(high);

		//char lowU8 = convertByte2Uint8(low);
		tmp[1] = ByteUtil.convertByte2Uint8(low);

		//return (highU8 << 8 | lowU8);
		return (tmp[0] << 8 | tmp[1]);
	}

	/**
	 * @param {Object} ipAddress string 192.168.1.101
	 */
	static ipAddressToByte(ipAddress) {
		let result = new Uint8Array(4);
		let index = 0;
		ipAddress.split('.').forEach(item => {
			result[index++] = parseInt(item);
		})
		return result;
	}

	static toUint8Arr(str) {
		const buffer = [];
		for (let i of str) {
			const _code = i.charCodeAt(0);
			if (_code < 0x80) {
				buffer.push(_code);
			} else if (_code < 0x800) {
				buffer.push(0xc0 + (_code >> 6));
				buffer.push(0x80 + (_code & 0x3f));
			} else if (_code < 0x10000) {
				buffer.push(0xe0 + (_code >> 12));
				buffer.push(0x80 + (_code >> 6 & 0x3f));
				buffer.push(0x80 + (_code & 0x3f));
			}
		}
		return Uint8Array.from(buffer);
	}

	/**
	 * 返回byte[]
	 * @param {Object} bssid  string ec:60:73:6b:f9:07
	 */
	static parseBssid2bytes(bssid) {
		let bssidSplits = bssid.split(":");
		//byte[] result = new byte[bssidSplits.length];
		let result = new Uint8Array(bssidSplits.length);
		for (let i = 0; i < bssidSplits.length; i++) {
			//result[i] = (byte) Integer.parseInt(bssidSplits[i], 16);
			result[i] = parseInt(bssidSplits[i], 16);
		}
		return result;
	}
	
	/**
	 * 转成16进制字符串 调试用
	 * @param {Object} bytes Uint8Array
	 */
	static toHexString(bytes){
		let res = ''
		for(let i = 0;i<bytes.length;i++){
			res += '0x'+bytes[i].toString(16) + ','
		}
		return res;
	}
}