import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

function readHtml(name) {
  return fs.readFileSync(path.join(__dirname, name), 'utf-8');
}

function renderIndex() {
  return readHtml('index.html').replace('%%CONFIG_OBJ%%', JSON.stringify(config));
}

function renderBroadcast() {
  return readHtml('broadcast.html').replace('%%WHIP_URL%%', JSON.stringify(process.env.WHIP_URL || ''));
}

const hlsJs = fs.readFileSync(path.join(__dirname, 'node_modules', 'hls.js', 'dist', 'hls.min.js'));
const publisherJs = fs.readFileSync(path.join(__dirname, 'publisher.js'));

const DEFAULTS = {
  streamUrl: '/hls/live/clean/index.m3u8',
  delay: 5,
  emojis: ['🔥', '😍', '😂', '👍', '❤️', '😮', '👏', '😭', '🎉', '🙌', '💯', '🤩'],
  maxEmojis: 10,
};

function parseEmojis(raw) {
  if (!raw) return DEFAULTS.emojis;
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULTS.emojis;
  }
}

const config = {
  streamUrl: process.env.STREAM_URL || DEFAULTS.streamUrl,
  delay: parseInt(process.env.VIDEO_DELAY, 10) || DEFAULTS.delay,
  emojis: parseEmojis(process.env.EMOJIS),
  maxEmojis: parseInt(process.env.MAX_EMOJIS, 10) || DEFAULTS.maxEmojis,
};

let liveDelay = config.delay;

function logToFile(name, line) {
  try {
    fs.appendFileSync(path.join(__dirname, name), line);
  } catch {}
}

function json(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  logToFile('acceso.log', `[${new Date().toISOString()}] ${req.method} ${req.url} UA=${req.headers['user-agent'] || ''}\n`);

  if (url === '/hls.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
    res.end(hlsJs);
    return;
  }

  if (url === '/publisher.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
    res.end(publisherJs);
    return;
  }

  if (url === '/reactions.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(readHtml('reactions.js'));
    return;
  }

  if (url === '/broadcast') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(renderBroadcast());
    return;
  }

  if (url === '/config' && req.method === 'GET') {
    json(res, 200, { delay: liveDelay });
    return;
  }

  if (url === '/config' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const d = JSON.parse(body).delay;
        if (typeof d === 'number' && d >= 0 && d <= 60) liveDelay = d;
      } catch {}
      json(res, 200, { delay: liveDelay });
    });
    return;
  }

  if (url === '/log' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      logToFile('errores.log', `[${new Date().toISOString()}] ${body}\n`);
      json(res, 200, { ok: true });
    });
    return;
  }

  if (url === '/whip' || url.startsWith('/live/stream/whip')) {
    const proxyReq = http.request(
      {
        host: '127.0.0.1',
        port: 8889,
        path: url === '/whip' ? '/live/stream/whip' : url,
        method: req.method,
        headers: { ...req.headers, host: '127.0.0.1:8889' },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );
    proxyReq.on('error', () => {
      json(res, 502, { status: 'error', error: 'proxy error' });
    });
    req.pipe(proxyReq);
    return;
  }

  if (url.startsWith('/hls/')) {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const targetPath = url.slice('/hls'.length);
    const doProxy = (req2, res2, extraQuery) => {
      const proxyReq = http.request(
        {
          host: '127.0.0.1',
          port: 8888,
          path: targetPath + extraQuery + query,
          method: req2.method,
          headers: { ...req2.headers, host: '127.0.0.1:8888' },
        },
        (proxyRes) => {
          logToFile('hls.log', `[${new Date().toISOString()}] ${req2.method} ${targetPath}${extraQuery}${query} -> ${proxyRes.statusCode}\n`);
          if (proxyRes.statusCode === 302 && proxyRes.headers.location && !extraQuery) {
            proxyRes.resume();
            const loc = new URL(proxyRes.headers.location, 'http://127.0.0.1:8888');
            doProxy(req2, res2, '?' + loc.search.slice(1));
            return;
          }
          res2.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res2);
        },
      );
      proxyReq.on('error', () => {
        json(res2, 502, { status: 'error', error: 'proxy error' });
      });
      if (req2.method !== 'GET' && req2.method !== 'HEAD') {
        req2.pipe(proxyReq);
      } else {
        proxyReq.end();
      }
    };
    doProxy(req, res, '');
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(renderIndex());
});

server.listen(PORT, () => {
  console.log(`Pagina:    http://localhost:${PORT}`);
  console.log(`Broadcast: http://localhost:${PORT}/broadcast`);
  console.log(`HLS: ${config.streamUrl}`);
  console.log(`Delay: ${config.delay}s`);
});
