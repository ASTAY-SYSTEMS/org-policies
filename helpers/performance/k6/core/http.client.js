import http from 'k6/http';
import { check } from 'k6';
import { getBaseUrl, getDefaultHeaders, getTimeout } from './utils.js';

/**
 * @param {string} method - GET, POST, PUT, DELETE
 * @param {object} endpointConfig - Objeto del endpoint extraído del config.json
 * @param {object} payload - Body de la petición
 * @param {object} params - Checks, headers adicionales, etc.
 */
export function httpRequest(method, endpointConfig, payload = null, params = {}) {
  // Validamos que endpointConfig exista para evitar errores de undefined
  if (!endpointConfig || !endpointConfig.path) {
    throw new Error(`Error: path no definido para la petición ${method}`);
  }

  const url = `${getBaseUrl()}${endpointConfig.path}`;
  
  const requestParams = {
    headers: { ...getDefaultHeaders(), ...(params.headers || {}) },
    timeout: params.timeout || getTimeout(),
  };

  const body = payload ? JSON.stringify(payload) : null;
  
  // Ejecución de la petición
  const res = http.request(method, url, body, requestParams);

  // Checks automáticos + personalizados
  const defaultChecks = { 'status is 200 or 201': (r) => r.status === 200 || r.status === 201 };
  const allChecks = Object.assign(defaultChecks, params.checks || {});
  
  check(res, allChecks);

  return res;
}

export const httpClient = {
  post: (cfg, pay, p) => httpRequest('POST', cfg, pay, p),
  get: (cfg, p) => httpRequest('GET', cfg, null, p),
  put: (cfg, pay, p) => httpRequest('PUT', cfg, pay, p),
  del: (cfg, p) => httpRequest('DELETE', cfg, null, p),
};