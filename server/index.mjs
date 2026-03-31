import { createServer } from 'node:http';

const port = Number(process.env.PORT || 8787);

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
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

const buildUltraThinkReply = (lastUserMessage, contextBlob) => {
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

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) {
    sendJson(res, 400, { error: 'Invalid request.' });
    return;
  }

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    sendJson(res, 200, { ok: true, service: 'm0m-api', mode: 'ultra-think-ready' });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    let rawBody = '';

    for await (const chunk of req) rawBody += chunk;

    let body;
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      sendJson(res, 400, { error: 'Request body must be valid JSON.' });
      return;
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const userMessages = messages.filter((message) => message?.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content?.trim();

    if (!lastUserMessage) {
      sendJson(res, 400, { error: 'A user message is required.' });
      return;
    }

    const mode = body.mode === 'ultra-think' ? 'ultra-think' : 'default';
    const message = mode === 'ultra-think'
      ? buildUltraThinkReply(lastUserMessage, userMessages.map((m) => m.content).join('\n\n'))
      : `You said: ${String(lastUserMessage).slice(0, 300)}`;

    sendJson(res, 200, { message, mode });
    return;
  }

  sendJson(res, 404, { error: 'Route not found.' });
});

server.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
