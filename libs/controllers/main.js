const fp = require('fastify-plugin');
const { str, bool, any, success, empty, pageResult, STATUS, secret } = require('../schema/response');

const ADMIN_TAG = '签名管理后台-密钥';
const TAG = '签名-验签';

module.exports = fp(async (fastify, options) => {
  const { services } = fastify[options.name];
  const adminAuth = options.getAdminAuthenticate();
  const userAuth = options.getUserAuthenticate();
  fastify.get(
    `${options.prefix}/list`,
    {
      onRequest: [userAuth, adminAuth],
      schema: {
        tags: [ADMIN_TAG],
        description: '分页查询全部用户的密钥，按创建时间倒序；密钥只返回脱敏值',
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
            },
            filter: {
              type: 'object',
              additionalProperties: true,
              description: '筛选条件',
              properties: {
                keyword: { type: 'string', description: '关键字（AppId/描述/所属用户）' },
                appId: { type: 'string', description: 'AppId' },
                status: { description: '状态: 0开启，1禁用' }
              }
            }
          }
        },
        response: success('密钥分页列表', pageResult('密钥', secret))
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
        tags: [ADMIN_TAG],
        description: '生成一对 AppId / 密钥，密钥明文只在创建时返回一次',
        summary: '创建密钥',
        body: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: '描述'
            },
            userId: {
              description: '密钥所属用户 ID，不传为当前登录用户；验签通过后以该用户身份访问开放接口'
            }
          }
        },
        response: success('创建的密钥', {
          type: 'object',
          properties: {
            appId: str('AppId'),
            secretKey: str('密钥明文，只返回这一次')
          }
        })
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
        tags: [ADMIN_TAG],
        description: '删除密钥，删除后该 AppId 无法再通过验签；AppId 不存在时报错',
        summary: '删除密钥',
        body: {
          type: 'object',
          properties: {
            appId: {
              type: 'string',
              description: '密钥ID'
            }
          }
        },
        response: empty('删除成功')
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
        tags: [ADMIN_TAG],
        description: '修改密钥状态与描述，未传的字段保持原值；AppId 不存在时报错',
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
              description: `密钥${STATUS}`
            },
            description: {
              type: 'string',
              description: '描述'
            }
          }
        },
        response: empty('更新成功')
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
        tags: [TAG],
        description: '免登录。按 HMAC-SHA256(`${appId}|${timestamp}|${expire}`, 密钥) 校验签名，通过后记录最后访问时间；签名错误或过期返回 result=false，AppId 不存在时报错',
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
              description: '签名时的时间戳（秒）'
            },
            signature: {
              type: 'string',
              description: '签名（hex）'
            },
            expire: {
              type: 'number',
              description: '过期时间戳（秒），当前时间超过即验签失败'
            }
          }
        },
        response: success('验签结果', {
          type: 'object',
          properties: {
            result: bool('是否通过验签'),
            message: str('结果说明'),
            userId: any('密钥所属用户 ID，仅通过验签时返回')
          }
        })
      }
    },
    async request => {
      return services.verify(request.body);
    }
  );
});
