const crypto = require('crypto');

function generateSignature(appId, appSecret, expireInSeconds) {
  const timestamp = Math.floor(Date.now() / 1000); // 当前时间戳（秒）
  const expire = timestamp + expireInSeconds; // 过期时间戳
  const dataToSign = `${appId}|${timestamp}|${expire}`;

  // 使用 HMAC-SHA256 生成签名
  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(dataToSign);
  const signature = hmac.digest('hex');

  return { appId, timestamp, expire, signature };
}

module.exports = generateSignature;
