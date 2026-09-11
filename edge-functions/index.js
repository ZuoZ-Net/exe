const TARGET_URL = 'http://77.42.112.199/test-100M.bin';
const BACKEND_HOST = 'ts.gcncsm.cn';

export async function onRequest(context) {
  const request = context.request;
  const currentUrl = new URL(request.url);

  if (currentUrl.pathname !== '/test-100M.bin') {
    return new Response('Not Found', { status: 404 });
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const headers = new Headers();

  // 支持 Range 断点下载
  for (const key of [
    'range',
    'if-range',
    'if-none-match',
    'if-modified-since',
    'accept-encoding',
  ]) {
    const value = request.headers.get(key);
    if (value) {
      headers.set(key, value);
    }
  }

  // 后端按 ts.gcncsm.cn 这个虚拟主机处理
  headers.set('host', BACKEND_HOST);

  const upstream = await fetch(TARGET_URL, {
    method: request.method,
    headers,
    redirect: 'manual',
  });

  const responseHeaders = new Headers(upstream.headers);

  // 测速时不使用缓存
  responseHeaders.set('cache-control', 'no-store');
  responseHeaders.delete('server');
  responseHeaders.delete('x-powered-by');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
