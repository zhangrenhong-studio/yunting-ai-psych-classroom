const CACHE='yunting-r77-network-first';
const PREFIX='yunting-';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(event.request,{cache:'no-cache'});
   const type=response.headers.get('content-type')||'';
   const script=event.request.destination==='script'||url.pathname.endsWith('.js');
   if(script&&type.includes('text/html'))throw new Error('Unexpected HTML script response');
   if(response.ok)await cache.put(event.request,response.clone());
   return response;
  }catch(error){
   const cached=await cache.match(event.request);
   if(cached)return cached;
   if(event.request.mode==='navigate')return new Response('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>云听｜网络连接中断</title><body style="font:18px/1.6 sans-serif;padding:40px;color:#25465b"><h1>暂时无法打开页面</h1><p>请检查网络后重试，你的浏览器记录不会被删除。</p><button onclick="location.reload()">重新加载</button></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
   throw error;
  }
 })());
});
