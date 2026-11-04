(function(g){'use strict';
if(!g.YTLessonScreenAuthorized)return;
var q=new URLSearchParams(location.search),teacher=q.get('preview')==='teacher',auth=g.YTAuthDemo.read(),deck=g.YTFirstLessonDeck,slides=deck.slides,byId={},stageNames={enter:'走进新环境',story:'故事与适应',talk:'三个适应方法',energy:'音频体验',playground:'成长训练',closing:'小目标与总结'};
slides.forEach(function(s,i){byId[s.id]=i;});
var host=document.getElementById('slide-host'),root=document.getElementById('lesson-screen'),prev=document.getElementById('slide-prev'),next=document.getElementById('slide-next'),bridge=g.YTClassroomDemo,state=bridge?bridge.read():{},active=false,unified=false,current=-1,lastSignal='',session=q.get('session')||((state.active&&state.courseId==='lesson-01')?state.sessionId:'')||'standalone',owner=teacher?'teacher-preview:'+String(auth.account||auth.name||'teacher'):String(auth.studentId||readText('yunting-current-student-v1')||auth.account||auth.name||'student'),prefix='yunting-lesson1-screen:'+encodeURIComponent(session)+':'+encodeURIComponent(owner),progressKey=prefix+':slide',goalKey=prefix+':goal',localId=readText(progressKey),goal=readObject(goalKey),messageId=null;
function readText(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
function readObject(k){try{return JSON.parse(readText(k)||'{}')||{};}catch(e){return {};}}
function save(k,v){try{localStorage.setItem(k,v);return true;}catch(e){return false;}}
function valid(id){return typeof id==='string'&&Object.prototype.hasOwnProperty.call(byId,id);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function list(items,cls){return '<ul class="'+(cls||'lesson-list')+'">'+(items||[]).map(function(x,i){return '<li><span class="item-number">'+String(i+1).padStart(2,'0')+'</span><span>'+esc(x)+'</span></li>';}).join('')+'</ul>';}
function first(stage){return slides.find(function(s){return s.stage===stage;})||slides[0];}
function relevant(s){return !!(s&&s.active&&s.courseId==='lesson-01'&&String(s.sessionId||'')===session);}
function selection(){
 if(messageId&&valid(messageId))return messageId;
 if(active&&(teacher||unified)){
  var stage=teacher&&!unified?(state.teacherPreviewStage||state.stage):state.stage,id=teacher&&!unified?state.teacherSlideId:state.sharedSlideId;
  return valid(id)&&(!stage||slides[byId[id]].stage===stage)?id:first(stage).id;
 }
 return valid(localId)?localId:slides[0].id;
}
function update(s){state=s||{};active=relevant(state);unified=active&&state.progressMode!=='student';
 var sig=JSON.stringify([active,unified,state.stage,state.teacherPreviewStage,state.teacherSlideId,state.sharedSlideId,state.paused,state.status]);
 if(sig!==lastSignal){lastSignal=sig;messageId=null;render(selection());}
}
function original(stage){var u=new URL('course.html',location.href);u.searchParams.set('id','lesson-01');u.searchParams.set('mode','classroom');if(teacher)u.searchParams.set('preview','teacher');u.searchParams.set('session',session);u.searchParams.set('original','1');u.searchParams.set('temporaryStage',stage);return u.pathname.split('/').pop()+u.search;}
function goalForm(){return '<form class="goal-form" autocomplete="off"><label>这学期，我想做到的一件小事<textarea name="goal" rows="2" maxlength="240" placeholder="例如：尝试在开始作业前列出当天任务"></textarea></label><div class="goal-pair"><label>我准备在什么时候<input name="when" maxlength="120" placeholder="例如：今天放学后"></label><label>先做哪一步<input name="first" maxlength="180" placeholder="例如：拿出作业本，看清要求"></label></div><div class="goal-pair"><label>我想试的方法<select name="method"><option value="">可以暂时不选</option><option>五分钟启动法</option><option>拆分任务</option><option>温和自我对话</option><option>其他方法</option></select></label><label>如果不顺利，我可以<input name="backup" maxlength="180" placeholder="调整办法，或向谁求助"></label></div><p class="save-status" role="status">'+(teacher?'教师独立体验：不会读取或写入学生的小目标。':'仅保存在当前浏览器，不会自动提交老师或公开给全班。')+'</p></form>';}
function render(id){if(!valid(id))return;var gate=document.getElementById('lesson1-session-gate');if(!gate){gate=document.createElement('div');gate.id='lesson1-session-gate';gate.setAttribute('role','status');gate.style.cssText='position:fixed;z-index:75;inset:0;display:grid;place-items:center;background:#f8fbf7ed;color:#315945;text-align:center;font:20px/1.8 system-ui';document.body.appendChild(gate)}gate.hidden=!stateIsBlocked();gate.style.display=gate.hidden?'none':'grid';gate.textContent=state.status==='waiting'?'课堂即将开始，请等老师准备好。':'课堂暂停，先休息一下，等待老师继续。';host.inert=stateIsBlocked();var ended=state.courseId==='lesson-01'&&String(state.sessionId||'')===session&&(!state.active||state.status==='ended'||state.status==='cancelled');if(ended){document.getElementById('screen-mode').textContent='课堂已结束';root.hidden=false;document.body.style.visibility='visible';host.innerHTML='<article class="slide"><h1>这节课堂已结束</h1><p>需要的内容已保存在当前浏览器，你可以返回个人空间。</p><a href="'+(teacher?'teacher.html?view=records':'student.html')+'">返回'+(teacher?'课堂记录':'个人空间')+'</a></article>';prev.disabled=true;next.disabled=true;current=-1;return}var i=byId[id],s=slides[i],changed=current!==i;current=i;
 root.hidden=false;document.body.style.visibility='visible';
 document.getElementById('screen-mode').textContent=!active?'独立预览 · 未连接有效课堂':(state.paused?'课堂已暂停':state.status==='waiting'?'等待课堂开始':teacher?(unified?'教师预览 · 统一控制':'教师独立预览'):(unified?'跟随老师 · 统一控制':'自主探索'));
 var canFlip=!teacher&&!unified&&!stateIsBlocked();prev.disabled=!canFlip||i===0;next.disabled=!canFlip||i===slides.length-1;prev.hidden=teacher;next.hidden=teacher;
 document.getElementById('slide-count').textContent=String(i+1).padStart(2,'0')+' / '+slides.length;
 document.getElementById('stage-label').textContent=stageNames[s.stage];document.getElementById('navigation-note').textContent=teacher?'由教师主页面翻页':unified?'本页随老师切换':stateIsBlocked()?'课堂暂停时暂不翻页':'按自己的节奏探索';
 if(!changed)return;
 var body='';if(s.type==='story')body='<div class="story-text">'+s.paragraphs.map(function(p){return '<p>'+esc(p)+'</p>';}).join('')+'</div><blockquote>“'+esc(s.quote)+'”</blockquote>';
 else if(s.type==='changes')body='<div class="comparison">'+s.columns.map(function(c){return '<section><h2>'+esc(c.title)+'</h2>'+list(c.items)+'</section>';}).join('')+'</div>';
 else if(s.type==='methods')body='<div class="method-cards">'+s.cards.map(function(c){return '<section><span class="method-number">'+c.number+'</span><h2>'+esc(c.title)+'</h2><p>'+esc(c.text)+'</p></section>';}).join('')+'</div>';
 else if(s.type==='reframe')body='<div class="reframe"><section><span>从全盘否定</span><p>“'+esc(s.before)+'”</p></section><section><span>到具体而友善</span><p>“'+esc(s.after)+'”</p></section></div>';
 else if(s.type==='goal')body=goalForm();else if(s.items)body=list(s.items);
 var cloud=['cover','summary','experience'].indexOf(s.type)>=0?'<img class="cloud-ip" src="assets/cloud-welcome-r110.png" alt="云听云朵伙伴" width="190" height="190">':'';
 host.innerHTML='<article class="slide slide-'+esc(s.type)+'" data-slide-id="'+s.id+'" data-stage="'+s.stage+'"><div class="slide-heading"><p class="kicker">'+esc(s.kicker)+'</p><h1>'+esc(s.title).replace(/\n/g,'<br>')+'</h1>'+(s.lead?'<p class="lead">'+esc(s.lead)+'</p>':'')+'</div>'+cloud+'<div class="slide-content">'+body+'</div>'+(s.question?'<div class="question"><span>想一想</span><p>'+esc(s.question)+'</p></div>':'')+(s.action?'<div class="action-row"><a class="primary-action" href="'+esc(original(s.action.stage))+'">'+esc(s.action.label)+' <span aria-hidden="true">↗</span></a>'+(['talk'].indexOf(s.action.stage)>=0?'<small>现有对话为演示回应，不代表真实 AI 理解。纸笔也可以。</small>':s.action.stage==='closing'?'<small>自愿留言与小目标分开；进入原有留言流程，由你决定是否发送。</small>':'<small>进入原有完整体验；本页不模拟播放或训练结果。</small>')+'</div>':'')+'<p class="slide-note">'+esc(s.note||'')+'</p></article>';
 var form=host.querySelector('form');if(form){Array.from(form.elements).forEach(function(el){if(el.name&&typeof goal[el.name]==='string')el.value=goal[el.name];});form.addEventListener('submit',function(e){e.preventDefault();});form.addEventListener('input',function(e){if(!e.target.name)return;goal[e.target.name]=e.target.value;var ok=save(goalKey,JSON.stringify(goal));form.querySelector('.save-status').textContent=ok?(teacher?'教师体验已单独保存在本机，不涉及学生记录。':'已保存在当前浏览器；未提交老师、未公开。可随时修改或留空。'):'当前浏览器无法保存，请用纸笔保留需要的内容。';});}
 var a=host.querySelector('.primary-action');if(a)a.addEventListener('click',function(e){if(stateIsBlocked()){e.preventDefault();document.getElementById('screen-mode').textContent='课堂暂未开始或已暂停，请等待老师。';}});
 host.scrollTop=0;
}
function stateIsBlocked(){return active&&(!!state.paused||state.status==='waiting');}
function move(delta){if(teacher||unified||stateIsBlocked())return;var i=current+delta;if(i<0||i>=slides.length)return;messageId=null;localId=slides[i].id;save(progressKey,localId);render(localId);}
prev.onclick=function(){move(-1);};next.onclick=function(){move(1);};
g.addEventListener('message',function(e){var d=e.data;if(e.origin!==location.origin||e.source!==g.parent||!d||d.type!=='yt-lesson1-slide'||!valid(d.slideId))return;if(d.session&&String(d.session)!==session)return;if(d.sessionId&&String(d.sessionId)!==session)return;if(!teacher&&!unified)return;messageId=d.slideId;render(messageId);});
g.addEventListener('keydown',function(e){if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='ArrowRight'){move(1);}if(e.key==='ArrowLeft'){move(-1);}});
update(state);if(bridge)bridge.subscribe(update);
/* Read-only public interface: the parent owns all classroom writes. */
g.YTFirstLessonScreen={getSlide:function(){return slides[current];},getSession:function(){return session;}};
})(window);
