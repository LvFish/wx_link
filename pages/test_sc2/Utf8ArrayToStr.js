// Utf8ArrayToStr.js
function Utf8ArrayToStr(array) {
  var out, i, len, c;
  var char2, char3;

  out = "";
  len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        out += String.fromCharCode(c);
        break;
      case 12: case 13:
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        break;
      case 14:
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(((c & 0x0F) << 12) |
          ((char2 & 0x3F) << 6) |
          ((char3 & 0x3F) << 0));
        break;
    }
  }
  return out;
}

function ExtractMacAddress(data) {
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
}

module.exports = {
  Utf8ArrayToStr: Utf8ArrayToStr,
  ExtractMacAddress: ExtractMacAddress
}