import { SharedArray } from 'k6/data';

/* ====== 1. CARGA DE CONFIGURACIÓN ====== */
// La ruta se basa en tu nueva estructura
const configPath = '../../config/config.json';
export const config = JSON.parse(open(configPath));

/* ====== 2. GESTIÓN DE ENTORNO ====== */
export const PROJECT = __ENV.PROJECT || config.settings?.default_project || 'bambas';
export const ENV = __ENV.ENV || config.settings?.default_env || 'qa';

/**
 * Retorna la configuración de red (baseUrl, wsUrl) según tenant y ambiente.
 */
export function getEnvConfig() {
  const envCfg = config?.tenants?.[PROJECT]?.[ENV];
  if (!envCfg) throw new Error(`Config no encontrada para ${PROJECT} en ${ENV}`);
  return envCfg;
}

export function getBaseUrl() { return getEnvConfig().baseUrl; }
export function getWsUrl() { return getEnvConfig().wsUrl; }

/* ====== 3. HEADERS & THRESHOLDS ====== */
export function getDefaultHeaders(customHeaders = {}) {
  const headers = { 
    'Content-Type': 'application/json',
    'X-Project-Origin': PROJECT 
  };
  if (__ENV.TOKEN) headers['Authorization'] = `Bearer ${__ENV.TOKEN}`;
  return Object.assign(headers, customHeaders);
}

/**
 * Obtiene thresholds del JSON según el tipo de test (smoke, load, stress)
 */
export function getThresholds(testType) {
  return config.thresholds[testType] || config.thresholds['smoke'];
}

/* ====== 4. CARGA DINÁMICA DE DATOS (CSV) ====== */
/**
 * @param {string} filePath - Ruta relativa desde el script que lo invoca
 */
export function loadCSV(filePath) {
  return new SharedArray(`Data: ${filePath}`, function () {
    return csvToJson(open(filePath));
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