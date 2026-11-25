const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

/**
 * 规范化 scopes：null/[]/缺省 → null（不限制）；去重、大写 method、trim path
 * @param {Array<{method?: string, path?: string}>|null|undefined} scopes
 * @returns {Array<{method: string, path: string}>|null}
 */
const normalizeScopes = scopes => {
  if (scopes == null) {
    return null;
  }
  if (!Array.isArray(scopes)) {
    throw new Error('Invalid scopes');
  }
  if (scopes.length === 0) {
    return null;
  }
  const seen = new Set();
  const out = [];
  for (const item of scopes) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const method = String(item.method || '')
      .trim()
      .toUpperCase();
    const path = String(item.path || '').trim();
    if (!method || !path || !ALLOWED_METHODS.has(method)) {
      continue;
    }
    const key = `${method} ${path}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push({ method, path });
  }
  return out.length ? out : null;
};

/**
 * 空 scopes 直接通过；否则用 route 模板 path（含 :param）与 method 精确匹配
 * @param {Array<{method: string, path: string}>|null|undefined} scopes
 * @param {{ method?: string, routeOptions?: { url?: string }, routerPath?: string, url?: string }} request
 * @returns {boolean}
 */
const isRequestInScope = (scopes, request) => {
  if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
    return true;
  }
  const method = String(request.method || '')
    .trim()
    .toUpperCase();
  const path = request.routeOptions?.url || request.routerPath || String(request.url || '').split('?')[0];
  if (!method || !path) {
    return false;
  }
  return scopes.some(item => item.method === method && item.path === path);
};

module.exports = {
  normalizeScopes,
  isRequestInScope
};
