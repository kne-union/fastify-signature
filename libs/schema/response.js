// 响应 schema 会参与 fast-json-stringify 序列化：对象一律 additionalProperties: true 以免裁掉未声明字段；
// 用 nullable 而非类型数组（类型数组遇到不匹配的值会直接 500），类型不确定的字段（如外键 id、日期）只写说明不声明类型
const str = description => ({ type: 'string', nullable: true, description });
const num = description => ({ type: 'number', nullable: true, description });
const bool = description => ({ type: 'boolean', nullable: true, description });
const any = description => ({ description });
const list = (description, items) => ({ type: 'array', nullable: true, description, items });
const obj = (description, properties = {}) => ({ type: 'object', nullable: true, description, additionalProperties: true, properties });

const success = (description, schema) => ({
  200: Object.assign({}, schema || { type: 'object' }, { description })
});

const empty = (description = '操作成功，返回空对象') => success(description);

const pageResult = (description, item) => ({
  type: 'object',
  additionalProperties: true,
  properties: {
    pageData: list(`当前页${description}列表`, item),
    totalCount: num('符合条件的总条数')
  }
});

const STATUS = '状态：0 开启，1 禁用';

const secret = obj('密钥', {
  id: str('密钥 ID（同 appId）'),
  appId: str('AppId，即密钥 ID'),
  secretKey: str('脱敏后的密钥，只保留首尾各 3 位'),
  user: any('所属用户，未关联到用户时为 null'),
  description: str('描述'),
  lastVisitedAt: any('最后一次验签成功的时间'),
  status: num(STATUS),
  createdAt: any('创建时间'),
  updatedAt: any('更新时间')
});

module.exports = { str, num, bool, any, list, obj, success, empty, pageResult, STATUS, secret };
