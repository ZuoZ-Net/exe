// 阿里云 ESA Pages 版本（EdgeOne 版本见 ../edge-functions/[[default]].js）
//
// 与 EdgeOne 的两点差异：
// 1. 入口模型：ESA 要求 ES module 格式，默认导出一个带 fetch 方法的对象。
//    注意不是 addEventListener('fetch')（那是旧版 DCDN 边缘程序的写法，
//    在「函数和 Pages」运行时会报 "does not conform to the expected ES module format"），
//    也不是 EdgeOne 的 export async function onRequest(context)。
// 2. 路由模型：ESA Pages 没有“文件名即路由”，未命中静态资源的请求全部进本文件，
//    所以下面的 pathname 判断天然生效，不需要 [[default]] 这种 catch-all 文件名。
//
// 入口路径在 ESA 控制台「基本信息 → 构建信息 → 函数文件路径」中配置为 esa/index.js。
// （仓库根目录的 esa.jsonc 实测不被 Pages 构建读取，仅供 ESA CLI 使用。）

// ESA 边缘函数禁止 fetch() 直连 IP（Direct access to IP addresses is not allowed），
// 因此回源必须走域名。hq.581878.xyz 与原来的 77.42.112.199 是同一份文件
// （ETag 6aa3c950-6400000、Content-Length 104857600 均一致），经 Cloudflare 代理。
const TARGET_URL = 'https://hq.581878.xyz/test-100M.bin';
export default {
  async fetch(request, env, ctx) {
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
  },
};
