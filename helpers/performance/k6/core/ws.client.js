// @ts-nocheck
// ws.client.js - Conexión y utilidad WebSocket para K6
import ws from 'k6/ws';
import { check } from 'k6';
import { getWsUrl, getDefaultHeaders } from '../../../../core/utils.js';

/**
 * Conecta a un WebSocket y maneja eventos con callbacks.
 * 
 * @param {object} serviceConfig - Config del endpoint WS desde config.json
 * @param {object} options - Opciones adicionales:
 *   - headers: Headers extra
 *   - onOpen: callback al abrir la conexión
 *   - onMessage: callback al recibir mensaje
 *   - onClose: callback al cerrar
 *   - duration: tiempo de conexión en ms
 */
export function wsConnect(serviceConfig, options = {}) {
  const url = `${getWsUrl()}${serviceConfig.path}`;

  const params = {
    headers: { ...getDefaultHeaders(), ...(options.headers || {}) },
    tags: { endpoint: serviceConfig.path },
  };

  return ws.connect(url, params, (socket) => {
    // Evento abierto
    socket.on('open', () => {
      check(null, { 'WS connection successful': () => true });
      if (options.onOpen) options.onOpen(socket);
    });

    // Evento mensaje
    socket.on('message', (data) => {
      if (options.onMessage) options.onMessage(data, socket);
    });

    // Evento cierre
    socket.on('close', () => {
      if (options.onClose) options.onClose();
    });

    // Evento error
    socket.on('error', (e) => {
      console.error(`WS Error: ${e.error ? e.error() : e}`);
    });

    // Cierre automático después de duration ms
    const duration = options.duration || 10000; // 10s por defecto
    socket.setTimeout(() => {
      socket.close();
    }, duration);
  });
}

/**
 * Formatea mensajes para enviar por WebSocket
 * 
 * @param {string} event - Nombre del evento
 * @param {object} payload - Datos a enviar
 * @returns {string} JSON string
 */
export function wsFormat(event, payload) {
  return JSON.stringify({ event, payload });
}
