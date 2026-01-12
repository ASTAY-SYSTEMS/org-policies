
import ws from 'k6/ws';
import { getBaseUrl, getDefaultHeaders } from './utils.js';

export function wsConnect(serviceConfig, options = {}) {
  const url = `${getWsUrl()}${serviceConfig.path}`;

  return ws.connect(url, options.params || {}, function (socket) {
    socket.on('open', () => {
      options.onOpen && options.onOpen(socket);
    });

    socket.on('message', (data) => {
      options.onMessage && options.onMessage(data, socket);
    });

    socket.on('close', () => {
      options.onClose && options.onClose();
    });

    socket.on('error', (e) => {
      console.error(`❌ WS error: ${e.error || e.message}`);
    });

    // Cierre automático (si se indicó duración)
    const duration = options.duration || null;
    if (duration) {
      socket.setTimeout(() => socket.close(), duration);
    }
  });
}

/* Utilidad para formatear mensajes */
export function wsFormat(event, payload) {
  return JSON.stringify({ event, payload });
}
