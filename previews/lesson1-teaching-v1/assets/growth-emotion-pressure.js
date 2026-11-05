/* 校园状态练习：本地交互，不作诊断或心理评分。 */
(function (global) {
  'use strict';
  var registry = global.YTNewGrowth = global.YTNewGrowth || {};
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function svg(body) { return '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>'; }
  function button(text, attr, secondary, disabled) { return '<button type="button" class="ng-action' + (secondary ? ' secondary' : '') + '" ' + attr + (disabled ? ' disabled' : '') + '>' + text + '</button>'; }
  function setup(ctx, scope) {
    var dead = false;
    var timers = new Set();
    function active() { return !dead && ctx.isActive(); }
    function stop() { timers.forEach(clearInterval); timers.clear(); }
    ctx.onCleanup(function () { dead = true; stop(); ctx.board.onclick = null; ctx.board.onchange = null; ctx.board.oninput = null; ctx.board.ondragstart = null; ctx.board.ondragover = null; ctx.board.ondrop = null; });
    return {
      active: active, stop: stop,
      timer: function (fn) { var id = setInterval(function () { if (!active()) { clearInterval(id); timers.delete(id); return; } fn(); }, 200); timers.add(id); return id; },
      show: function (step, total, title, copy, html) {
        if (!active()) return;
        ctx.board.innerHTML = '<section class="ng-panel ' + scope + '"><p class="ng-kicker">校园状态实验室 · ' + step + ' / ' + total + '</p><div class="ng-progress" role="progressbar" aria-label="练习进度" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + step + '"><span style="width:' + (step / total * 100) + '%"></span></div><h3 class="ng-title" tabindex="-1">' + title + '</h3><p class="ng-copy">' + copy + '</p>' + html + '<p class="ng-feedback" data-ng-feedback role="status" aria-live="polite"></p></section>';
        var heading = ctx.board.querySelector('.ng-title'); if (heading) heading.focus({preventScroll:true});
      },
      say: function (text) { var node = ctx.board.querySelector('[data-ng-feedback]'); if (node) node.textContent = text; }
    };
  }
  var emotionScenes = [
    {title:'上台前的两分钟',text:'下一组就轮到你做课堂分享。你看见两位同学低头说话，还没听清他们说什么。',cards:[['老师说下一组轮到我。','fact'],['两位同学正在低头说话。','fact'],['他们一定觉得我讲得很差。','guess'],['我肯定会忘词。','guess']]},
    {title:'群里没有回应',text:'你把小组分工发进群里。十分钟过去了，还没有人回复；今晚需要交出第一版。',cards:[['分工消息发出十分钟了。','fact'],['群里暂时没有新的回复。','fact'],['大家故意把事情都推给我。','guess'],['今晚一定什么也交不出来。','guess']]},
    {title:'练习卷发下来',text:'你这次练习卷有三道题没做对。同桌已经开始订正，你还在看卷面。',cards:[['卷面上有三道题没做对。','fact'],['同桌已经开始订正。','fact'],['我以后都学不好这一科。','guess'],['同桌肯定在看不起我。','guess']]}
  ];
  var emotionNames = ['紧张','生气','失落','委屈','期待','平静'];
  var strategies = [
    {name:'睁眼定位',intro:'保持睁眼，坐稳或站稳。只留意周围，不必改变呼吸。',steps:['找出周围三样静止的东西，慢慢看清颜色。','感受双脚与地面接触，轻轻压一压脚掌。','找到一个清晰的声音，再把视线放回眼前。']},
    {name:'肩部松一格',intro:'动作保持在舒适范围，不用力。如果疼痛或不适，停止并换成睁眼定位。',steps:['睁眼，让双脚落地，注意肩膀现在的位置。','轻轻抬肩再放下，按自己的节奏做两次。','松开下巴和手掌，让肩膀停在舒服的位置。']},
    {name:'舒适节奏呼吸',intro:'可选练习：睁眼，不屏息、不刻意深呼吸。始终以舒服为准，头晕就停止并换一种。',steps:['先自然呼吸，注意脚底的支撑。','舒适地吸气、呼气，不追秒数，不屏息。','继续自然呼吸，让呼气轻松结束，看看周围。']}
  ];
  function startEmotion(ctx) {
    var ui = setup(ctx, 'ng-emotion');
    var s = {scene:null, signals:[], mix:[0,0,0,0,0,0], before:5, after:5, beforeSet:false, afterSet:false, sorted:{}, selected:null, strategy:0, phase:0, running:false, done:false, practiced:[], reflection:''};
    function sceneView() {
      ui.show(1,5,'先选一个校园瞬间','可以用情境中的角色来练，不需要公开自己的经历。', '<div class="ng-grid">' + emotionScenes.map(function (x,i) { return '<button type="button" class="ng-card ng-scene" data-ng-emotion-scene="'+i+'"><b>'+x.title+'</b><span>'+x.text+'</span></button>'; }).join('') + '</div>');
    }
    function mixView() {
      ui.show(2,5,'给此刻的感受调音','情绪可以混在一起，没有标准配方。先记录，再尝试一个动作。', '<div class="ng-scene">'+esc(s.scene.text)+'</div><h4>身体发来什么信号？可多选</h4><div class="ng-row">'+['心跳明显','肩颈绷紧','手心出汗','胃里发紧','想走动','暂时没注意到'].map(function(x,i){return button(x,'data-ng-emotion-signal="'+i+'" aria-pressed="'+s.signals.includes(i)+'"',!s.signals.includes(i));}).join('')+'</div><h4>混合你的情绪 · 0 无 / 5 很明显</h4><div class="ng-ep-sliders">'+emotionNames.map(function(x,i){return '<label>'+x+' <output data-ng-mix-output="'+i+'">'+s.mix[i]+'</output><input class="ng-range" type="range" min="0" max="5" value="'+s.mix[i]+'" data-ng-emotion-mix="'+i+'" aria-label="'+x+'强度"></label>';}).join('')+'</div><label class="ng-ep-rating">练习前，我的紧绷程度：<output data-ng-before-output>'+s.before+'</output> / 10<input type="range" min="0" max="10" value="'+s.before+'" class="ng-range" data-ng-emotion-before aria-label="练习前紧绷程度"></label>'+button(s.beforeSet?'已确认这个练习前记录':'确认练习前记录','data-ng-emotion-confirm-before',true)+'<p class="ng-muted">所有情绪都为 0 也可以；只要这是你的真实选择。</p><div class="ng-actions">'+button('保存调音，看看想法','data-ng-emotion-mix-next')+'</div>');
    }
    function sortView() {
      ui.show(3,5,'把事实与猜测分轨','先点一张卡，再点「可观察的事实」或「尚待验证的猜测」。电脑也可拖入。猜测不等于错误，只是还缺证据。','<div class="ng-ep-sort-cards">'+s.scene.cards.map(function(c,i){return '<button type="button" draggable="true" class="ng-card '+(s.selected===i?'ng-selected':'')+'" data-ng-emotion-card="'+i+'" aria-pressed="'+(s.selected===i)+'">'+esc(c[0])+'<small>'+ (s.sorted[i]==='fact'?'已放：事实':s.sorted[i]==='guess'?'已放：猜测':'待分轨')+'</small></button>';}).join('')+'</div><div class="ng-grid ng-ep-destinations">'+['fact','guess'].map(function(t){return '<button type="button" class="ng-card ng-ep-drop" data-ng-emotion-destination="'+t+'"><b>'+(t==='fact'?'可观察的事实':'尚待验证的猜测')+'</b><span>'+(t==='fact'?'能看到、听到或核对的内容':'对动机、未来或自己的推断')+'</span></button>';}).join('')+'</div><div class="ng-actions">'+button('检查分轨并继续','data-ng-emotion-sort-next')+'</div>');
    }
    function place(i,t) { if (i===null || !s.scene.cards[i]) {ui.say('先选一张卡，再选择它的轨道。');return;} s.sorted[i]=t;s.selected=null;sortView();ui.say(s.scene.cards[i][1]===t?'这张卡放好了。可以核对的内容与推断，值得分开看。':'先放在这里。再想想：这句话有直接证据，还是对动机或未来的推断？可重新选卡移动。'); }
    function practiceView() {
      ui.stop(); s.running=false;
      var st=strategies[s.strategy];
      ui.show(4,5,'给自己一小段缓冲','每种练习约 18 秒，分三个实际动作。无需立刻变好；任何时候都可以停止或换一种。','<div class="ng-row">'+strategies.map(function(x,i){return button(x.name,'data-ng-emotion-strategy="'+i+'" aria-pressed="'+(s.strategy===i)+'"',s.strategy!==i);}).join('')+'</div><p class="ng-copy">'+st.intro+'</p><div class="ng-ep-practice"><span class="ng-chip">动作 '+(Math.min(s.phase,2)+1)+' / 3</span><h4 data-ng-practice-instruction>'+ (s.done?'这一轮动作已完成。':st.steps[s.phase])+'</h4><p data-ng-practice-clock aria-live="polite">'+(s.done?'可以记录感受，或换一种再试。':'每个动作至少体验 6 秒，再自行确认。')+'</p></div><div class="ng-actions">'+button('开始这个动作','data-ng-emotion-practice-start',false,s.done)+button('这个动作做过了，下一步','data-ng-emotion-practice-ack',true,true)+button('停止 / 休息','data-ng-emotion-practice-stop',true)+' </div>'+ (s.practiced.length?'<p class="ng-muted">已体验：'+s.practiced.map(function(i){return strategies[i].name;}).join('、')+'</p><div class="ng-actions">'+button('记录练习后的自己','data-ng-emotion-after-next')+'</div>':'') );
    }
    function beginPractice() {
      if(s.running||s.done)return;s.running=true;
      var start=Date.now();var st=strategies[s.strategy];
      ctx.board.querySelector('[data-ng-emotion-practice-start]').disabled=true;
      ui.timer(function(){var elapsed=Math.min(6,Math.floor((Date.now()-start)/1000));var clock=ctx.board.querySelector('[data-ng-practice-clock]');if(clock)clock.textContent='已给这个动作 '+elapsed+' / 6 秒；'+st.steps[s.phase];if(elapsed>=6){ui.stop();s.running=false;ctx.board.querySelector('[data-ng-emotion-practice-ack]').disabled=false;clock.textContent='时间到了。动作已尝试后，点确认继续；也可以多停留一会。';}});
    }
    function afterView() {
      ui.stop();
      ui.show(5,5,'留下自己的使用说明','这是自我观察，不是效果测验。变轻、没变、变重，都可以如实记录。','<p class="ng-chip">练习前紧绷：'+s.before+' / 10</p><label class="ng-ep-rating">现在的紧绷程度：<output data-ng-after-output>'+s.after+'</output> / 10<input class="ng-range" type="range" min="0" max="10" value="'+s.after+'" data-ng-emotion-after aria-label="练习后紧绷程度"></label>'+button(s.afterSet?'已确认这个练习后记录':'确认练习后记录','data-ng-emotion-confirm-after',true)+'<h4>下一次，我愿意怎样使用？</h4><div class="ng-row">'+['先分清事实与猜测，再行动','给自己一小段身体缓冲','这次不太适合，换一种方法','需要时找信任的人一起面对'].map(function(x,i){return button(x,'data-ng-emotion-reflection="'+i+'" aria-pressed="'+(s.reflection===x)+'"',s.reflection!==x);}).join('')+'</div><div class="ng-actions">'+button('再试一种策略','data-ng-emotion-repeat',true)+button('生成我的随身提示','data-ng-emotion-finish')+'</div>');
    }
    function finalView() {
      var change=s.after<s.before?'这次记录比之前轻一些':s.after===s.before?'这次记录没有变化':'这次记录比之前更紧绷';
      var mix=emotionNames.map(function(x,i){return s.mix[i]?x+' '+s.mix[i]+'/5':'';}).filter(Boolean).join('、')||'此刻没有明显情绪';
      var text='在「'+s.scene.title+'」里，我注意到：'+mix+'。我体验了'+s.practiced.map(function(i){return strategies[i].name;}).join('、')+'。紧绷记录 '+s.before+' → '+s.after+'/10，'+change+'。下次：'+s.reflection+'。';
      ui.show(5,5,'我的随身调音提示','情绪是信息，不是考试分数。一次练习的变化不能说明长期状态。','<div class="ng-card ng-ep-takeaway"><p>'+esc(text)+'</p><p>先说出一件事实，再给猜测留一个问号；然后选择一个能做的小动作。</p></div><p class="ng-muted">若不适持续、影响日常，或你觉得难以独自应对，可以联系老师、学校心理老师或信任的成年人。</p><div class="ng-actions">'+button('完成本轮练习','data-ng-emotion-complete')+'</div>');
      s.takeaway=text;
    }
    ctx.board.onclick=function(e){if(!ui.active())return;var b=e.target.closest('button');if(!b||!ctx.board.contains(b)||b.disabled)return;var d=b.dataset;
      if(d.ngEmotionScene!==undefined){s.scene=emotionScenes[+d.ngEmotionScene];mixView();}
      else if(d.ngEmotionSignal!==undefined){var i=+d.ngEmotionSignal;if(s.signals.includes(i))s.signals=s.signals.filter(function(x){return x!==i;});else s.signals.push(i);mixView();}
      else if(d.ngEmotionConfirmBefore!==undefined){s.beforeSet=true;mixView();}
      else if(d.ngEmotionMixNext!==undefined){if(!s.signals.length||!s.beforeSet)ui.say('请选择至少一种身体观察，并确认练习前记录；不明显也可以。');else sortView();}
      else if(d.ngEmotionCard!==undefined){s.selected=+d.ngEmotionCard;sortView();}
      else if(d.ngEmotionDestination!==undefined)place(s.selected,d.ngEmotionDestination);
      else if(d.ngEmotionSortNext!==undefined){var wrong=s.scene.cards.filter(function(c,i){return s.sorted[i]!==c[1];});if(wrong.length)ui.say('还有 '+wrong.length+' 张需要核对。能直接观察的是事实；「一定」「肯定」对未来或他人想法的推断，要先放在猜测轨。');else practiceView();}
      else if(d.ngEmotionStrategy!==undefined){s.strategy=+d.ngEmotionStrategy;s.phase=0;s.done=false;practiceView();}
      else if(d.ngEmotionPracticeStart!==undefined)beginPractice();
      else if(d.ngEmotionPracticeAck!==undefined){s.phase++;if(s.phase===3){s.done=true;if(!s.practiced.includes(s.strategy))s.practiced.push(s.strategy);}practiceView();}
      else if(d.ngEmotionPracticeStop!==undefined){practiceView();ui.say('已停止计时。可以休息，或换成睁眼定位。当前动作重新开始时会完整保留 6 秒。');}
      else if(d.ngEmotionAfterNext!==undefined){s.after=s.before;afterView();}
      else if(d.ngEmotionConfirmAfter!==undefined){s.afterSet=true;afterView();}
      else if(d.ngEmotionReflection!==undefined){s.reflection=['先分清事实与猜测，再行动','给自己一小段身体缓冲','这次不太适合，换一种方法','需要时找信任的人一起面对'][+d.ngEmotionReflection];afterView();}
      else if(d.ngEmotionRepeat!==undefined){s.phase=0;s.done=false;practiceView();}
      else if(d.ngEmotionFinish!==undefined){if(!s.afterSet||!s.reflection)ui.say('请确认现在的真实记录，再选一条下次的使用方式。');else finalView();}
      else if(d.ngEmotionComplete!==undefined){ui.stop();ctx.complete(s.takeaway);}
    };
    ctx.board.oninput=function(e){if(!ui.active())return;var d=e.target.dataset;var v=+e.target.value;
      if(d.ngEmotionMix!==undefined){s.mix[+d.ngEmotionMix]=v;ctx.board.querySelector('[data-ng-mix-output="'+d.ngEmotionMix+'"]').textContent=v;}
      if(d.ngEmotionBefore!==undefined){s.before=v;s.beforeSet=true;ctx.board.querySelector('[data-ng-before-output]').textContent=v;}
      if(d.ngEmotionAfter!==undefined){s.after=v;s.afterSet=true;ctx.board.querySelector('[data-ng-after-output]').textContent=v;}
    };
    ctx.board.ondragstart=function(e){if(!ui.active())return;var b=e.target.closest('[data-ng-emotion-card]');if(b){s.selected=+b.dataset.ngEmotionCard;e.dataTransfer.setData('text/plain',String(s.selected));e.dataTransfer.effectAllowed='move';}};
    ctx.board.ondragover=function(e){if(ui.active()&&e.target.closest('[data-ng-emotion-destination]'))e.preventDefault();};
    ctx.board.ondrop=function(e){var b=e.target.closest('[data-ng-emotion-destination]');if(ui.active()&&b){e.preventDefault();place(s.selected,b.dataset.ngEmotionDestination);}};
    sceneView();
  }
  var packs=[
    {title:'放学前的收尾',text:'还有一小段自由整理时间。明天要交订正、参加小组汇报，也想整理桌面。',event:'老师临时请大家用 5 分钟整理公共区域。可用时间少了 5 分钟，请重新分配或调整顺序。',tasks:[{title:'完成数学订正',steps:[['圈出两道错题的错误点',4],['重做第一道并写关键步骤',7],['重做第二道并核对',7]]},{title:'准备小组汇报',steps:[['列出自己要讲的三个要点',5],['发消息确认谁带展示材料',2]]},{title:'整理学习用品',steps:[['把明天要用的书放进书包',3],['按科目整理整叠旧卷',8]]}]},
    {title:'考试周的小窗口',text:'晚自习前有一段时间。你需要复习、准备实验记录，还答应过同伴讨论一道题。',event:'实验室开放时间调整，需要先花 5 分钟听说明。可用时间少了 5 分钟，请更新你的计划。',tasks:[{title:'复习英语',steps:[['挑出最不熟的五个单词',3],['遮住释义回忆并核对',6]]},{title:'准备实验记录',steps:[['把实验数据抄入表格',7],['标记一处不确定的数据问老师',3]]},{title:'处理同伴约定',steps:[['发消息确认讨论时间',2],['自己先写出那道题的已知条件',5],['和同伴完整讨论解法',10]]}]},
    {title:'社团与作业撞车',text:'午间你要兼顾作业、小组海报和社团报名。先做一个可执行的小计划，而不是把所有事塞进去。',event:'同学来确认活动安排，占用了 5 分钟。现在剩余时间减少，请做一次真实调整。',tasks:[{title:'启动语文作业',steps:[['读题并圈出写作要求',3],['列三个素材小标题',5],['完成一段草稿',9]]},{title:'推进小组海报',steps:[['写出海报标题和两条信息',6],['发消息请同伴确认图片来源',2]]},{title:'社团报名',steps:[['核对报名截止时间与要求',3],['填写并检查报名表',5]]}]}
  ];
  function startPressure(ctx) {
    var ui=setup(ctx,'ng-pressure');var s={pack:null,split:[],items:[],budget:20,event:false,revised:false,drag:null,checked:false};
    var zones={now:'现在做',later:'稍后安排',help:'请求协助'};
    function packView(){ui.show(1,4,'选一个任务包','这里没有爆炸倒计时。我们拆开的是任务，不是给人打分。','<div class="ng-grid">'+packs.map(function(p,i){return '<button type="button" class="ng-card ng-scene" data-ng-pressure-pack="'+i+'"><b>'+p.title+'</b><span>'+p.text+'</span></button>';}).join('')+'</div>');}
    function splitView(){ui.show(2,4,'把大任务拆到能动手','逐一展开任务，看看具体动作与估计用时。用时只是情境估计，不要求你和别人一样快。','<div class="ng-scene">'+s.pack.text+'</div><div class="ng-ep-task-groups">'+s.pack.tasks.map(function(t,i){return '<article class="ng-card"><h4>'+t.title+'</h4>'+(s.split.includes(i)?'<ul>'+t.steps.map(function(x){return '<li>'+x[0]+' <span class="ng-chip">'+x[1]+' 分钟</span></li>';}).join('')+'</ul>':button('拆成具体小步','data-ng-pressure-split="'+i+'"',true))+'</article>';}).join('')+'</div><div class="ng-actions">'+button('全部拆开，进入调度台','data-ng-pressure-plan-next',false,s.split.length!==s.pack.tasks.length)+'</div>');}
    function total(){return s.items.reduce(function(sum,x){return sum+(x.zone==='now'?x.minutes:0);},0);}
    function planView(){var available=s.budget-(s.event?5:0);ui.show(s.event?4:3,4,s.event?'变动来了，重新排一次':'把有限时间留给具体行动',s.event?'请至少修改一次分区或顺序，再检查新计划。允许不同解法。':'为每一步指定去向。列表从上到下代表优先顺序；手机用上移 / 下移，电脑也可拖动。','<div class="ng-ep-budget"><label>本轮原始时间预算<select data-ng-pressure-budget '+(s.event?'disabled':'')+'>'+[15,20,25].map(function(v){return '<option value="'+v+'" '+(v===s.budget?'selected':'')+'>'+v+' 分钟</option>';}).join('')+'</select></label><p><strong>'+total()+' / '+available+' 分钟</strong><span>现在做的总用时 / 当前可用时间</span></p></div>'+(s.event?'<div class="ng-scene ng-ep-event"><b>情境变动</b><p>'+s.pack.event+'</p></div>':'')+'<div class="ng-ep-plan-list">'+s.items.map(function(x,i){return '<article class="ng-card ng-ep-plan-item" draggable="true" data-ng-pressure-item="'+x.id+'"><div class="ng-ep-item-heading"><span class="ng-chip">'+(i+1)+'</span><div><small>'+esc(x.parent)+'</small><h4>'+esc(x.title)+'</h4></div><b>'+x.minutes+' 分钟</b></div><div class="ng-ep-item-controls"><div class="ng-row">'+button('上移','data-ng-pressure-up="'+x.id+'" aria-label="上移：'+esc(x.title)+'"',true,i===0)+button('下移','data-ng-pressure-down="'+x.id+'" aria-label="下移：'+esc(x.title)+'"',true,i===s.items.length-1)+'</div><label>这一步的去向<select data-ng-pressure-zone="'+x.id+'" aria-label="'+esc(x.title)+'的去向"><option value="">请选择去向</option>'+Object.keys(zones).map(function(z){return '<option value="'+z+'" '+(x.zone===z?'selected':'')+'>'+zones[z]+'</option>';}).join('')+'</select></label></div></article>';}).join('')+'</div><p class="ng-muted">请求协助：由你发起具体请求，不能假定别人已经答应。稍后安排：明确留到本轮之后，不占当前预算。</p><div class="ng-actions">'+button(s.event?'重新检查可执行性':'检查计划，接收变动','data-ng-pressure-check')+'</div>'+(s.checked?'<div class="ng-card ng-ep-takeaway"><h4>这份修订计划可执行</h4><p>第一步：'+esc(s.items.find(function(x){return x.zone==='now';}).title)+'。请从这个动作开始。</p>'+button('查看我的行动单','data-ng-pressure-summary')+'</div>':''));}
    function change(){s.checked=false;if(s.event)s.revised=true;}
    function move(id,offset){var i=s.items.findIndex(function(x){return x.id===id;});var j=i+offset;if(i<0||j<0||j>=s.items.length)return;var a=s.items.splice(i,1)[0];s.items.splice(j,0,a);change();planView();ui.say('已调整顺序。现在做的第一项，就是本轮的起手动作。');}
    function issues(){var a=[];if(s.items.some(function(x){return !x.zone;}))a.push('还有小步未选择去向。');if(!s.items.some(function(x){return x.zone==='now';}))a.push('至少留一个具体小步作为现在的行动。');if(total()>s.budget-(s.event?5:0))a.push('超出可用时间 '+(total()-s.budget+(s.event?5:0))+' 分钟。把部分小步改为稍后或请求协助。');if(s.event&&!s.revised)a.push('变动后还没有修订。请调整至少一个小步的去向或顺序。');return a;}
    function summary(){var first=s.items.find(function(x){return x.zone==='now';});var deferred=s.items.filter(function(x){return x.zone==='later';});var help=s.items.filter(function(x){return x.zone==='help';});s.summary='在「'+s.pack.title+'」中，修订后 '+(s.budget-5)+' 分钟预算，安排 '+total()+' 分钟。第一步：'+first.title+'（'+first.minutes+' 分钟）。稍后：'+(deferred.map(function(x){return x.title;}).join('；')||'无')+'。请求协助：'+(help.map(function(x){return x.title;}).join('；')||'本轮暂无')+'。';ui.show(4,4,'我的可执行行动单','压力不一定消失，但下一步可以更清楚。这里记录的是计划，不是假装你已经完成了任务。','<div class="ng-card ng-ep-takeaway"><span class="ng-chip">先做这一小步</span><h4>'+esc(first.title)+'</h4><p>'+first.minutes+' 分钟 · 现在做合计 '+total()+' / '+(s.budget-5)+' 分钟</p></div><div class="ng-grid"><div class="ng-card"><h4>稍后再安排</h4><p>'+(deferred.map(function(x){return esc(x.title);}).join('；')||'本轮暂无')+'</p></div><div class="ng-card"><h4>需要发出的协助请求</h4><p>'+(help.map(function(x){return '我需要协助：'+esc(x.title)+'，你方便一起确认吗？';}).join('<br>')||'本轮暂无；遇到卡点时仍可以求助。')+'</p></div></div><div class="ng-actions">'+button('返回调整计划','data-ng-pressure-edit',true)+button('完成本轮练习','data-ng-pressure-complete')+'</div>');}
    ctx.board.onclick=function(e){if(!ui.active())return;var b=e.target.closest('button');if(!b||b.disabled||!ctx.board.contains(b))return;var d=b.dataset;
      if(d.ngPressurePack!==undefined){s.pack=packs[+d.ngPressurePack];splitView();}
      else if(d.ngPressureSplit!==undefined){var idx=+d.ngPressureSplit;if(!s.split.includes(idx)){s.split.push(idx);s.pack.tasks[idx].steps.forEach(function(x,j){s.items.push({id:idx+'-'+j,title:x[0],minutes:x[1],parent:s.pack.tasks[idx].title,zone:''});});}splitView();}
      else if(d.ngPressurePlanNext!==undefined)planView();
      else if(d.ngPressureUp!==undefined)move(d.ngPressureUp,-1);
      else if(d.ngPressureDown!==undefined)move(d.ngPressureDown,1);
      else if(d.ngPressureCheck!==undefined){var problems=issues();if(problems.length){s.checked=false;ui.say(problems.join(' '));}else if(!s.event){s.event=true;s.revised=false;planView();ui.say('初稿在原预算内。现在发生了情境变动，请修订后再检查。');}else{s.checked=true;planView();ui.say('时间没有超支，每一步都有去向，也有明确的起手动作。可以继续调整，或查看行动单。');}}
      else if(d.ngPressureSummary!==undefined){if(!issues().length&&s.checked)summary();}
      else if(d.ngPressureEdit!==undefined)planView();
      else if(d.ngPressureComplete!==undefined)ctx.complete(s.summary);
    };
    ctx.board.onchange=function(e){if(!ui.active())return;var d=e.target.dataset;if(d.ngPressureBudget!==undefined&&!s.event){s.budget=+e.target.value;s.checked=false;planView();}if(d.ngPressureZone!==undefined){var x=s.items.find(function(a){return a.id===d.ngPressureZone;});if(x&&x.zone!==e.target.value){x.zone=e.target.value;change();planView();}}};
    ctx.board.ondragstart=function(e){var row=e.target.closest('[data-ng-pressure-item]');if(ui.active()&&row&&!e.target.closest('button,select')){s.drag=row.dataset.ngPressureItem;e.dataTransfer.setData('text/plain',s.drag);e.dataTransfer.effectAllowed='move';}else e.preventDefault();};
    ctx.board.ondragover=function(e){if(ui.active()&&e.target.closest('[data-ng-pressure-item]'))e.preventDefault();};
    ctx.board.ondrop=function(e){if(!ui.active())return;var row=e.target.closest('[data-ng-pressure-item]');if(!row||!s.drag)return;e.preventDefault();var from=s.items.findIndex(function(x){return x.id===s.drag;});var to=s.items.findIndex(function(x){return x.id===row.dataset.ngPressureItem;});s.drag=null;if(from>=0&&to>=0&&from!==to){s.items.splice(to,0,s.items.splice(from,1)[0]);change();planView();ui.say('优先顺序已调整。');}};
    packView();
  }
  var emotionIcon=svg('<path d="M14 12v40M32 12v40M50 12v40"/><rect x="8" y="23" width="12" height="10" rx="4" fill="#d8f7eb"/><rect x="26" y="36" width="12" height="10" rx="4" fill="#c5f0f5"/><rect x="44" y="17" width="12" height="10" rx="4" fill="#d8f7eb"/>');
  var pressureIcon=svg('<rect x="9" y="9" width="46" height="46" rx="12"/><path d="m18 23 4 4 7-8M34 24h11m-27 15 4 4 7-8M34 40h11"/>');
  registry.emotionMixer={id:'emotionMixer',title:'情绪调音台',ability:'情绪觉察与调节',summary:'调出自己的感受，分开事实与猜测，体验一段身体缓冲。',icon:emotionIcon,art:emotionIcon,start:startEmotion};
  registry.pressureLab={id:'pressureLab',title:'压力拆弹员',ability:'任务拆分与弹性规划',summary:'拆出具体小步，用有限时间排计划，再应对一次情境变动。',icon:pressureIcon,art:pressureIcon,start:startPressure};
})(window);
