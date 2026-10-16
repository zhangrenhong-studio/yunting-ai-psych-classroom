/* Visual shell only. Existing classroom progress, content, and handlers remain authoritative. */
(function(g){'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function init(){var host=document.querySelector('.stage-host');if(!host||!g.YueYueClass||document.querySelector('.u-classroom-header'))return;
 document.documentElement.classList.add('classroom-ui-enabled');var course=g.YueYueClass.course,order=['enter','story','talk','energy','playground','closing'],labels=['进入课堂','故事引导','和小悦悦聊聊','心理能量','成长训练','心语留言'],short=['准备','故事','聊聊','能量','训练','心语'];
 var header=document.createElement('header');header.className='u-classroom-header';header.innerHTML='<div class="u-course-identity"><span class="u-brand">云听</span><div><strong>'+esc(course.title)+'</strong></div></div><div class="u-header-right"></div>';host.parentNode.insertBefore(header,host);var account=document.querySelector('.auth-session-control');if(account)header.querySelector('.u-header-right').appendChild(account);
 function update(){var current=host.querySelector('.stage.is-active');if(current){var legacy=current.dataset.stage==='energy'||current.dataset.stage==='closing';document.documentElement.dataset.classroomStage=current.dataset.stage;document.documentElement.classList.toggle('classroom-ui-enabled',!legacy);document.documentElement.classList.toggle('classroom-legacy-stage',legacy)}}
 Array.from(host.children).forEach(function(stage){new MutationObserver(update).observe(stage,{attributes:true,attributeFilter:['class']})});update();
 var enter=host.querySelector('[data-stage="enter"] .scene-enter'),body=enter&&enter.querySelector('.enter-body');if(body){var panel=document.createElement('div');panel.className='u-enter-panel';enter.insertBefore(panel,body);panel.appendChild(body);var figure=document.createElement('figure');figure.className='u-welcome-portrait';figure.innerHTML='<img src="'+esc(course.companion&&course.companion.image||'assets/xiaoyueyue-ip.jpg')+'" alt="小悦悦" width="1373" height="1145"><figcaption>小悦悦</figcaption>';panel.appendChild(figure)}

}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();g.addEventListener('load',init);
})(window);
