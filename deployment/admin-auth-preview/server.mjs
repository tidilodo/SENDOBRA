import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';

// Isolated login validation. This server has no credentials for the production database.
const origin = 'http://127.0.0.1:4179';
const provider = 'https://kciwsyoebypthsnzraup.supabase.co/auth/v1';
const key = process.env.SENDOBRA_SUPABASE_PUBLISHABLE_KEY;
const allowedEmail = 'sos.alquimia@gmail.com';
const sessions = new Map();
const cookie = 'sendobra_preview';
const page = content => `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>SENDOBRA | Teste de login</title><main><h1>SENDOBRA</h1>${content}</main></html>`;
const form = message => page(`<h2>Teste de login administrativo</h2><p>${message}</p><form method="post" action="/login"><p><label>E-mail <input name="email" type="email" autocomplete="username" required></label></p><p><label>Senha <input name="password" type="password" autocomplete="current-password" required></label></p><button>Entrar</button></form>`);

async function auth(path, options = {}) {
  return fetch(provider + path, {
    ...options, redirect: 'error', signal: AbortSignal.timeout(10000),
    headers: { apikey: key, 'content-type': 'application/json', ...options.headers }
  });
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    ...headers
  });
  res.end(body);
}

async function readForm(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 4096) throw new Error('form too large');
    chunks.push(chunk);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}

async function handle(req, res) {
  if (req.headers.host !== '127.0.0.1:4179') return send(res, 400, 'Endereço inválido.');
  const id = /(?:^|;\s*)sendobra_preview=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
  if (req.method === 'POST' && req.headers.origin !== origin) return send(res, 403, 'Origem inválida.');
  for (const [sessionId, session] of sessions) if (session.expiresAt <= Date.now()) sessions.delete(sessionId);

  if (req.method === 'POST' && req.url === '/logout') {
    sessions.delete(id);
    return send(res, 303, '', { Location: '/', 'Set-Cookie': `${cookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` });
  }
  if (req.method === 'POST' && req.url === '/login') {
    if (!key?.startsWith('sb_publishable_')) return send(res, 503, form('Configure a chave publicável do projeto send.obra.'));
    const fields = await readForm(req);
    const email = fields.get('email')?.trim().toLowerCase();
    const password = fields.get('password');
    if (email !== allowedEmail || !password) return send(res, 401, form('E-mail ou senha inválidos.'));
    const response = await auth('/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (!response.ok) return send(res, response.status === 429 ? 429 : 401, form('Não foi possível entrar. Confira a conta e tente novamente.'));
    const data = await response.json();
    const age = Math.min(Number(data.expires_in), 900);
    if (!data.access_token || !Number.isFinite(age) || age <= 0) return send(res, 503, form('Sessão indisponível.'));
    const newId = randomBytes(32).toString('hex');
    sessions.delete(id);
    sessions.set(newId, { token: data.access_token, expiresAt: Date.now() + age * 1000 });
    return send(res, 303, '', { Location: '/', 'Set-Cookie': `${cookie}=${newId}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(age)}` });
  }
  if (req.method === 'GET' && req.url === '/') {
    const session = sessions.get(id);
    if (session) {
      const response = await auth('/user', { headers: { Authorization: `Bearer ${session.token}` } });
      const user = response.ok ? await response.json() : null;
      if (user?.email?.toLowerCase() === allowedEmail && user.email_confirmed_at) {
        return send(res, 200, page('<h2>Identidade confirmada pelo Supabase</h2><p>Ambiente de teste de login.</p><form method="post" action="/logout"><button>Sair</button></form>'));
      }
      sessions.delete(id);
    }
    return send(res, 200, form('Entre com sua conta do SENDOBRA.'));
  }
  send(res, 404, 'Página não encontrada.');
}

createServer((req, res) => handle(req, res).catch(() => send(res, 503, form('Serviço temporariamente indisponível.'))))
  .listen(4179, '127.0.0.1', () => process.stdout.write(`Teste de login: ${origin}\n`));
