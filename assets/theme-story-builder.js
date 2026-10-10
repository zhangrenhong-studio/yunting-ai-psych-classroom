/* Theme preparation preview: browser-local drafts, authored templates, no AI generation. */
(function(g){'use strict';
const KEY='yunting-theme-stories-v1',WORK='yunting-theme-story-working-v1';
const seeds={
emotion:['课间，小宁听到同伴的一句玩笑，心里忽然有些不舒服。大家继续聊着，他却不知道该怎样接话。','小宁说不清自己是生气、委屈，还是担心被误解。他想马上解释，又怕声音太大，让气氛更尴尬。','上课铃响了，小宁把想说的话先写在纸上。他还没有决定什么时候开口，也不知道怎样让别人理解自己的感受。'],
attention:['小林正在听课，窗外的声音吸引了他的注意。等他回过神，已经不知道老师讲到哪里了。','被提醒后，小林低下头，心里想：“我是不是总做不好？”他越着急，越难跟上接下来的内容。','下一次，小林又发现自己走神了。他看到桌上的笔记，想先找到老师正在讲的那一行，又担心自己已经落后太多。'],
learning:['放学后，小安把作业放在桌上。任务看起来很多，他想等自己准备好再开始。','时间慢慢过去，小安换了几次笔，又翻了翻书，却一直没有写下第一行。他有些着急，也有些责怪自己。','小安看着其中一道题，想先读一遍题目，不急着做完全部。但他还在犹豫：这么小的一步，会有用吗？'],
social:['课间，小雨走近两位正在聊天的同学，想加入他们的话题。她刚说了一句，一位同学就转身去拿东西。','小雨停住了，心里想：“是不是他们不想和我聊天？”但她并不知道，那位同学是不是听见了自己。','下一次见面，小雨想问清楚，也怕显得太在意。她在走近和绕开之间，犹豫了一会儿。'],
anxiety:['临近考试，小禾打开书，发现自己反复想着还没复习完的内容。窗外天色暗下来，他仍不知道先从哪里开始。','小禾有些紧张，肩膀绷着。他想让自己马上专心，又觉得越催促自己，越难读进去。','小禾把书合了一下，想喝口水，也想找信任的人说说。他还没有决定怎样安排接下来的这段时间。'],
sleep:['到了睡觉时间，小月放下手机，脑海里却还在回想白天的事。房间安静了，她的思绪没有停下来。','小月看了一眼时间，担心明天会很累。她又想拿起手机分散注意，也知道自己本来想早点休息。','小月把手机放远了一点，准备给自己留一小段安静的过渡时间。她还在想，什么样的安排会更适合自己。'],
family:['晚饭后，小晨想和家人说说今天的事，话还没讲完，就被问起作业和成绩。','小晨觉得自己的感受没有被听见，家人却以为自己正在关心他。两边的声音慢慢变大，谁也没有说清楚真正想表达的是什么。','小晨停了一会儿，想换一种开头：“我想先说完今天的事。”他不知道这次对话能否不一样。'],
stress:['新学期，小雅拿着水杯走出教室，看到几位同学在走廊聊天。他们说起一部她也看过的电影。','小雅想接一句话，却担心自己突然加入会打断别人。她手指绕着水杯，慢慢停在了旁边。','接水的时候，小雅仍想认识他们，也想给自己一点时间。下次经过时，她会先打个招呼，还是先听一听呢？']
};
const topicSeeds={
'emotion-unclear':['午休后，小宁坐回座位，觉得胸口有点闷。问起发生了什么，他一时也说不清楚。','小宁回想起上午的几件小事：一道没做出的题，一次没有接上的聊天，还有操场上的一阵笑声。他不知道哪一件最影响自己。','小宁在纸上写下“有点难受”，想先停一会儿。他还没有找到更准确的词，也不想急着给自己下结论。'],
'attention-interference':['自习课上，小林想完成一道题，周围却不时响起翻书和说话的声音。','他盯着题目，又想着刚才还没做完的事情，注意力在好几个地方来回移动。越想马上专心，越觉得混乱。','小林把手边不需要的纸收了起来，准备先看题目中的一个条件。他想试试，但还不知道这样能否帮助自己重新开始。'],
'learning-setback':['小安拿到一次测验的试卷，分数比自己期待的低。他把卷子折起来，不太想再看。','他想到昨晚的复习，觉得自己的努力好像没有用。但他还没看清，是哪些题目和环节出了问题。','小安慢慢展开卷子，想先找一道自己愿意重新看一看的题，也在犹豫是否请老师帮忙。'],
'social-boundary':['同学请小雨把自己负责的任务也一起做完。小雨这次已有安排，却很难直接拒绝。','她担心说“不”会让同学不高兴，答应后又觉得自己时间不够。她想维持关系，也想让自己的安排被尊重。','小雨准备说“我今天只能帮你看一下这部分”。她还在想，怎样把能做和不能做的事讲清楚。'],
'anxiety-low':['这几天，小禾觉得做事情比平时费力。原本喜欢的活动，他也暂时不想参加。','他看着待办的任务，觉得自己的节奏慢了，又不知道怎样向别人解释。朋友问他要不要一起走走，他没有马上回答。','小禾想先告诉朋友“我最近有点累”，也想找信任的大人聊聊。他还在寻找一个自己能承受的开头。'],
'sleep-screen':['小月原本准备睡觉，手机里却弹出一条新消息。她想着“再看一会儿”，又点开了一个视频。','当她再次看时间时，已经比计划晚了很多。她还想继续看，也担心明天早上会不舒服。','小月把手机放到桌上，想给睡前留一个没有屏幕的小间隔。她还没有想好怎样让这个安排更容易坚持。'],
'family-expectation':['家人说起对下一次考试的期待，小晨听着，心里有些紧张。他也希望进步，但不知道怎样说明自己的困难。','家人想鼓励他，小晨却听成了“我还不够好”。他想解释，又怕对话变成争论。','小晨准备先说一个具体困难，再讲自己希望得到什么帮助。他还在想，怎样让双方都能把话说完。'],
'stress-failure':['小雅为一次展示准备了很久，正式讲述时却忘了一段内容。回到座位后，她一直回想那个停顿。','她想起自己的练习，也想到同学的目光，担心别人只记得她出错的地方。她暂时不想再尝试。','朋友问她是否愿意一起回顾一次。小雅想先看看自己已经讲清楚的部分，再决定下一次要调整哪一步。']
};
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch(e){return fallback}}
function all(){return read(KEY,[])}
function current(dim){return read(WORK,{})[dim]||null}
function work(d){let x=read(WORK,{});x[d.dimensionId]=d;localStorage.setItem(WORK,JSON.stringify(x));return d}
function uid(){return 'theme-story-'+(g.crypto.randomUUID?g.crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2))}
function template(dim,topic){return {id:uid(),dimensionId:dim.id,topicId:topic.id,title:topic.title,prompt:topic.summary+' 希望围绕'+dim.name+'开展一堂主题课。',story:(topicSeeds[topic.id]||seeds[dim.id]).join('\n\n'),lead:'如果你在故事人物身边，你觉得此刻最值得理解的是什么？可以只聊故事，也可以在愿意时聊聊自己的经历。',source:'template',confirmed:false,version:0}}
function resolve(dim,q){let saved=q.get('draft')&&all().find(d=>d.id===q.get('draft')&&d.dimensionId===dim.id);let d=current(dim.id);if(saved&&(!d||d.id!==saved.id))d=work(JSON.parse(JSON.stringify(saved)));return d}
function store(d,confirm){let rows=all(),old=rows.find(x=>x.id===d.id);d=Object.assign({},d,{confirmed:!!confirm,version:(old?old.version:0)+1,updatedAt:Date.now()});if(confirm)d.confirmedAt=Date.now();rows=rows.filter(x=>x.id!==d.id);rows.unshift(JSON.parse(JSON.stringify(d)));localStorage.setItem(KEY,JSON.stringify(rows));return work(d)}
function url(dim,step,d){return 'teacher.html?view=arrangements&tab=themes&builder='+encodeURIComponent(dim)+'&step='+step+(d&&d.topicId?'&topic='+encodeURIComponent(d.topicId):'&custom=1')+(d?'&draft='+encodeURIComponent(d.id):'')}
function head(dim){return '<header class="theme-prompt-head"><a href="teacher.html?view=arrangements&tab=themes">← 返回主题课程</a><h3>'+esc(dim.name)+'</h3></header>'}
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function input(dim,q){let d=resolve(dim,q),rows=all().filter(x=>x.dimensionId===dim.id);return '<section class="theme-prompt-page" data-theme-builder-step="1"><h4>这堂课，你想和学生聊什么？</h4><div class="theme-prompt-box"><textarea id="theme-prompt" maxlength="1200" aria-label="课程需求" placeholder="描述班级最近的情况，或选择下方模板开始。请勿填写学生姓名等个人信息。">'+esc(d?d.prompt:'')+'</textarea><div class="theme-prompt-submit"><span>预设故事可编辑 · 自定义内容可手动编写</span><button id="theme-preview" class="theme-primary">预览课程 →</button></div></div><div class="theme-template-chips" aria-label="预设模板">'+dim.topics.map(t=>'<button type="button" data-story-template="'+esc(t.id)+'">'+esc(t.title)+'</button>').join('')+'</div><p id="theme-error" role="status"></p><p class="theme-local-note">当前为备课预览：故事生成 AI 尚未接入，草稿仅保存在当前浏览器。</p>'+(rows.length?'<section class="theme-saved"><h5>我的主题课程</h5>'+rows.map(x=>'<a href="'+url(dim.id,2,x)+'"><b>'+esc(x.title)+'</b><span>'+(x.confirmed?'已确认':'草稿')+' · 第 '+x.version+' 版 · 查看 / 编辑</span></a>').join('')+'</section>':'')+'</section>'}
function preview(dim,q){let d=resolve(dim,q);if(!d)return input(dim,q);return '<section class="theme-story-preview" data-theme-builder-step="2"><div class="theme-story-heading"><h4>故事预览</h4><span>'+(d.confirmed?'已确认 · 可复用':'待老师确认')+'</span></div><label>课程名称<input id="theme-title" maxlength="80" value="'+esc(d.title)+'"></label><label>故事内容<textarea id="theme-story" maxlength="6000" placeholder="在这里编写第三人称故事，先呈现情境、人物感受，再停在一个可以讨论的时刻。">'+esc(d.story)+'</textarea></label><label>故事结束后的第一句引导<textarea id="theme-lead" maxlength="600">'+esc(d.lead)+'</textarea></label><div class="theme-story-tools"><button id="theme-change-story" disabled title="故事生成 AI 尚未接入">换一个故事 · 待接入 AI</button><span>'+(d.source==='template'?'当前为预设模板，请老师课前检查内容。':'当前为老师自写草稿，不是 AI 生成结果。')+'</span></div><p id="theme-error" role="status"></p><div class="theme-story-actions"><a href="'+url(dim.id,1,d)+'">返回修改需求</a><button id="theme-save">保存草稿</button><button id="theme-confirm" class="theme-primary">确认并安排课堂 →</button></div><p class="theme-local-note">确认后保存固定版本；再次开课沿用该版本。修改故事后需重新确认，已安排的课堂不会被后续编辑改写。</p></section>'}
function bind(dim,q){let d=resolve(dim,q),prompt=document.getElementById('theme-prompt'),error=document.getElementById('theme-error');function message(t){if(error)error.textContent=t}document.querySelectorAll('[data-story-template]').forEach(b=>b.onclick=()=>{if(prompt.value.trim()&&(!d||prompt.value!==d.prompt||!d.topicId||!d.confirmed&&d.version>0)&&!confirm('使用模板会替换当前提示词，是否继续？'))return;let t=dim.topics.find(t=>t.id===b.dataset.storyTemplate);d=work(template(dim,t));prompt.value=d.prompt;prompt.focus();message('模板已填入，可以继续修改需求。')});
if(prompt)prompt.oninput=()=>{if(!d)d={id:uid(),dimensionId:dim.id,topicId:'',title:dim.name+'主题课',story:'',lead:'你觉得故事人物此刻需要什么？你也可以只聊故事，不必讲自己的经历。',source:'manual',version:0};if(d.prompt!==prompt.value){d.confirmed=false;if(d.topicId){d.topicId='';d.story='';d.source='manual'}}d.prompt=prompt.value;work(d)};
let next=document.getElementById('theme-preview');if(next)next.onclick=()=>{if(!prompt.value.trim())return message('请描述课程需求，或选择一个模板。');if(!d)prompt.oninput();d.prompt=prompt.value.trim();work(d);location.href=url(dim.id,2,d)};
let title=document.getElementById('theme-title'),story=document.getElementById('theme-story'),lead=document.getElementById('theme-lead');function sync(){d=Object.assign({},d,{title:title.value,story:story.value,lead:lead.value,confirmed:false});work(d)};[title,story,lead].forEach(x=>{if(x)x.oninput=()=>{sync();message('修改尚未确认，请保存或确认后再安排课堂。')}});
function save(confirm){sync();if(!d.title.trim())return message('请填写课程名称。');if(confirm&&(!d.story.trim()||!d.lead.trim()))return message('请填写故事和第一句引导，再确认安排。');d=store(d,confirm);if(confirm)location.href=url(dim.id,3,d);else message('草稿已保存，刷新或下次回来仍可继续编辑。')}
let saveBtn=document.getElementById('theme-save'),confirmBtn=document.getElementById('theme-confirm');if(saveBtn)saveBtn.onclick=()=>save(false);if(confirmBtn)confirmBtn.onclick=()=>save(true);
}
g.YTThemeStoryBuilder={head,input,preview,bind,current,resolve,url,all,store,work};
})(window);
