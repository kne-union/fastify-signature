const fp = require('fastify-plugin');

module.exports = fp(async (fastify, options) => {
  const { services } = fastify[options.name];
  const adminAuth = options.getAdminAuthenticate();
  const userAuth = options.getUserAuthenticate();
  fastify.get(
    `${options.prefix}/list`,
    {
      onRequest: [userAuth, adminAuth],
      schema: {
        description: '获取密钥列表',
        summary: '获取密钥列表',
        query: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'number',
              description: '页码',
              default: 1
            },
            perPage: {
              type: 'number',
              description: '每页数量',
              default: 20
            }
          }
        }
      }
    },
    async request => {
      return services.list(options.getUserInfo(request), request.query);
    }
  );

  fastify.post(
    `${options.prefix}/create`,
    {
      onRequest: [userAuth, adminAuth],
      schema: {
        description: '创建密钥',
        summary: '创建密钥',
        body: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: '描述'
            }
          }
        }
      }
    },
    async request => {
      return services.create(options.getUserInfo(request), request.body);
    }
  );

  fastify.post(
    `${options.prefix}/remove`,
    {
      onRequest: [userAuth, adminAuth],
      schema: {
        description: '删除密钥',
        summary: '删除密钥',
        body: {
          type: 'object',
          properties: {
            appId: {
              type: 'string',
              description: '密钥ID'
            }
          }
        }
      }
    },
    async request => {
      await services.remove(options.getUserInfo(request), request.body);
      return {};
    }
  );

  fastify.post(
    `${options.prefix}/update`,
    {
      onRequest: [userAuth, adminAuth],
      schema: {
        description: '更新密钥',
        summary: '更新密钥',
        body: {
          type: 'object',
          properties: {
            appId: {
              type: 'string',
              description: '密钥ID'
            },
            status: {
              type: 'number',
              description: '密钥状态'
            },
            description: {
              type: 'string',
              description: '描述'
            }
          }
        }
      }
    },
    async request => {
      await services.update(options.getUserInfo(request), request.body);
      return {};
    }
  );

  fastify.post(
    `${options.prefix}/verify`,
    {
      schema: {
        description: '验证密钥',
        summary: '验证密钥',
        body: {
          type: 'object',
          properties: {
            appId: {
              type: 'string',
              description: '密钥ID'
            },
            timestamp: {
              type: 'number',
              description: '时间戳'
            },
            signature: {
              type: 'string',
              description: '签名'
            },
            expire: {
              type: 'number',
              description: '过期时间'
            }
          }
        }
      }
    },
    async request => {
      return services.verify(request.body);
    }
  );
});
