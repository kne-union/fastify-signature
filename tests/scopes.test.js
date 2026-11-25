const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeScopes, isRequestInScope } = require('../libs/scopes');

describe('normalizeScopes', () => {
  it('null / undefined / [] → null（不限制）', () => {
    assert.equal(normalizeScopes(null), null);
    assert.equal(normalizeScopes(undefined), null);
    assert.equal(normalizeScopes([]), null);
  });

  it('规范化 method 大写、trim path、去重', () => {
    const result = normalizeScopes([
      { method: 'get', path: ' /api/v1/open-api/a ' },
      { method: 'GET', path: '/api/v1/open-api/a' },
      { method: 'post', path: '/api/v1/open-api/b' }
    ]);
    assert.deepEqual(result, [
      { method: 'GET', path: '/api/v1/open-api/a' },
      { method: 'POST', path: '/api/v1/open-api/b' }
    ]);
  });

  it('非法项跳过；全非法 → null', () => {
    assert.equal(normalizeScopes([{ method: 'FOO', path: '/x' }, { method: '', path: '' }]), null);
  });

  it('非数组抛错', () => {
    assert.throws(() => normalizeScopes('GET /x'), /Invalid scopes/);
  });
});

describe('isRequestInScope', () => {
  const req = (method, url) => ({
    method,
    routeOptions: { url }
  });

  it('空 scopes 全放行', () => {
    assert.equal(isRequestInScope(null, req('GET', '/api/v1/open-api/any')), true);
    assert.equal(isRequestInScope([], req('POST', '/api/v1/open-api/any')), true);
  });

  it('有 scopes 仅命中 path+method 放行', () => {
    const scopes = [
      { method: 'GET', path: '/api/v1/open-api/foo/:id' },
      { method: 'POST', path: '/api/v1/open-api/bar' }
    ];
    assert.equal(isRequestInScope(scopes, req('GET', '/api/v1/open-api/foo/:id')), true);
    assert.equal(isRequestInScope(scopes, req('POST', '/api/v1/open-api/bar')), true);
  });

  it('越权拒绝', () => {
    const scopes = [{ method: 'GET', path: '/api/v1/open-api/foo' }];
    assert.equal(isRequestInScope(scopes, req('POST', '/api/v1/open-api/foo')), false);
    assert.equal(isRequestInScope(scopes, req('GET', '/api/v1/open-api/other')), false);
  });
});
