(()=>{
 const base=new URL('../',document.currentScript.src);
 const show=()=>{
  if(document.querySelector('[data-page-recovery]'))return;
  const node=document.createElement('aside');node.dataset.pageRecovery='';node.style.cssText='position:fixed;inset:auto 16px 16px;z-index:99999;max-width:600px;margin:auto;padding:20px;border-radius:16px;background:#fff;color:#24475b;box-shadow:0 8px 40px #24475b40;font:16px/1.6 sans-serif';
  node.innerHTML='<strong>页面没有完整加载</strong><p>可能是旧版本缓存或网络中断。刷新页面会重新获取资源，不会删除你的浏览器记录。</p><button type="button" style="padding:10px 18px;border:0;border-radius:8px;background:#227c83;color:white;font:inherit">重新加载</button>';
  node.querySelector('button').onclick=async()=>{if('caches'in window){for(const k of await caches.keys())if(k.startsWith('yunting-'))await caches.delete(k)}const u=new URL(location.href);u.searchParams.set('refresh',Date.now());location.replace(u)};
  document.body.append(node);
 };
 window.addEventListener('error',e=>{if(e.target instanceof HTMLScriptElement||e.error)setTimeout(show,0)},true);
 window.addEventListener('unhandledrejection',()=>setTimeout(show,0));
 window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{const app=document.querySelector('#app');if(app&&!app.textContent.trim())show()},12000));
 if('serviceWorker'in navigator)navigator.serviceWorker.register(new URL('sw.js?v=77',base).href,{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
})();
