const fp = require('fastify-plugin');
const path = require('node:path');
const { Unauthorized } = require('http-error');

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
          throw new Error('fastify-account plugin must be registered before fastify-trtc-conference,or set options.getAdminAuthenticate');
        }
        return fastify.account.authenticate.admin;
      },
      getUserAuthenticate: () => {
        if (!fastify.account) {
          throw new Error('fastify-account plugin must be registered before fastify-trtc-conference,or set options.getUserAuthenticate');
        }
        return fastify.account.authenticate.user;
      },
      getUserInfo: request => {
        return request.userInfo;
      },
      getUserModel: () => {
        if (!fastify.account) {
          throw new Error('fastify-account plugin must be registered before fastify-trtc-conference,or set options.getUserModel');
        }
        return fastify.account.models.user;
      },
      getOpenApiParams: request => {
        const { ['x-openapi-appid']: appId, ['x-openapi-timestamp']: timestamp, ['x-openapi-expire']: expire, ['x-openapi-signature']: signature } = request.headers;
        return Object.assign({}, { appId, timestamp, expire, signature }, request.body);
      }
    },
    options
  );

  fastify.register(require('@kne/fastify-namespace'), {
    name: options.name,
    options,
    modules: [
      ['controllers', path.resolve(__dirname, './libs/controllers')],
      [
        'models',
        await fastify.sequelize.addModels(path.resolve(__dirname, './libs/models'), {
          prefix: options.dbTableNamePrefix,
          getUserModel: options.getUserModel
        })
      ],
      ['services', path.resolve(__dirname, './libs/services')],
      [
        'authenticate',
        {
          openApi: async request => {
            const { result, message, userId } = await fastify[options.name].services.verify(options.getOpenApiParams(request));
            if (result !== true) {
              throw new Unauthorized(message);
            }
            request.openApiPayload = await options.getUserModel().findByPk(userId);
          }
        }
      ]
    ]
  });
});
