/**
 * one data format:(data code should have 2 to 65 data)
 * <p>
 * control byte       high 4 bits    low 4 bits
 * 1st 9bits:       0x0             crc(high)      data(high)
 * 2nd 9bits:       0x1                sequence header
 * 3rd 9bits:       0x0             crc(low)       data(low)
 * <p>
 * sequence header: 0,1,2,...
 *
 * @author afunx
 */
import ByteUtil from "./byteUtil.js"
import CRC8 from './crc8.js'
export default class DataCode {

/**
 * @param {Object} u8   char
 * @param {Object} index char的位置
 */
	constructor(u8,index){
		this.DATA_CODE_LEN = 6;
		this.INDEX_MAX = 127 //INDEX_MAX = 127; //应该是传输的数据长度 最多127 太长了一个字节表示不了？
		
		//下面全是byte
		this.mSeqHeader = 0x00;
		this.mDataHigh = 0x00;;
		this.mDataLow = 0x00;;
		// the crc here means the crc of the data and sequence header be transformed
		// it is calculated by index and data to be transformed
		this.mCrcHigh = 0x00;
		this.mCrcLow = 0x00;
		this.init(u8,index)
	}
	
	init(u8,index){
		if (index > this.INDEX_MAX) {
		    console.log("dataCode  index > INDEX_MAX");
						
		}		
		let dataBytes = ByteUtil.splitUint8To2bytes(u8);
		
		this.mDataHigh = dataBytes[0];
		this.mDataLow = dataBytes[1];
		let crc8 = new CRC8();
		//crc8.update(ByteUtil.convertUint8toByte(u8));
		//crc8.update(index);
		crc8.updateInt(u8);
		crc8.updateInt(index);
		let crcBytes = ByteUtil.splitUint8To2bytes(crc8.getValue())
		
		//byte[] crcBytes = ByteUtil.splitUint8To2bytes((char) crc8.getValue());
		this.mCrcHigh = crcBytes[0];
		this.mCrcLow = crcBytes[1];
		this.mSeqHeader = index;
	}

	getBytes(){
		let dataBytes = new Uint8Array(this.DATA_CODE_LEN);
		dataBytes[0] = 0x00;
		dataBytes[1] = ByteUtil.combine2bytesToOne(this.mCrcHigh, this.mDataHigh);
		dataBytes[2] = 0x01;
		dataBytes[3] = this.mSeqHeader;
		dataBytes[4] = 0x00;
		dataBytes[5] = ByteUtil.combine2bytesToOne(this.mCrcLow, this.mDataLow);
		return dataBytes;
	}

    // @Override
    // public byte[] getBytes() {
    //     byte[] dataBytes = new byte[DATA_CODE_LEN];
    //     dataBytes[0] = 0x00;
    //     dataBytes[1] = ByteUtil.combine2bytesToOne(mCrcHigh, mDataHigh);
    //     dataBytes[2] = 0x01;
    //     dataBytes[3] = mSeqHeader;
    //     dataBytes[4] = 0x00;
    //     dataBytes[5] = ByteUtil.combine2bytesToOne(mCrcLow, mDataLow);
    //     return dataBytes;
    // }

    // @Override
    // public String toString() {
    //     StringBuilder sb = new StringBuilder();
    //     byte[] dataBytes = getBytes();
    //     for (int i = 0; i < DATA_CODE_LEN; i++) {
    //         String hexString = ByteUtil.convertByte2HexString(dataBytes[i]);
    //         sb.append("0x");
    //         if (hexString.length() == 1) {
    //             sb.append("0");
    //         }
    //         sb.append(hexString).append(" ");
    //     }
    //     return sb.toString();
    // }

    // @Override
    // public char[] getU8s() {
    //     throw new RuntimeException("DataCode don't support getU8s()");
    // }

}