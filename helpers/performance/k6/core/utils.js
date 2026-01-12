import { SharedArray } from 'k6/data';

/* ====== Config ====== */
export const config = JSON.parse(open('../config.json'));
//export const config = JSON.parse(open(import.meta.resolve('../config.json')));

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
  if (!serviceConfig?.folder) throw new Error('folder no definido');

  // Ruta relativa al script de ejecución (smoke.js)
  const path = `../../../../services/${serviceConfig.folder}/data/${PROJECT}.csv`;

  return new SharedArray(`CSV: ${serviceConfig.folder}`, () => {
    try {
      const content = open(path);
      return csvToJson(content);
    } catch (e) {
      console.error(`❌ Error ruta: ${path}`);
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