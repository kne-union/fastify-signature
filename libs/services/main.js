const fp = require('fastify-plugin');
const crypto = require('crypto');

module.exports = fp(async (fastify, options) => {
  const { models, services } = fastify[options.name];

  const create = async (authenticatePayload, { description, userId: targetUserId }) => {
    const { id: userId } = authenticatePayload;
    const secretKey = crypto.randomBytes(options.secretLength).toString('hex');
    const newSecret = await models.secret.create({ secretKey, description, userId: targetUserId || userId });
    return { appId: newSecret.id, secretKey: newSecret.secretKey };
  };

  const verify = async ({ appId, timestamp, expire, signature }) => {
    const secret = await models.secret.findByPk(appId);
    if (!secret) {
      throw new Error('Invalid appId');
    }
    const currentTime = Math.floor(Date.now() / 1000);

    // 检查是否过期
    if (currentTime > expire) {
      return {
        result: false,
        message: 'Signature expired'
      };
    }

    const dataToVerify = `${appId}|${timestamp}|${expire}`;
    const hmac = crypto.createHmac('sha256', secret.secretKey);
    hmac.update(dataToVerify);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== signature) {
      return {
        result: false,
        message: `Invalid signature [${appId},${signature},${timestamp},${expire}]`
      };
    }

    await secret.update({ lastVisitedAt: Date.now() });

    return {
      result: true,
      message: 'signature valid',
      userId: secret.userId
    };
  };

  const list = async (authenticatePayload, { perPage, currentPage }) => {
    const { id: userId } = authenticatePayload;
    const { count, rows } = await models.secret.findAndCountAll({
      include: options.getUserModel(),
      where: {},
      limit: perPage,
      offset: (currentPage - 1) * perPage
    });
    return {
      pageData: rows.map(item => {
        return {
          id: item.id,
          appId: item.id,
          secretKey: item.secretKey.substring(0, 3) + '*'.repeat(8) + item.secretKey.substring(item.secretKey.length - 3),
          user: item.user,
          description: item.description,
          lastVisitedAt: item.lastVisitedAt,
          status: item.status,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        };
      }),
      totalCount: count
    };
  };

  const remove = async (authenticatePayload, { appId }) => {
    const { id: userId } = authenticatePayload;
    const secret = await models.secret.findByPk(appId);
    if (!secret) {
      throw new Error('Invalid appId');
    }
    if (secret.userId !== userId) {
      throw new Error('Invalid appId');
    }
    await secret.destroy();
  };

  const update = async (authenticatePayload, { appId, status, description }) => {
    const { id: userId } = authenticatePayload;
    const secret = await models.secret.findByPk(appId);
    if (!secret) {
      throw new Error('Invalid appId');
    }
    if (secret.userId !== userId) {
      throw new Error('Invalid appId');
    }
    await secret.update({ status, description });
  };

  Object.assign(fastify[options.name].services, {
    create,
    verify,
    list,
    remove,
    update
  });
});
