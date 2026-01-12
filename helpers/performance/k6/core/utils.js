import { SharedArray } from 'k6/data';

/* ====== Config ====== */
export const config = JSON.parse(open('./org-policies/helpers/performance/config.json'));

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
  // Construimos la ruta desde la raíz del Pipeline (Workspace)
  const path = `./datatwin_varmicroservice/auth-microservice-data-twin/performance/k6/scripts/auth/login/auth-post-login/data/${__ENV.PROJECT}.csv`;

  return new SharedArray(`Data`, () => {
    try {
      return csvToJson(open(path));
    } catch (e) {
      console.error(`❌ No se encontró el archivo en: ${path}`);
      throw e;
    }
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