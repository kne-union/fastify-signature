const fp = require('fastify-plugin');
const path = require('node:path');

module.exports = fp(async (fastify, options) => {
  options = Object.assign(
    {},
    {
      name: 'signature',
      defaultExpire: 3 * 60,
      secretLength: 32,
      prefix: '/api/signature',
      dbTableNamePrefix: 't_signature_',
      getAdminAuthenticate: () => {
        if (!fastify.account) {
          throw new Error('fastify-account plugin must be registered before fastify-trtc-conference,or set options.getUserAuthenticate');
        }
        return fastify.account.authenticate.admin;
      },
      getUserInfo: request => {
        return request.userInfo;
      },
      getUserModel: () => {
        if (!fastify.account) {
          throw new Error('fastify-account plugin must be registered before fastify-trtc-conference,or set options.getUserModel');
        }
        return fastify.account.models.user;
      }
    },
    options
  );

  fastify.register(require('@kne/fastify-namespace'), {
    name: options.name,
    options,
    modules: [
      [
        'models',
        await fastify.sequelize.addModels(path.resolve(__dirname, './libs/models'), {
          prefix: options.dbTableNamePrefix,
          getUserModel: options.getUserModel
        })
      ],
      ['services', path.resolve(__dirname, './libs/services')]
    ]
  });
});
