// 阿里云 ESA Pages 版本（EdgeOne 版本见 ../edge-functions/[[default]].js）
//
// 与 EdgeOne 的两点差异：
// 1. 入口模型：ESA 用 addEventListener('fetch')，不是 export onRequest(context)
// 2. 路由模型：ESA Pages 没有“文件名即路由”，未命中静态资源的请求全部进本文件，
//    所以下面的 pathname 判断天然生效，不需要 [[default]] 这种 catch-all 文件名。
//
// 入口路径在根目录 esa.jsonc 的 "entry" 字段中声明。

const TARGET_URL = 'http://77.42.112.199/test-100M.bin';

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const currentUrl = new URL(request.url);

  if (currentUrl.pathname !== '/test-100M.bin') {
    return new Response('Not Found', { status: 404 });
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const headers = new Headers();

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

  const upstream = await fetch(TARGET_URL, {
    method: request.method,
    headers,
    redirect: 'manual',
  });

  const responseHeaders = new Headers(upstream.headers);

  responseHeaders.set('cache-control', 'no-store');
  responseHeaders.delete('server');
  responseHeaders.delete('x-powered-by');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
