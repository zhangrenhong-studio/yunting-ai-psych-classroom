/* Unified STATIC experience session; not server-side authorization. */
(()=>{'use strict';const KEY='yunting-demo-auth-v1';function read(){try{const s=JSON.parse(sessionStorage.getItem(KEY)||'null');return s?.role==='admin'?s:null}catch{return null}}window.YTUnifiedAdmin={read};if(!read()){document.documentElement.style.visibility='hidden';location.replace('../index.html?reason=role&role=admin&next=admin%2Findex.html');}
})();
