/* Isolated static-demo guard. This is not server-side authorization. */
(function(g){'use strict';
function read(){try{return JSON.parse(sessionStorage.getItem('yunting-demo-auth-v1')||'null')}catch(e){return null}}
var user=read();
if(!user||user.role!=='student'||!user.account){var query=new URLSearchParams(location.search);query.set('id','lesson-01');query.set('explore','1');query.delete('preview');var next='course.html?'+query.toString();location.replace('index.html?role=student&reason='+ (user?'role':'login')+'&next='+encodeURIComponent(next));return;}
g.YTExploreAuth={account:String(user.account),name:String(user.name||user.account),valid:function(){var current=read();return !!current&&current.role==='student'&&String(current.account)===String(user.account)}};
})(window);
