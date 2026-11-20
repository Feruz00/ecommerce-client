/**
 * Vite SSR server — serves pre-rendered HTML for SEO.
 *
 * Dev:  node server.js          (Vite middleware + SSR)
 * Prod: npm run build && npm start
 *
 * Env:
 *   PORT=3000
 *   API_URL=http://localhost:5000
 *   PUBLIC_ORIGIN=https://your-domain.com
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:5000';

async function createServer() {
  const app = express();

  // Proxy API + uploads to backend (browser same-origin)
  app.use('/api', async (req, res) => {
    try {
      const url = `${API_URL}/api${req.url}`;
      const headers = { ...req.headers, host: undefined };
      delete headers['content-length'];
      const init = {
        method: req.method,
        headers,
        redirect: 'manual',
      };
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const chunks = [];
        for await (const c of req) chunks.push(c);
        init.body = Buffer.concat(chunks);
      }
      const upstream = await fetch(url, init);
      res.status(upstream.status);
      upstream.headers.forEach((v, k) => {
        if (k === 'transfer-encoding') return;
        res.setHeader(k, v);
      });
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.end(buf);
    } catch (e) {
      console.error('API proxy error', e.message);
      res.status(502).json({ message: 'API unavailable' });
    }
  });

  app.use('/uploads', async (req, res) => {
    try {
      const upstream = await fetch(`${API_URL}/uploads${req.url}`);
      res.status(upstream.status);
      const ct = upstream.headers.get('content-type');
      if (ct) res.setHeader('content-type', ct);
      res.end(Buffer.from(await upstream.arrayBuffer()));
    } catch {
      res.status(404).end();
    }
  });

  let vite;
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    const compression = (await import('compression')).default;
    const sirv = (await import('sirv')).default;
    app.use(compression());
    app.use(sirv(path.resolve(__dirname, 'dist/client'), { extensions: [] }));
  }

  app.use('*', async (req, res) => {
    const url = req.originalUrl;
    // Skip asset-like paths
    if (url.match(/\.\w{2,4}($|\?)/)) {
      return res.status(404).end();
    }

    try {
      let template;
      let render;

      if (!isProd) {
        template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render;
      } else {
        template = fs.readFileSync(
          path.resolve(__dirname, 'dist/client/index.html'),
          'utf-8'
        );
        render = (await import('./dist/server/entry-server.js')).render;
      }

      const lang =
        req.headers['accept-language']?.slice(0, 2) ||
        req.cookies?.lang ||
        'ru';

      const { html, helmet, state, status } = await render(url, { lang });

      const head = [
        helmet?.title?.toString() || '<title>TechStore</title>',
        helmet?.meta?.toString() || '',
        helmet?.link?.toString() || '',
        helmet?.script?.toString() || '',
      ].join('\n');

      // Production: inject built client entry from manifest
      if (isProd) {
        const manifestPath = path.resolve(__dirname, 'dist/client/.vite/manifest.json');
        let clientScript = '/assets/entry-client.js';
        if (fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          const entry =
            manifest['src/entry-client.jsx'] ||
            Object.values(manifest).find((m) => m.isEntry);
          if (entry?.file) clientScript = '/' + entry.file;
          if (entry?.css) {
            entry.css.forEach((c) => {
              template = template.replace(
                '</head>',
                `<link rel="stylesheet" href="/${c}"></head>`
              );
            });
          }
        }
        template = template.replace(
          /<script type="module" src="\/src\/entry-client\.jsx"><\/script>/,
          `<script type="module" src="${clientScript}"></script>`
        );
      }

      const page = template
        .replace('<!--app-head-->', head)
        .replace('<!--app-html-->', html)
        .replace('<!--app-state-->', JSON.stringify(state).replace(/</g, '\\u003c'));

      res.status(status || 200).set({ 'Content-Type': 'text/html' }).end(page);
    } catch (e) {
      if (vite) vite.ssrFixStacktrace(e);
      console.error(e);
      res.status(500).end(e.message);
    }
  });

  app.listen(PORT, () => {
    console.log(`SSR client  http://localhost:${PORT}  (${isProd ? 'prod' : 'dev'})`);
    console.log(`API proxy → ${API_URL}`);
  });
}

createServer();
