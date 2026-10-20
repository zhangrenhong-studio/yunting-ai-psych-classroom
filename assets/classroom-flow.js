/* Clickable six-stage navigation; changing stage does not complete its task. */
(function(){'use strict';
function init(){
 var params=new URLSearchParams(location.search);if(params.get('preview')!=='teacher'&&params.get('demoFlow')!=='1')return;
 var host=document.querySelector('.stage-host');
 if(!host||!window.YueYueClass||document.querySelector('.classroom-flow'))return;
 var ids=['enter','story','talk','energy','playground','closing'];
 var labels=['课前准备','故事引导','AI 互动陪伴','音频干预','成长训练','心语留言'];
 var bar=document.createElement('nav');bar.className='classroom-flow';bar.setAttribute('aria-label','课堂六环节导航');
 bar.innerHTML='<ol>'+ids.map(function(id,i){return '<li data-flow-stage="'+id+'"><button type="button" data-flow-goto="'+id+'"><span class="flow-number">'+(i+1)+'</span><span class="flow-label">'+labels[i]+'</span></button></li>'}).join('')+'</ol>';
 host.parentNode.insertBefore(bar,host);document.documentElement.classList.add('has-classroom-flow');
 bar.addEventListener('click',function(event){var button=event.target.closest('[data-flow-goto]');if(!button||!bar.contains(button))return;if(window.YueYueClass.demoGoto)window.YueYueClass.demoGoto(button.dataset.flowGoto);else window.YueYueClass.goto(button.dataset.flowGoto);update()});
 function update(){var state=window.YueYueClass.state(),idx=ids.indexOf(state.stage);Array.from(bar.querySelectorAll('li')).forEach(function(item,i){var button=item.querySelector('button');item.classList.toggle('is-current',i===idx);item.classList.remove('is-completed');item.querySelector('.flow-number').textContent=String(i+1);if(i===idx){item.setAttribute('aria-current','step');button.setAttribute('aria-current','step')}else{item.removeAttribute('aria-current');button.removeAttribute('aria-current')}item.removeAttribute('aria-label');button.setAttribute('aria-label',labels[i]+(i===idx?'，当前环节':'，点击进入'));});}
 new MutationObserver(update).observe(host,{subtree:true,attributes:true,attributeFilter:['class']});update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();window.addEventListener('load',init);
})();
