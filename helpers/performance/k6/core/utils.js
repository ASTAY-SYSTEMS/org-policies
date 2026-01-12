import { SharedArray } from 'k6/data';

/* ====== Config ====== */
export const config = JSON.parse(open('./org-policies/helpers/performance/k6/config.json'));

/* ====== Entorno ====== */
export const PROJECT = (__ENV.PROJECT || config.settings?.default_project || 'bambas');
export const ENV = (__ENV.ENV || config.settings?.default_env || 'qa');

/* ====== URLs ====== */
export function getEnvConfig() {
  const envCfg = config?.tenants?.[PROJECT]?.[ENV];
  if (!envCfg) {
    throw new Error(`Config no encontrada para ${PROJECT} en ${ENV}`);
  }
  return envCfg;
}

export function getBaseUrl() { return getEnvConfig().baseUrl; }
export function getTimeout() { return config.settings?.timeout || '5s'; }

export function getDefaultHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (__ENV.TOKEN) headers['Authorization'] = `Bearer ${__ENV.TOKEN}`;
  return headers;
}

/* ====== CSV loader ====== */
export function loadCSV(serviceConfig) {
    // Lo mismo para el CSV, usamos la ruta desde la raíz
    const path = `./DataTwin_VarMicroservice/auth-microservice-data-twin/performance/k6/scripts/auth/login/auth-post-login/data/${__ENV.PROJECT}.csv`;
    
    return new SharedArray(`Data`, () => {
        return csvToJson(open(path));
    });
}

function csvToJson(csv) {
  const lines = csv.split(/\r?\n/).filter(l => l.trim() !== '');
  const headers = lines.shift().split(',').map(h => h.trim());
  return lines.map(line => {
    const values = line.split(',');
    return headers.reduce((obj, h, i) => {
      obj[h] = values[i]?.trim() || '';
      return obj;
    }, {});
  });
}