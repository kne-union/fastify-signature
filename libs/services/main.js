const fp = require('fastify-plugin');
const crypto = require('crypto');

module.exports = fp(async (fastify, options) => {
  const { models, services } = fastify[options.name];
  const { Op } = fastify.sequelize.Sequelize;

  const escapeLike = value => String(value).replace(/[\\%_]/g, '\\$&');

  const resolveAppId = appId => {
    if (appId == null || appId === '') {
      throw new Error('Invalid appId');
    }
    // 雪花 id 超过 Number.MAX_SAFE_INTEGER，必须始终按字符串查，禁止 Number(appId)
    return String(appId);
  };

  const create = async (authenticatePayload, { description, userId: targetUserId }) => {
    const { id: userId } = authenticatePayload;
    const secretKey = crypto.randomBytes(options.secretLength).toString('hex');
    const newSecret = await models.secret.create({ secretKey, description, userId: targetUserId || userId });
    return { appId: String(newSecret.id), secretKey: newSecret.secretKey };
  };

  const verify = async ({ appId, timestamp, expire, signature }) => {
    const secret = await models.secret.findByPk(resolveAppId(appId));
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

  const list = async (authenticatePayload, { perPage = 20, currentPage = 1, filter }) => {
    filter = Object.assign({}, filter);
    const whereQuery = {};
    const sequelize = fastify.sequelize;
    const castIdLike = value =>
      sequelize.where(sequelize.cast(sequelize.col('secret.id'), 'TEXT'), {
        [Op.iLike]: `%${escapeLike(value)}%`
      });

    const keyword = filter.keyword != null ? String(filter.keyword).trim() : '';
    if (keyword) {
      const like = { [Op.iLike]: `%${escapeLike(keyword)}%` };
      whereQuery[Op.or] = [castIdLike(keyword), { description: like }, { '$user.nickname$': like }, { '$user.email$': like }, { '$user.phone$': like }];
    }

    const appId = filter.appId != null ? String(filter.appId).trim() : '';
    if (appId) {
      whereQuery[Op.and] = [...(whereQuery[Op.and] || []), castIdLike(appId)];
    }

    if (filter.status !== undefined && filter.status !== null && filter.status !== '') {
      whereQuery.status = Number(filter.status);
    }

    const { count, rows } = await models.secret.findAndCountAll({
      include: [
        {
          model: options.getUserModel(),
          required: false
        }
      ],
      where: whereQuery,
      limit: perPage,
      offset: (currentPage - 1) * perPage,
      order: [['createdAt', 'DESC']],
      distinct: true
    });
    return {
      pageData: rows.map(item => {
        const id = String(item.id);
        return {
          id,
          appId: id,
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

  // list/update/remove 均为 admin 接口，可管理任意用户密钥；勿再按创建者校验归属
  const remove = async (authenticatePayload, { appId }) => {
    const secret = await models.secret.findByPk(resolveAppId(appId));
    if (!secret) {
      throw new Error('Invalid appId');
    }
    await secret.destroy();
  };

  const update = async (authenticatePayload, { appId, status, description }) => {
    const secret = await models.secret.findByPk(resolveAppId(appId));
    if (!secret) {
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
