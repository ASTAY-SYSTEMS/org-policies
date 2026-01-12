import http from 'k6/http';
import { check } from 'k6';
import { getBaseUrl, getDefaultHeaders, getTimeout } from './utils.js';

export function httpRequest(method, serviceConfig, payload = null, params = {}) {
  const url = `${getBaseUrl()}${serviceConfig.path}`;
  const requestParams = {
    headers: { ...getDefaultHeaders(), ...(params.headers || {}) },
    timeout: params.timeout || getTimeout(),
  };

  let res;
  const body = payload ? JSON.stringify(payload) : null;

  if (method === 'GET') res = http.get(url, requestParams);
  else if (method === 'POST') res = http.post(url, body, requestParams);
  else if (method === 'PUT') res = http.put(url, body, requestParams);
  else if (method === 'DELETE') res = http.del(url, null, requestParams);

  if (params.checks) check(res, params.checks);
  return res;
}

export const httpClient = {
  post: (cfg, pay, p) => httpRequest('POST', cfg, pay, p),
  get: (cfg, p) => httpRequest('GET', cfg, null, p),
};