import ByteUtil from "./byteUtil.js";
import CRC8 from "./crc8.js"
import DataCode from "./dataCode.js"

export default class DatumCode {

	/**
	 * @param {Object} apSsid  byte[]
	 * @param {Object} apBssid  byte[]
	 * @param {Object} apPassword byte[]
	 * @param {Object} ipAddress  byte[]
	 */
	constructor(apSsid, apBssid, apPassword, ipAddress) {
		this.EXTRA_LEN = 40;
		this.EXTRA_HEAD_LEN = 5;
		this.mDataCodes = []; //DtaCode 类型

		this.apSsid = apSsid
		this.apBssid = apBssid
		this.apPassword = apPassword
		this.ipAddress = ipAddress;
		this.init();
	}

	init() {
		// Data = total len(1 byte) + apPwd len(1 byte) + SSID CRC(1 byte) +
		// BSSID CRC(1 byte) + TOTAL XOR(1 byte)+ ipAddress(4 byte) + apPwd + apSsid apPwdLen <=
		// 105 at the moment

		// total xor
		let chars = new Uint16Array(6)

		// totalXor = 0;
		chars[0] = 0

		//apPwdLen //char apPwdLen = (char) apPassword.length;
		chars[1] = this.apPassword.length;

		//CRC8 crc = new CRC8();
		let crc = new CRC8()
		crc.updateBytes(this.apSsid);
		//char apSsidCrc = (char) crc.getValue();
		chars[2] = crc.getValue();

		crc.reset();
		crc.updateBytes(this.apBssid);

		//char apBssidCrc = (char) crc.getValue();
		chars[3] = crc.getValue();

		//char apSsidLen = (char) apSsid.length;
		chars[4] = this.apSsid.length;

		//byte[] ipBytes = ipAddress.getAddress();
		let ipLen = this.ipAddress.length;

		//char totalLen = (char) (EXTRA_HEAD_LEN + ipLen + apPwdLen + apSsidLen);
		chars[5] = this.EXTRA_HEAD_LEN + ipLen + chars[1] + chars[4];
		console.log(chars[5],'totallen') //这里算出27 那到这里就开始出错了
		// build data codes
		//mDataCodes = new LinkedList<>();
		//mDataCodes.add(new DataCode(totalLen, 0));
		this.mDataCodes.push(new DataCode(chars[5], 0))
		//totalXor ^= totalLen;
		chars[0] ^= chars[5];

		//mDataCodes.add(new DataCode(apPwdLen, 1));
		this.mDataCodes.push(new DataCode(chars[1], 1))
		//totalXor ^= apPwdLen;
		chars[0] ^= chars[1];

		//mDataCodes.add(new DataCode(apSsidCrc, 2));
		this.mDataCodes.push(new DataCode(chars[2], 2));
		//totalXor ^= apSsidCrc;
		chars[0] ^= chars[2];

		//mDataCodes.add(new DataCode(apBssidCrc, 3));
		this.mDataCodes.push(new DataCode(chars[3], 3));
		//totalXor ^= apBssidCrc;
		chars[0] ^= chars[3];


		// ESPDataCode 4 is null
		let tmp = new Uint16Array(1);

		for (let i = 0; i < ipLen; ++i) {
			//char c = ByteUtil.convertByte2Uint8(ipBytes[i]);			
			tmp[0] = ByteUtil.convertByte2Uint8(this.ipAddress[i]);
			//totalXor ^= c;
			chars[0] ^= tmp[0];
			//mDataCodes.add(new DataCode(c, i + EXTRA_HEAD_LEN));
			this.mDataCodes.push(new DataCode(tmp[0], i + this.EXTRA_HEAD_LEN));
		}
		
		
		for (let i = 0; i < this.apPassword.length; i++) {
		    //char c = ByteUtil.convertByte2Uint8(apPassword[i]);			
			tmp[0] = ByteUtil.convertByte2Uint8(this.apPassword[i])
		    //totalXor ^= c;
			chars[0] ^= tmp[0];
		    //mDataCodes.add(new DataCode(c, i + EXTRA_HEAD_LEN + ipLen));
			this.mDataCodes.push(new DataCode(tmp[0],i+this.EXTRA_HEAD_LEN+ipLen));
		}

		// totalXor will xor apSsidChars no matter whether the ssid is hidden
		for (let i = 0; i < this.apSsid.length; i++) {
		    //char c = ByteUtil.convertByte2Uint8(apSsid[i]);
			tmp[0] = ByteUtil.convertByte2Uint8(this.apSsid[i]);
		    //totalXor ^= c;
			chars[0] ^= tmp[0];
		    //mDataCodes.add(new DataCode(c, i + EXTRA_HEAD_LEN + ipLen + apPwdLen));
			this.mDataCodes.push(new DataCode(tmp[0],i+this.EXTRA_HEAD_LEN+ipLen+chars[1]));
		}

		console.log('mDataCode Length2',this.mDataCodes.length);
		// // add total xor last
		// mDataCodes.add(4, new DataCode(totalXor, 4));
		this.mDataCodes.splice(4,0,new DataCode(chars[0],4));
		console.log('mDataCode Length3',this.mDataCodes.length);
		// // add bssid
		let bssidInsertIndex = this.EXTRA_HEAD_LEN;
		for (let i = 0; i < this.apBssid.length; i++) {
		    let index = chars[5] + i;
		    //char c = ByteUtil.convertByte2Uint8(apBssid[i]);
			tmp[0] = ByteUtil.convertByte2Uint8(this.apBssid[i]);
		    //DataCode dc = new DataCode(c, index);
			let dc = new DataCode(tmp[0],index);
			
		    if (bssidInsertIndex >= this.mDataCodes.length) {
		        //mDataCodes.add(dc);
				this.mDataCodes.push(dc);
		    } else {
		        //mDataCodes.add(bssidInsertIndex, dc);
				this.mDataCodes.splice(bssidInsertIndex,0,dc);
		    }
		    bssidInsertIndex += 4;
		}
		
		//那边是33 这边现在是27 所以说这里就不对了
		console.log('mDataCode Length',this.mDataCodes.length);
	}


	/**
	 * 返回byte[]
	 */
	 getBytes() {
	    //byte[] datumCode = new byte[mDataCodes.size() * DataCode.DATA_CODE_LEN];
		let datumCode = new Uint8Array(this.mDataCodes.length * 6);
	    let index = 0;
	    // for (DataCode dc : mDataCodes) {
	    //     for (byte b : dc.getBytes()) {
	    //         datumCode[index++] = b;
	    //     }
	    // }
		this.mDataCodes.forEach(dc=>{
			dc.getBytes().forEach(b=>{
				datumCode[index++] = b;
			})
		})
	    return datumCode;
	}

	// @Override
	// public String toString() {
	//     StringBuilder sb = new StringBuilder();
	//     byte[] dataBytes = getBytes();
	//     for (byte dataByte : dataBytes) {
	//         String hexString = ByteUtil.convertByte2HexString(dataByte);
	//         sb.append("0x");
	//         if (hexString.length() == 1) {
	//             sb.append("0");
	//         }
	//         sb.append(hexString).append(" ");
	//     }
	//     return sb.toString();
	// }

	/**
	 * utf8 string ?
	 * @return
	 */
	// @Override
	getU8s() {
	    //byte[] dataBytes = getBytes();
		let dataBytes = this.getBytes();
	    let len = dataBytes.length / 2; //因为两个合并位一个char了
	    //char[] dataU8s = new char[len];
		let dataU8s = new Uint16Array(len);
		
	    //byte high, low;
		let bytes = new Uint8Array(2);
	    for (let i = 0; i < len; i++) {
	        //high = dataBytes[i * 2];
			bytes[0] = dataBytes[i*2];
	        //low = dataBytes[i * 2 + 1];
			bytes[1] = dataBytes[i*2 + 1];
			
	        //dataU8s[i] = (char) (ByteUtil.combine2bytesToU16(high, low) + EXTRA_LEN);
			dataU8s[i] = ByteUtil.combine2bytesToU16(bytes[0],bytes[1]) + this.EXTRA_LEN;
	    }
	    return dataU8s;
	}
}