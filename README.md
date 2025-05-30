
# fastify-signature


### 描述

用于实现一个签名和验证算法


### 安装

```shell
npm i --save @kne/fastify-signature
```


### 概述

@kne/fastify-signature 是一个用于 Fastify 框架的签名验证插件。它提供了一套完整的 API 密钥管理和签名验证系统，帮助开发者轻松实现
API 的安全访问控制。

### 主要功能

1. **密钥管理**
    - 创建和管理 API 密钥（appId 和 secretKey）
    - 支持密钥状态管理（启用/禁用）
    - 提供密钥描述和最后访问时间记录

2. **签名验证**
    - 实现请求签名验证机制
    - 支持时间戳验证，防止重放攻击
    - 提供灵活的签名算法配置

3. **用户关联**
    - 支持将密钥与特定用户关联
    - 提供用户级别的密钥管理

### 技术架构

项目采用典型的 MVC 架构：

- **Models**: 定义数据模型，包括密钥管理相关的数据结构
- **Services**: 实现核心业务逻辑，包括密钥管理和签名验证
- **Controllers**: 处理 HTTP 请求，提供 RESTful API 接口

### 依赖项

- @kne/fastify-namespace: 用于组织和管理代码结构
- @kne/fastify-sequelize: 提供数据库操作支持

### 数据模型

#### Secret Model

主要字段：

- secretKey: 密钥字符串
- description: 密钥描述
- lastVisitedAt: 最后访问时间
- status: 密钥状态（0：开启，1：禁用）
- userId: 关联用户ID

### 使用场景

1. API 安全访问控制
2. 第三方应用接入认证
3. 微服务间的安全通信
4. 开放平台 API 管理

### 安全特性

1. 密钥管理安全
    - 支持密钥状态控制
    - 记录密钥使用情况

2. 请求验证安全
    - 时间戳验证
    - 签名算法保护
    - 防重放攻击


### 示例

#### 示例代码



### API

### generateSignature

用于生成API请求签名的工具函数。

#### 函数签名
```javascript
function generateSignature(appId, appSecret, expireInSeconds)
```

#### 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| appId | string/number | 是 | 应用ID |
| appSecret | string | 是 | 应用密钥 |
| expireInSeconds | number | 是 | 签名有效期（秒） |

#### 返回值

```javascript
{
  appId: string/number,     // 应用ID
  timestamp: number,        // 当前时间戳（秒）
  expire: number,          // 过期时间戳（秒）
  signature: string        // 生成的签名
}
```

#### 使用示例

```javascript
const generateSignature = require('./generateSignature');

// 生成一个有效期为1小时的签名
const result = generateSignature('your-app-id', 'your-app-secret', 3600);

console.log(result);
// 输出:
// {
//   appId: 'your-app-id',
//   timestamp: 1234567890,
//   expire: 1234571490,
//   signature: 'generated-signature-string'
// }
```

### 1. 获取密钥列表

| 项目 | 说明 |
|------|------|
| 接口路径 | `${prefix}/list` |
| 请求方法 | GET |
| 权限要求 | 需要管理员认证 |

#### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| currentPage | number | 否 | 1 | 页码 |
| perPage | number | 否 | 20 | 每页数量 |

#### 响应格式

```json
{
  "pageData": [
    {
      "id": "number",
      "appId": "number",
      "secretKey": "string (部分隐藏)",
      "description": "string",
      "lastVisitedAt": "datetime",
      "status": "number",
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ],
  "totalCount": "number"
}
```

### 2. 创建密钥

| 项目 | 说明 |
|------|------|
| 接口路径 | `${prefix}/create` |
| 请求方法 | POST |
| 权限要求 | 需要管理员认证 |

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| description | string | 否 | 密钥描述 |

#### 响应格式

```json
{
  "appId": "number",
  "secretKey": "string"
}
```

### 3. 删除密钥

| 项目 | 说明 |
|------|------|
| 接口路径 | `${prefix}/remove` |
| 请求方法 | POST |
| 权限要求 | 需要管理员认证 |

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| appId | number | 是 | 密钥ID |

#### 响应格式

```json
{}
```

### 4. 更新密钥

| 项目 | 说明 |
|------|------|
| 接口路径 | `${prefix}/update` |
| 请求方法 | POST |
| 权限要求 | 需要管理员认证 |

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| appId | number | 是 | 密钥ID |
| status | number | 否 | 密钥状态 (0: 启用, 1: 禁用) |
| description | string | 否 | 密钥描述 |

#### 响应格式

```json
{}
```

### 5. 验证密钥

| 项目 | 说明 |
|------|------|
| 接口路径 | `${prefix}/verify` |
| 请求方法 | POST |
| 权限要求 | 无需认证 |

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| appId | number | 是 | 密钥ID |
| timestamp | number | 是 | 时间戳 (秒) |
| signature | string | 是 | 签名 |
| expire | number | 是 | 过期时间 (秒) |

#### 响应格式

```json
{
  "result": "boolean",
  "errMsg": "string"
}
```

### 签名生成说明

1. 签名使用 HMAC-SHA256 算法
2. 签名字符串格式：`${appId}|${timestamp}|${expire}`
3. 使用 secretKey 作为密钥进行签名
4. 签名结果使用 hex 编码

### 错误处理

所有接口在发生错误时会返回以下格式：

```json
{
  "error": "string",
  "message": "string"
}
```

常见错误：
- Invalid appId: 无效的密钥ID
- Signature expired: 签名已过期
- Invalid signature: 签名验证失败

### 注意事项

1. 所有需要管理员认证的接口必须在请求头中包含有效的认证信息
2. 时间戳和过期时间使用 Unix 时间戳（秒）
3. 密钥状态：0 表示启用，1 表示禁用
4. 列表接口返回的 secretKey 会部分隐藏，只显示前3位和后3位
5. 使用 generateSignature 函数生成签名时，确保传入正确的参数类型和有效期

