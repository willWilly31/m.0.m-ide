import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const port = Number(process.env.PORT || 8787);
const requestWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const requestLimit = Number(process.env.RATE_LIMIT_MAX || 120);
const ipBuckets = new Map();
const aiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const aiProviderName = process.env.AI_PROVIDER || (aiBaseUrl.includes('openrouter.ai') ? 'openrouter' : 'openai-compatible');

const json = (res, statusCode, payload, extraHeaders = {}) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Request-Id',
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
};

const getClientIp = (req) => req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

const applyRateLimit = (ip) => {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) || { count: 0, resetAt: now + requestWindowMs };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + requestWindowMs;
  }

  bucket.count += 1;
  ipBuckets.set(ip, bucket);

  return {
    allowed: bucket.count <= requestLimit,
    remaining: Math.max(requestLimit - bucket.count, 0),
    resetAt: bucket.resetAt,
  };
};

const summarizeContext = (text) => {
  const fileMatch = text.match(/Currently editing:\s*([^\n]+)/i);
  const filePath = fileMatch?.[1] || 'unknown-file';
  const signals = [];

  if (/TODO|FIXME/i.test(text)) signals.push('Found TODO/FIXME markers worth addressing.');
  if (/error|failed|exception|bug/i.test(text)) signals.push('Issue-focused prompt detected.');
  if (/refactor|optimi[sz]e|performance|lag/i.test(text)) signals.push('Performance/refactor intent detected.');

  return {
    filePath,
    signals: signals.length ? signals : ['No explicit code risk markers found in provided context.'],
  };
};

const localUltraThinkReply = (lastUserMessage, contextBlob) => {
  const { filePath, signals } = summarizeContext(contextBlob);
  return [
    '### Ultra-Think Response',
    `**Focus file:** ${filePath}`,
    '',
    '**Fast diagnosis**',
    ...signals.map((signal) => `- ${signal}`),
    '',
    '**Execution plan (zero-lag oriented)**',
    '- Keep re-renders minimal by isolating state updates to changed panels only.',
    '- Abort stale async calls and only render the latest response.',
    '- Prefer cheap derived state and avoid expensive parsing inside render loops.',
    '',
    '**Your request (interpreted)**',
    `> ${String(lastUserMessage).slice(0, 400)}`,
    '',
    'If you want, ask me for a file-by-file patch plan and I will break it down next.',
  ].join('\n');
};

const callOpenAICompatible = async (messages) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  if (!apiKey) return null;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (aiBaseUrl.includes('openrouter.ai')) {
    if (process.env.OPENROUTER_SITE_URL) {
      headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
    }
    if (process.env.OPENROUTER_APP_NAME) {
      headers['X-Title'] = process.env.OPENROUTER_APP_NAME;
    }
  }

  const response = await fetch(`${aiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'You are an enterprise-grade software architect and coding copilot. Give concise, production-ready, actionable responses.',
        },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Provider error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
};

const parseBody = async (req) => {
  let rawBody = '';
  for await (const chunk of req) rawBody += chunk;
  if (!rawBody) return {};
  return JSON.parse(rawBody);
};

const server = createServer(async (req, res) => {
  const requestId = req.headers['x-request-id']?.toString() || randomUUID();
  const ip = getClientIp(req);
  const rate = applyRateLimit(ip);

  if (!rate.allowed) {
    json(res, 429, {
      error: 'Rate limit exceeded',
      requestId,
      retryAfterMs: Math.max(rate.resetAt - Date.now(), 0),
    }, {
      'X-Request-Id': requestId,
      'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)),
    });
    return;
  }

  if (!req.url || !req.method) {
    json(res, 400, { error: 'Invalid request.', requestId }, { 'X-Request-Id': requestId });
    return;
  }

  if (req.method === 'OPTIONS') {
    json(res, 204, {}, { 'X-Request-Id': requestId });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    json(res, 200, {
      ok: true,
      service: 'm0m-api',
      mode: process.env.OPENAI_API_KEY ? 'provider+fallback' : 'local-only',
      requestId,
    }, { 'X-Request-Id': requestId });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/capabilities') {
    json(res, 200, {
      webOnly: true,
      hasExternalProvider: Boolean(process.env.OPENAI_API_KEY),
      features: ['chat', 'ultra-think', 'health-check', 'rate-limit', 'request-id'],
      requestId,
    }, { 'X-Request-Id': requestId });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      json(res, 400, { error: 'Request body must be valid JSON.', requestId }, { 'X-Request-Id': requestId });
      return;
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const userMessages = messages.filter((message) => message?.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content?.trim();

    if (!lastUserMessage) {
      json(res, 400, { error: 'A user message is required.', requestId }, { 'X-Request-Id': requestId });
      return;
    }

    const mode = body.mode === 'ultra-think' ? 'ultra-think' : 'default';

    try {
      const providerReply = await callOpenAICompatible(messages);
      const message = providerReply || (mode === 'ultra-think'
        ? localUltraThinkReply(lastUserMessage, userMessages.map((m) => m.content).join('\n\n'))
        : `You said: ${String(lastUserMessage).slice(0, 300)}`);

      json(res, 200, {
        message,
        mode,
        provider: providerReply ? aiProviderName : 'local-fallback',
        requestId,
        rateLimit: { remaining: rate.remaining, resetAt: rate.resetAt },
      }, { 'X-Request-Id': requestId });
    } catch (error) {
      const fallbackMessage = localUltraThinkReply(lastUserMessage, userMessages.map((m) => m.content).join('\n\n'));
      json(res, 200, {
        message: fallbackMessage,
        mode: 'ultra-think',
        provider: 'local-fallback',
        warning: `Provider unavailable, fallback active: ${String(error.message || error).slice(0, 180)}`,
        requestId,
      }, { 'X-Request-Id': requestId });
    }
    return;
  }

  json(res, 404, { error: 'Route not found.', requestId }, { 'X-Request-Id': requestId });
});

server.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
