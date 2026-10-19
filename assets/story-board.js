/* Continuous story → knowledge → expression; media events, never timers, advance narration. */
(function(g){'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
g.YTStoryLetter={build:function(course,onDone){
 var d=course.stages.story,k=d.knowledge||{},p=d.prompt||{},spec=d.narration||{},cues=spec.cues||[],paras=(d.beats||[]).map(function(b){return b.text}),groups=[],pending='',first=0;
 paras.forEach(function(t,i){pending+=t;if((/[。！？？！」”]$/.test(t)&&pending.length>=45)||pending.length>=115||i===paras.length-1){groups.push({text:pending,start:cues[first]?cues[first].start:null,end:cues[i]?cues[i].end:null});pending='';first=i+1}});
 var root=document.createElement('section');root.className='stage r99-story-stage';root.dataset.stage='story';root.dataset.view='read';
 var active=false,paused=false,hidden=!!document.hidden,mode='read',revealed=0,draft='',playing=false,epoch=0,task=null,restart=null,autoFollow=true,storyComplete=false,submitted=false,started=false,expanded=false;
 var audio=spec.src?new Audio(spec.src):null,knowledgeAudio=/^lesson-0[1-8]$/.test(course.id)?new Audio('audio/grade7/explanation-body-'+course.id+'.mp3'):null,titleAudio=/^lesson-0[1-8]$/.test(course.id)?new Audio('audio/grade7/title-'+course.id+'.mp3'):null;
 var maxLen=Number(p.maxLen)>0?Number(p.maxLen):500;
 var key='yunting-story-draft:'+course.id+':'+((g.YTClassroomDemo&&g.YTClassroomDemo.read().sessionId)||'preview')+':'+(d.bookTitle||'');
 try{draft=sessionStorage.getItem(key)||''}catch(e){}
 function button(text,attr,cls){return '<button type="button" class="r99-button '+(cls||'')+'" '+attr+'>'+text+'</button>'}
 var bookIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5.5C9 3.5 5.8 3.5 3 4.5v14c2.8-1 6-1 9 1 3-2 6.2-2 9-1v-14c-2.8-1-6-1-9 1Z"/><path d="M12 5.5v14M6 8h3M6 11h3M15 8h3M15 11h3"/></svg>';
 var bulbIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 16c0-2-3-3.1-3-6.5a6.5 6.5 0 0 1 13 0c0 3.4-3 4.5-3 6.5M8.5 17h7M9 20h6M10.5 22h3M9.5 9.5 12 12l2.5-2.5M12 12v4"/></svg>';
 // Build once: appending narration must never recreate a student's input or caret.
 root.innerHTML='<div class="r99-story-shell"><div class="r99-reading-tools">'+button('回看故事','data-review hidden','quiet')+button('朗读故事','data-narrate','quiet')+'<span class="r99-audio-status" data-audio-status role="status" aria-live="polite"></span></div><div class="r102-letter-surface"><div class="r99-story-content" data-scroll tabindex="0" aria-label="故事与心理学知识"><div class="r101-paper"><article class="r99-reader"><div class="r104-story-label">'+bookIcon+'<span>故事里的这一刻</span></div><span class="r104-quote" aria-hidden="true">“</span><h2>'+esc(d.bookTitle||course.title)+'</h2><div class="r99-prose" aria-live="polite" aria-relevant="additions"></div></article><div class="r101-story-continue" style="text-align:center"><p class="r102-story-finished" data-finished hidden>故事读完了。想一想：为什么会这样？</p>'+button('继续阅读','data-advance hidden','quiet')+button('为什么会这样？','data-next hidden')+'</div></div></div><footer class="r99-story-footer" hidden><section class="r101-composer r99-expression" data-expanded="false"><div class="r101-composer-head"><label class="r101-composer-question" for="r101-answer-'+esc(course.id)+'">'+esc(p.text||'你想对故事里的同学说些什么？')+'</label></div><div class="r101-compose-row"><textarea id="r101-answer-'+esc(course.id)+'" data-input rows="1" maxlength="'+maxLen+'" placeholder="写下你对故事的想法……">'+esc(draft)+'</textarea><div class="r101-compose-actions">'+button('展开输入','data-expand aria-expanded="false"','quiet')+button('写好了，继续','data-submit')+'</div></div><div class="r99-answer-meta"><span data-validation role="status"></span><span data-count></span></div></section></footer></div></div>';
 var scroller=root.querySelector('[data-scroll]'),paper=root.querySelector('.r101-paper'),prose=root.querySelector('.r99-prose'),input=root.querySelector('[data-input]'),next=root.querySelector('[data-next]'),advance=root.querySelector('[data-advance]'),narrate=root.querySelector('[data-narrate]'),footer=root.querySelector('.r99-story-footer'),composer=root.querySelector('.r101-composer'),expand=root.querySelector('[data-expand]'),explanation=null;
 function allowed(){return active&&!paused&&!hidden&&!submitted}
 function status(text){root.querySelector('[data-audio-status]').textContent=text}
 function sync(){narrate.textContent=playing?'暂停朗读':(restart?'继续朗读':(mode==='learn'?'重新朗读知识':'重新朗读故事'));narrate.setAttribute('aria-pressed',String(playing));advance.hidden=mode!=='read'||storyComplete||playing||!active||paused;advance.textContent=revealed>=groups.length?'故事读完了，继续':'继续阅读';input.disabled=paused;root.querySelector('[data-submit]').disabled=paused;expand.disabled=paused;next.disabled=paused}
 function removeMediaHandlers(t){if(t&&t.cleanup){t.cleanup();t.cleanup=null}}
 function stop(remember){
  epoch++;
  if(task){if(remember)restart={kind:task.kind,index:task.index,a:task.a,start:task.a?task.a.currentTime:task.start,end:task.end,text:task.text};removeMediaHandlers(task)}
  [audio,knowledgeAudio,titleAudio].filter(Boolean).forEach(function(a){a.pause()});
  if(g.speechSynthesis)g.speechSynthesis.cancel();task=null;playing=false;if(!remember)restart=null;sync();
 }
 function fail(id){if(id!==epoch||!task||task.id!==id)return;stop(true);status('声音暂时无法播放。可点“继续朗读”重试，或点“继续阅读”手动往下读。')}
 function complete(id){
  if(id!==epoch||!task||task.id!==id||!allowed()||!playing)return;
  var finished=task;stop(false);status('');
  if(finished.kind==='title')appendNext();
  else if(finished.kind==='group'){if(finished.index<groups.length-1)appendNext();else finishStory()}
  else status('知识朗读完成，可以写下你的看法。');
 }
 function play(t){
  stop(false);if(!allowed()){restart=t;sync();return}
  var id=epoch;t.id=id;task=t;playing=true;status('');sync();
  if(!t.a){
   if(!g.speechSynthesis||!g.SpeechSynthesisUtterance){fail(id);return}
   var u=new g.SpeechSynthesisUtterance(t.text);u.lang='zh-CN';u.rate=.95;
   u.onend=function(){complete(id)};u.onerror=function(){fail(id)};
   try{g.speechSynthesis.speak(u)}catch(e){fail(id)}return;
  }
  var a=t.a;
  function ended(){if(task===t&&(a.ended||t.end==null||a.currentTime>=t.end))complete(id)}
  function time(){if(task===t&&playing&&t.end!=null&&a.currentTime>=t.end)complete(id)}
  function error(){fail(id)}
  a.addEventListener('timeupdate',time);a.addEventListener('ended',ended);a.addEventListener('error',error);
  t.cleanup=function(){a.removeEventListener('timeupdate',time);a.removeEventListener('ended',ended);a.removeEventListener('error',error);a.removeEventListener('loadedmetadata',seek)};
  function seek(){if(task!==t)return;try{a.currentTime=t.start==null?0:t.start}catch(e){fail(id)}}
  if(a.readyState===0)a.addEventListener('loadedmetadata',seek,{once:true});
  try{a.currentTime=t.start==null?0:t.start;var promise=a.play();if(promise&&promise.catch)promise.catch(function(){fail(id)})}catch(e){fail(id)}
 }
 function readTitle(){play({kind:'title',a:titleAudio,start:0,end:null,text:d.bookTitle||course.title})}
 function readGroup(index){var b=groups[index],hasCues=audio&&Number.isFinite(b.start)&&Number.isFinite(b.end)&&b.end>b.start;play({kind:'group',index:index,a:hasCues?audio:null,start:hasCues?b.start:0,end:hasCues?b.end:null,text:b.text})}
 function narrateKnowledge(){play({kind:'knowledge',a:knowledgeAudio,start:0,end:null,text:(k.paragraphs||[]).filter(Boolean).join('。')})}
 function follow(node){if(!autoFollow)return;var box=node.getBoundingClientRect(),view=scroller.getBoundingClientRect();if(box.bottom>view.bottom-30)scroller.scrollTop+=box.bottom-view.bottom+40}
 function appendNext(){
  if(!allowed()||mode!=='read')return;
  if(revealed>=groups.length){finishStory();return}
  var previous=prose.querySelector('.is-current');if(previous)previous.className='is-read';
  var para=document.createElement('p');para.className='is-current';para.textContent=groups[revealed].text;para.dataset.group=String(revealed);prose.appendChild(para);var index=revealed++;follow(para);readGroup(index);
 }
 function finishStory(){storyComplete=true;advance.hidden=true;next.hidden=false;root.querySelector('[data-finished]').hidden=false;status('');sync();follow(next)}
 function jump(node,headroom){scroller.scrollTop+=node.getBoundingClientRect().top-scroller.getBoundingClientRect().top-(headroom||24)}
 function showKnowledge(){
  if(!allowed()||!storyComplete)return;stop(false);mode='learn';root.dataset.view='learn';autoFollow=false;next.hidden=true;advance.hidden=true;root.querySelector('[data-finished]').hidden=true;
  if(!explanation){explanation=document.createElement('section');explanation.className='r99-explanation';explanation.innerHTML='<div class="r104-transition"><span class="r104-transition-line"></span><span class="r104-transition-title">'+bulbIcon+'<span>为什么会这样</span></span><span class="r104-transition-line"></span></div><div class="r104-knowledge-panel"><div class="r99-lesson-reading"><div class="r99-explanation-head"><span class="r104-knowledge-icon">'+bulbIcon+'</span><div><span class="r99-eyebrow">知识解读</span><h2 tabindex="-1">'+esc(k.title||'说说你的看法')+'</h2></div><figure class="r110-scholar" aria-hidden="true"><img src="assets/cloud-scholar-r110.png" alt="" width="1228" height="1220"></figure></div>'+(k.concept?'<div class="r99-concept"><span>心理学知识</span><strong>'+esc(k.concept)+'</strong></div>':'')+'<div class="r99-knowledge-text">'+(k.paragraphs||[]).map(function(t){return '<p>'+esc(t)+'</p>'}).join('')+'</div>'+(k.core?'<p class="r99-core">'+esc(k.core)+'</p>':'')+'</div></div>';paper.appendChild(explanation)}
  footer.hidden=false;root.querySelector('[data-review]').hidden=false;autosize();measureComposer();jump(explanation.querySelector('.r104-knowledge-panel'),parseFloat(g.getComputedStyle(root).getPropertyValue('--r111-knowledge-headroom'))||24);narrateKnowledge();
 }
 function autosize(){var style=g.getComputedStyle(input),line=parseFloat(style.lineHeight)||24,padding=(parseFloat(style.paddingTop)||0)+(parseFloat(style.paddingBottom)||0)+2,min=line+padding,cap=Math.max(min,Math.min(260,(g.innerHeight||800)*.28));input.style.height=(expanded?cap:min)+'px';input.style.overflowY=expanded?'auto':'hidden'}
 function measureComposer(){if(mode==='learn')root.style.setProperty('--r103-compose-height',footer.getBoundingClientRect().height+'px')}
 if(g.ResizeObserver){new g.ResizeObserver(measureComposer).observe(footer)}
 g.addEventListener('resize',measureComposer);
 function updateDraft(){draft=input.value;root.querySelector('[data-validation]').textContent='';input.removeAttribute('aria-invalid');root.querySelector('[data-count]').textContent=draft.length+' / '+maxLen;try{sessionStorage.setItem(key,draft)}catch(e){}autosize()}
 input.oninput=updateDraft;root.querySelector('[data-count]').textContent=draft.length+' / '+maxLen;
 expand.onclick=function(){if(paused)return;var focused=document.activeElement,selStart=input.selectionStart,selEnd=input.selectionEnd,direction=input.selectionDirection;expanded=!expanded;composer.dataset.expanded=String(expanded);expand.setAttribute('aria-expanded',String(expanded));expand.textContent=expanded?'收起输入':'展开输入';autosize();input.setSelectionRange(selStart,selEnd,direction);if(focused===input)input.focus({preventScroll:true})};
 root.querySelector('[data-submit]').onclick=function(){if(!allowed())return;draft=input.value;if(!draft.trim()){root.querySelector('[data-validation]').textContent='写下你的看法再继续。';input.setAttribute('aria-invalid','true');input.focus();return}stop(false);submitted=true;g.YTStore.record({stage:'story',nodeId:p.id,prompt:p.text,raw:draft});onDone()};
 next.onclick=showKnowledge;
 function advanceStory(){if(!allowed()||mode!=='read'||storyComplete)return;stop(false);if(revealed>=groups.length)finishStory();else appendNext()}
 advance.onclick=advanceStory;
 // Keep the existing paragraph DOM/animation; only a deliberate canvas gesture skips audio.
 scroller.setAttribute('data-story-advance','');scroller.setAttribute('aria-keyshortcuts','Enter Space');
 scroller.setAttribute('aria-label','故事与心理学知识；故事阅读时，点击空白或段落，或在此按回车、空格继续阅读');
 var readingGesture=null;
 function interactive(target){return target&&target.closest&&target.closest('button,a,input,textarea,select,label,[role="button"],[role="link"],[contenteditable]:not([contenteditable="false"])')}
 function hasSelection(){var selection=g.getSelection&&g.getSelection();return selection&&!selection.isCollapsed&&String(selection).length>0}
 scroller.addEventListener('pointerdown',function(e){readingGesture=null;if(e.isPrimary===false||e.button!==0||interactive(e.target))return;readingGesture={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false}});
 scroller.addEventListener('pointermove',function(e){if(readingGesture&&readingGesture.id===e.pointerId&&(Math.abs(e.clientX-readingGesture.x)>8||Math.abs(e.clientY-readingGesture.y)>8))readingGesture.moved=true},{passive:true});
 scroller.addEventListener('pointercancel',function(){if(readingGesture)readingGesture.moved=true},{passive:true});
 scroller.addEventListener('scroll',function(){if(readingGesture)readingGesture.moved=true},{passive:true});
 scroller.addEventListener('click',function(e){var gesture=readingGesture;readingGesture=null;if(e.defaultPrevented||(e.button!=null&&e.button!==0)||interactive(e.target)||hasSelection()||(gesture&&gesture.moved))return;advanceStory()});
 scroller.addEventListener('keydown',function(e){if(e.target!==scroller||e.defaultPrevented||e.repeat||e.isComposing||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||hasSelection()||!allowed()||mode!=='read'||storyComplete)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();advanceStory()}});
 narrate.onclick=function(){if(!allowed())return;if(playing){stop(true);status('朗读已暂停。');return}if(restart){var saved=restart;play(saved)}else if(mode==='learn')narrateKnowledge();else if(revealed)readGroup(revealed-1);else readTitle()};
 root.querySelector('[data-review]').onclick=function(){if(!allowed())return;autoFollow=false;jump(root.querySelector('.r99-reader'))};
 scroller.addEventListener('wheel',function(e){if(e.deltaY<0)autoFollow=false},{passive:true});
 var touchY=null;scroller.addEventListener('touchstart',function(e){touchY=e.touches.length?e.touches[0].clientY:null},{passive:true});scroller.addEventListener('touchmove',function(e){if(touchY!=null&&e.touches.length){var y=e.touches[0].clientY;if(y>touchY)autoFollow=false;touchY=y}},{passive:true});
 scroller.addEventListener('keydown',function(e){if(['ArrowUp','PageUp','Home'].indexOf(e.key)!==-1)autoFollow=false});
 var lastTop=0;scroller.addEventListener('scroll',function(){if(scroller.scrollTop<lastTop-2)autoFollow=false;lastTop=scroller.scrollTop},{passive:true});
 function resumeIfAllowed(){if(allowed()&&restart){var saved=restart;play(saved)}else if(allowed()&&!started){started=true;readTitle()}}
 document.addEventListener('visibilitychange',function(){hidden=!!document.hidden;if(hidden){if(playing)stop(true)}else resumeIfAllowed()});
 // No repeating timers or polling: a paused class cannot advance in the background.
 [audio,knowledgeAudio,titleAudio].filter(Boolean).forEach(function(a){a.preload='metadata'});sync();
 return {root:root,activate:function(){active=true;resumeIfAllowed();sync()},deactivate:function(){active=false;stop(true)},setPaused:function(value){value=!!value;if(value===paused)return;paused=value;if(value){if(playing)stop(true)}else resumeIfAllowed();sync()}};
}};
})(window);
