/* 心语之书：原创固定寄语，关键词选择，不使用 AI，不保存输入。 */
(function(){
'use strict';
var view=new URLSearchParams(location.search).get('view');
if(['book','wall','teacher'].indexOf(view)<0)return;
document.body.classList.add('heart-screen');
var app=document.getElementById('app'),label=document.getElementById('page-label');
function title(t){document.title='云听｜'+t;if(label)label.textContent=t;app.className='space-workspace heart-workspace';}
var groups=[
 {re:/考试|成绩|作业|学习|答错|回答错|分数/,lines:['一次没有做好，不代表你不够好。','先把下一步变小一点，不必一次解决所有事情。','你值得被认真对待，不只是因为一张成绩单。']},
 {re:/朋友|同学|孤单|孤独|相处|比较/,lines:['想被理解是很自然的需要，你可以慢慢说。','别人的反应不能决定你的全部价值。','不必为了融入，勉强自己接受不舒服的相处。']},
 {re:/紧张|担心|害怕|焦虑|压力/,lines:['先让呼吸慢一点，眼前只需要走好一小步。','你不必立刻想出答案，可以先让自己缓一缓。','觉得难的时候，可以邀请可信任的人一起想办法。']},
 {re:/生气|委屈|难过|伤心|哭|烦/,lines:['你可以有这样的感受，不必急着把它藏起来。','先照顾此刻的自己，等缓一缓再决定下一步。','把心里的话说给可信任的人听，也是一种力量。']}
];
var general=['有些事情可以慢慢想，不必现在就得出结论。','你可以从一件自己能够做到的小事开始。','今天愿意停下来听听自己，已经是一个开始。','需要陪伴的时候，可以主动靠近可信任的人。'];
// 此检测仅作演示提醒，并非完整风险识别或危机干预系统。
var safety=/欺负|霸凌|欺凌|威胁|勒索|打我|被打|自杀|自残|不想活|想死|伤害自己|杀人|伤害别人|性侵|猥亵|摸我|危险|流血|割腕/;
function pick(text){var pool=general;for(var i=0;i<groups.length;i++){if(groups[i].re.test(text)){pool=groups[i].lines;break;}}return pool[Math.floor(Math.random()*pool.length)];}
function book(){
 title('心语之书');
 app.innerHTML='<header class="heart-heading"><span class="heart-kicker">留一点时间，听听自己</span><h1>心语之书</h1><p>写下此刻的心事，翻开一句温暖的回应。</p></header><div class="heart-layout"><section class="heart-compose"><label for="heart-input">此刻，你想说些什么？</label><textarea id="heart-input" maxlength="300" rows="5" placeholder="可以是一件小事，也可以是一种说不清的感受……" aria-describedby="heart-privacy"></textarea><div class="heart-count"><span>不必写得完整，短短一句也可以</span><span id="heart-count">0 / 300</span></div><button class="heart-primary" id="heart-open" disabled>翻开心语之书</button><p class="heart-note" id="heart-privacy">输入不保存、不公开，也不会自动交给老师。回应来自预设寄语，按关键词选择，并非 AI 解答或事情的结论。</p><a class="heart-teacher-link" href="student-space.html?view=teacher">有些话，想留言给老师 →</a></section><section class="heart-stage" aria-label="心语之书书页"><div class="heart-book" id="heart-book"><div class="heart-cover"><span>云听 · 心理成长</span><div class="cover-symbol" aria-hidden="true">✧</div><h2>心语之书</h2><p>让心事有个停靠的地方</p><span class="cover-bottom">写一句话 · 翻开一页</span></div></div><div id="heart-result" role="status" aria-live="polite"></div></section></div>';
 var input=document.getElementById('heart-input'),button=document.getElementById('heart-open'),bookEl=document.getElementById('heart-book'),result=document.getElementById('heart-result');
 input.oninput=function(){button.disabled=!input.value.trim();document.getElementById('heart-count').textContent=input.value.length+' / 300';};
 button.onclick=function(){var text=input.value.trim();if(!text)return;openReading(text,button);};
}
function openReading(text,trigger){
 var needsHelp=safety.test(text),answer=needsHelp?'你不必独自承受。请把发生的事告诉身边可信任的老师或大人。':pick(text),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 var layer=document.createElement('section');layer.className='reading-room center-reading';layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-labelledby','reading-title');
 layer.innerHTML='<header class="reading-top"><div><span>云听 · 心语之书</span><h2 id="reading-title">让心事在这里，慢慢展开</h2></div><div class="reading-tools"><button type="button" class="reading-full">全屏</button><button type="button" class="reading-close" aria-label="关闭阅读">× <span>关闭</span></button></div></header><div class="reading-scene"><div class="unfold-book" aria-label="沿中间书脊向左右展开的双页书"><div class="unfold-half unfold-left"><div class="unfold-content"><span class="unfold-label">心语之书</span><div class="unfold-emblem" aria-hidden="true">✧</div><p class="unfold-intro">给心事一点空间<br>也给自己一点时间</p><small class="unfold-sign">云听 · 温柔陪伴</small></div></div><div class="unfold-half unfold-right"><div class="unfold-content"><span class="unfold-label">'+(needsHelp?'先照顾你的安全':'此刻的一句心语')+'</span><div class="unfold-answer" aria-hidden="true"><blockquote id="heart-quote"></blockquote><i></i><p>'+(needsHelp?'如果正处于危险中，请立刻找身边的老师或可信任的大人，不要等待留言回复。':'一点陪伴与启发，不替你做决定。')+'</p></div><small class="unfold-sign">云听 · 心语之书</small></div></div><div class="unfold-spine" aria-hidden="true"></div></div></div><footer class="reading-bottom"><p class="reading-status" role="status">正在展开，留一点时间给自己…</p><div class="reading-actions"><button type="button" class="reading-again">合上书，写下另一句</button>'+(needsHelp?'<a href="student-space.html?view=teacher">留言给老师（非即时求助） →</a>':'')+'</div></footer>';
 layer.querySelector('#heart-quote').textContent=answer;document.body.appendChild(layer);document.body.classList.add('reading-active');var priorInert=app.inert;app.inert=true;
 var closing=false,timer=null,raf1=null,raf2=null,closeButton=layer.querySelector('.reading-close'),fullButton=layer.querySelector('.reading-full');
 function ready(){if(closing||layer.classList.contains('is-revealed'))return;layer.classList.add('is-revealed');layer.querySelector('.unfold-answer').setAttribute('aria-hidden','false');layer.querySelector('.reading-status').textContent='停留一会儿，读读这句话。';}
 function close(){if(closing)return;closing=true;clearTimeout(timer);cancelAnimationFrame(raf1);cancelAnimationFrame(raf2);document.removeEventListener('keydown',key);document.removeEventListener('fullscreenchange',fullscreenChange);if(document.fullscreenElement===layer&&document.exitFullscreen)document.exitFullscreen().catch(function(){});layer.remove();app.inert=priorInert;document.body.classList.remove('reading-active');trigger.disabled=false;trigger.textContent='再次翻开心语之书';document.getElementById('heart-result').textContent='刚才的心语：'+answer;trigger.focus();}
 function key(e){if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key==='Tab'){var nodes=Array.from(layer.querySelectorAll('button,a[href]')).filter(function(n){return!n.hidden;}),first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
 function fullscreenChange(){fullButton.textContent=document.fullscreenElement===layer?'退出全屏':'全屏';}
 fullButton.hidden=!layer.requestFullscreen;fullButton.onclick=function(){if(document.fullscreenElement===layer){document.exitFullscreen().catch(function(){});}else{layer.requestFullscreen().catch(function(){fullButton.textContent='当前浏览器不支持';fullButton.disabled=true;});}};
 document.addEventListener('keydown',key);document.addEventListener('fullscreenchange',fullscreenChange);closeButton.onclick=close;closeButton.focus();layer.querySelector('.reading-again').onclick=function(){close();book();document.getElementById('heart-input').focus();};
 layer.querySelector('.unfold-right').addEventListener('transitionend',function(e){if(e.propertyName==='transform')ready();});
 raf1=requestAnimationFrame(function(){raf2=requestAnimationFrame(function(){if(closing)return;layer.classList.add('is-opening');if(reduced)ready();else timer=setTimeout(ready,1450);});});
}

function teacher(){
 title('留言给老师');
 app.innerHTML='<header class="heart-heading"><span class="heart-kicker">有些心事，可以一起想办法</span><h1>留言给老师</h1><p>想说的话，可以在这里慢慢写。</p></header><section class="teacher-letter"><div class="letter-banner"><b>目前是本机体验，不会通知另一台设备上的老师</b><p>如果现在就需要帮助，请直接找心理教室的老师或身边可信任的大人，不要等待留言。</p></div><form id="teacher-letter-form"><label for="teacher-message">你希望老师知道什么？</label><textarea id="teacher-message" maxlength="1000" rows="6" placeholder="最近发生了什么？你希望老师怎样帮助你？" required></textarea><label class="letter-consent"><input type="checkbox" id="teacher-consent" required><span>我同意将这段留言交给老师查看，不在学生之间公开。</span></label><p class="heart-note">当前仅保存于此浏览器，老师端“私密关注”可查看演示记录。尚未接入跨设备送达与通知，请勿在共用设备填写真实敏感信息。</p><button class="heart-primary" type="submit">保存演示留言</button><p id="teacher-message-status" role="status" aria-live="polite"></p></form><a class="heart-teacher-link" href="student-space.html?view=book">先翻开心语之书 →</a></section>';
 document.getElementById('teacher-letter-form').onsubmit=function(e){e.preventDefault();var ta=document.getElementById('teacher-message'),text=ta.value.trim(),status=document.getElementById('teacher-message-status');if(!text){ta.focus();return;}if(!document.getElementById('teacher-consent').checked)return;
 if(!window.YTSupportFlow){status.textContent='留言流程暂时不可用，请直接联系老师。';return;}
 var student={};try{var id=localStorage.getItem('yunting-current-student-v1');var rows=JSON.parse(localStorage.getItem('yunting-class-students-v1')||'[]');student=rows.find(function(r){return r.id===id;})||{};}catch(ignore){}
 try{var row=YTSupportFlow.create({text:text,studentId:student.id,studentName:student.name,source:'学生端 · 留言给老师',courseTitle:'自主使用 · 非课堂留言',classId:student.classId,sessionId:'',courseId:''});if(!row)throw Error('empty');status.textContent='演示留言已保存在本机，未通知老师。请勿等待此页面处理紧急情况。';ta.value='';document.getElementById('teacher-consent').checked=false;}catch(err){status.textContent='保存失败，请直接联系老师；你的内容仍保留在输入框中。';}
 };
}
if(view==='teacher')teacher();else book();
}());
