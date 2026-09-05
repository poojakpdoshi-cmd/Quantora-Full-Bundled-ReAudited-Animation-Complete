import 'node:process';
import { createServer } from 'node:http';
import app from '../../api/src/index';

const port = Number(process.env.PORT || 8787);
const env = {
  APP_NAME: process.env.APP_NAME || 'Quantora',
  PUBLIC_API_BASE_URL: process.env.PUBLIC_API_BASE_URL,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD_SALT: process.env.ADMIN_PASSWORD_SALT,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  ADMIN_PASSWORD_ITERATIONS: process.env.ADMIN_PASSWORD_ITERATIONS,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  QA_PROVIDER: process.env.QA_PROVIDER || 'cloudflare',
  CLOUDFLARE_QA_MODEL: process.env.CLOUDFLARE_QA_MODEL || '@cf/meta/llama-3.1-8b-instruct-fast',
  APK_BUILD_SERVICE_URL: process.env.APK_BUILD_SERVICE_URL,
  APK_BUILD_SERVICE_TOKEN: process.env.APK_BUILD_SERVICE_TOKEN,
  GOOGLE_SEARCH_CONSOLE_CLIENT_ID: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID,
  GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET: process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET,
  GOOGLE_SEARCH_CONSOLE_REDIRECT_URI: process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GITHUB_REDIRECT_URI: process.env.GITHUB_REDIRECT_URI,
  VERCEL_CLIENT_ID: process.env.VERCEL_CLIENT_ID,
  VERCEL_CLIENT_SECRET: process.env.VERCEL_CLIENT_SECRET,
  VERCEL_REDIRECT_URI: process.env.VERCEL_REDIRECT_URI,
  VERCEL_INTEGRATION_SLUG: process.env.VERCEL_INTEGRATION_SLUG,
  FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
  FIREBASE_CLIENT_SECRET: process.env.FIREBASE_CLIENT_SECRET,
  FIREBASE_REDIRECT_URI: process.env.FIREBASE_REDIRECT_URI,
  OAUTH_ALLOWED_ORIGINS: process.env.OAUTH_ALLOWED_ORIGINS,
  TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN,
  GMAIL_USER_EMAIL: process.env.GMAIL_USER_EMAIL || 'quantoraby.quantacy@gmail.com',
  ENVIRONMENT: process.env.ENVIRONMENT || 'production'
};

const server = createServer(async (incoming, outgoing) => {
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of incoming) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const method = incoming.method || 'GET';
    const host = incoming.headers.host || `127.0.0.1:${port}`;
    const url = `http://${host}${incoming.url || '/'}`;
    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) {
      if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
      else if (value !== undefined) headers.set(name, value);
    }
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const init: RequestInit & { duplex?: 'half' } = { method, headers };
    if (method !== 'GET' && method !== 'HEAD' && body) {
      init.body = body;
      init.duplex = 'half';
    }
    const executionContext = {
      waitUntil(promise: Promise<unknown>) {
        void promise.catch(console.error);
      },
      passThroughOnException() {}
    } as Parameters<typeof app.fetch>[2];

    const response = await app.fetch(
      new Request(url, init),
      env,
      executionContext
    );
    outgoing.statusCode = response.status;
    response.headers.forEach((value, name) => outgoing.setHeader(name, value));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    outgoing.statusCode = 500;
    outgoing.setHeader('content-type', 'application/json');
    outgoing.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected server error.' }));
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Quantora API running at http://127.0.0.1:${port}`);
});
