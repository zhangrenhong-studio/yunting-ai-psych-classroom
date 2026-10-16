/* 成长训练场：短时大脑训练。用于课堂体验，不作为认知测评或能力排名。 */
(function (global) {
  'use strict';
  var CATALOG=[
    {id:'schulte',ability:'注意力训练',title:'舒尔特方格',summary:'按顺序寻找数字，练习视觉搜索和注意保持。'},
    {id:'kaleidoscope',ability:'视觉观察',title:'春日万花筒',summary:'记住短暂出现的花朵图案，再找到完全相同的一幅。'},
    {id:'stroop',ability:'抑制控制',title:'颜色干扰',summary:'忽略文字的意思，只判断文字真正显示的颜色。'},
    {id:'digit',ability:'工作记忆',title:'数字闪记',summary:'记住短暂出现的一组数字，再按原顺序写出来。'},
    {id:'path',ability:'空间记忆',title:'星点轨迹',summary:'观察依次亮起的位置，再按相同顺序复现轨迹。'},
    {id:'target',ability:'视觉专注',title:'目标捕手',summary:'在相似符号中寻找指定目标，完成连续三轮搜索。'}
  ];
  function svg(body){return '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+body+'</svg>'}
  var ICONS={
    schulte:'<rect x="5" y="5" width="22" height="22" rx="4"/><path d="M12.3 5v22M19.7 5v22M5 12.3h22M5 19.7h22"/>',
    kaleidoscope:'<path d="M16 13c-8-10-15 0-5 4-10 5-1 14 5 4 6 10 15 1 5-4 10-4 3-14-5-4Z"/><circle cx="16" cy="17" r="3"/><path d="M16 8V4m-2 2h4"/>',
    stroop:'<circle cx="12" cy="12" r="7"/><circle cx="21" cy="14" r="7"/><circle cx="16" cy="22" r="7"/>',
    digit:'<rect x="4" y="7" width="24" height="18" rx="4"/><path d="M10 13l2-2v10m6-9c4-3 7 2 2 5l-2 3h6"/>',
    path:'<circle cx="7" cy="24" r="2.5"/><circle cx="24" cy="8" r="2.5"/><path d="M7 21v-8a5 5 0 0 1 10 0v6a4 4 0 0 0 8 0v-8"/>',
    target:'<circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="4"/><path d="M16 3v5m13 8h-5M16 29v-5M3 16h5"/>'
  };
  CATALOG.forEach(function(app){app.icon=svg(ICONS[app.id])});
  var ARROW=svg('<path d="M7 16h18m-7-7 7 7-7 7"/>');
  function motif(v){
    var forms={
      '🌸':'<path d="M16 12c-7-9-14 0-6 5-9 5-1 13 6 5 7 8 15 0 6-5 8-5 1-14-6-5Z"/><circle cx="16" cy="17" r="3"/>',
      '🌼':'<path d="M16 4v5m0 14v5M4 16h5m14 0h5M7.5 7.5l4 4m9 9 4 4m0-17-4 4m-9 9-4 4"/><circle cx="16" cy="16" r="6"/>',
      '🌿':'<path d="M9 27 22 5M14 19C3 20 3 10 7 8c7 0 10 5 7 11Zm4-7c-1-8 6-10 10-8 1 7-4 12-10 8Z"/>',
      '🌱':'<path d="M16 27V16C5 17 3 11 4 6c8-1 12 3 12 10 0-9 5-12 13-10 0 7-4 11-13 10"/>',
      '✦':'<path d="m16 4 3.4 8.6L28 16l-8.6 3.4L16 28l-3.4-8.6L4 16l8.6-3.4Z"/>'
    };
    return svg(forms[v]||ICONS.target);
  }
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
  function byId(ids){return (ids&&ids.length?ids:CATALOG.map(function(x){return x.id})).map(function(id){return CATALOG.find(function(x){return x.id===id})}).filter(Boolean)}
  function mount(root,config){
    var apps=byId(config.appIds),playCounts={};
    function hub(){
      root.innerHTML='<div class="game-hub">'+apps.map(function(a){
        var count=playCounts[a.id]||0;
        return '<button class="game-card" data-game="'+a.id+'"><span class="game-card-top"><i class="training-icon">'+a.icon+'</i><span class="game-card-heading"><span class="game-ability">'+a.ability+'</span><b>'+a.title+'</b></span></span><p>'+a.summary+'</p><em><span>'+(count?'已训练 '+count+' 次 · 继续训练':'开始训练')+'</span>'+ARROW+'</em></button>';
      }).join('')+'</div><div class="playground-actions"><p>可以自由选择，也可以重复进行同一项训练。</p><button class="btn btn-primary" data-finish-stage>结束本次训练</button></div><p class="game-boundary">训练结果只用于本次体验，不生成认知能力评分、班级排名或心理判断。</p>';
      root.querySelectorAll('[data-game]').forEach(function(b){b.onclick=function(){open(apps.find(function(a){return a.id===b.dataset.game}))}});
      root.querySelector('[data-finish-stage]').onclick=function(){if(config.onStageComplete)config.onStageComplete(Object.keys(playCounts))};
    }
    function shell(app,html){root.innerHTML='<section class="game-play"><button class="game-back" data-back>← 返回训练场</button><header class="training-heading"><i class="training-icon">'+app.icon+'</i><div><p class="t-eyebrow">'+app.ability+'</p><h3>'+app.title+'</h3></div></header><p class="game-prompt">'+app.summary+'</p><div data-board>'+html+'</div></section>';root.querySelector('[data-back]').onclick=hub;return root.querySelector('[data-board]')}
    function result(app,text){
      playCounts[app.id]=(playCounts[app.id]||0)+1;
      if(config.onGameComplete)config.onGameComplete(app,playCounts[app.id]);
      root.innerHTML='<section class="game-result"><i class="training-icon">'+app.icon+'</i><p class="t-eyebrow">'+app.ability+' · 本轮完成</p><h3>'+app.title+'</h3><p class="game-result-summary" role="status">'+esc(text)+'</p><p class="game-replay-note">可以反复训练，按自己的节奏继续。</p><div class="row"><button class="btn btn-primary" data-replay>再训练一次</button><button class="btn btn-ghost" data-more>返回训练场</button></div></section>';
      root.querySelector('[data-replay]').onclick=function(){open(app)};
      root.querySelector('[data-more]').onclick=hub;
    }
    function open(app){if(app.id==='schulte')schulte(app);if(app.id==='kaleidoscope')kaleidoscope(app);if(app.id==='stroop')stroop(app);if(app.id==='digit')digit(app);if(app.id==='path')path(app);if(app.id==='target')target(app)}
    function schulte(app){var nums=shuffle([1,2,3,4,5,6,7,8,9]),next=1,start=Date.now(),board=shell(app,'<p class="game-hint" data-hint>从 1 开始，依次点击到 9。不用和别人比较速度。</p><div class="schulte-grid">'+nums.map(function(n){return '<button data-n="'+n+'">'+n+'</button>'}).join('')+'</div>');board.querySelectorAll('[data-n]').forEach(function(b){b.onclick=function(){if(Number(b.dataset.n)===next){b.disabled=true;b.classList.add('is-done');next++;board.querySelector('[data-hint]').textContent=next<=9?'下一个数字：'+next:'完成';if(next===10)setTimeout(function(){result(app,'你按顺序完成了 1–9 的视觉搜索，用时 '+Math.max(1,Math.round((Date.now()-start)/1000))+' 秒。时间只留给自己查看。')},300)}else{b.classList.add('is-miss');setTimeout(function(){b.classList.remove('is-miss')},260)}}})}
    function kaleidoscope(app){var patterns=[['🌸','🌿','🌼','🌱'],['🌼','🌿','🌸','🌱'],['🌸','🌱','🌼','🌿'],['🌿','🌸','🌱','🌼']],targetPattern=patterns[0],board=shell(app,'<p class="game-hint" data-hint>点击开始后，观察图案 3 秒。</p><button class="btn btn-primary" data-start>开始观察</button><div class="kaleido-target is-hidden" data-target></div><div class="kaleido-options is-hidden" data-options></div>');function pattern(x,button,i){return '<'+(button?'button':'div')+(button?' data-i="'+i+'"':'')+' class="kaleido-pattern">'+x.map(function(v){return '<span>'+motif(v)+'</span>'}).join('')+'</'+(button?'button':'div')+'>'}board.querySelector('[data-start]').onclick=function(){this.hidden=true;var t=board.querySelector('[data-target]');t.innerHTML=pattern(targetPattern,false,0);t.classList.remove('is-hidden');board.querySelector('[data-hint]').textContent='仔细看花朵和叶子的位置。';setTimeout(function(){t.classList.add('is-hidden');var options=board.querySelector('[data-options]'),mix=shuffle(patterns);options.innerHTML=mix.map(function(x,i){return pattern(x,true,i)}).join('');options.classList.remove('is-hidden');board.querySelector('[data-hint]').textContent='哪一幅和刚才完全一样？';options.querySelectorAll('[data-i]').forEach(function(b){b.onclick=function(){var chosen=mix[Number(b.dataset.i)];if(JSON.stringify(chosen)===JSON.stringify(targetPattern)){b.classList.add('is-done');setTimeout(function(){result(app,'你完成了一次短时图案观察与视觉记忆训练。')},350)}else{b.classList.add('is-miss');board.querySelector('[data-hint]').textContent='有一处位置不同，再看一看。';setTimeout(function(){b.classList.remove('is-miss')},350)}}})},3000)}}
    function stroop(app){var rounds=[{word:'红',ink:'blue',answer:'蓝'},{word:'绿',ink:'red',answer:'红'},{word:'蓝',ink:'green',answer:'绿'},{word:'黄',ink:'blue',answer:'蓝'}],i=0,board=shell(app,'<p class="game-hint">不要读文字，只选择它显示出来的颜色。</p><div class="stroop-word" data-word></div><div class="stroop-options"><button data-c="红">红色</button><button data-c="蓝">蓝色</button><button data-c="绿">绿色</button><button data-c="黄">黄色</button></div><p class="game-hint" data-progress></p>');function draw(){var r=rounds[i],w=board.querySelector('[data-word]');w.textContent=r.word;w.className='stroop-word ink-'+r.ink;board.querySelector('[data-progress]').textContent='第 '+(i+1)+' / '+rounds.length+' 轮'}draw();board.querySelectorAll('[data-c]').forEach(function(b){b.onclick=function(){if(b.dataset.c===rounds[i].answer){i++;if(i===rounds.length){result(app,'你完成了四轮颜色干扰训练。')}else draw()}else{b.classList.add('is-miss');setTimeout(function(){b.classList.remove('is-miss')},260)}}})}
    function digit(app){var value=String(Math.floor(10000+Math.random()*90000)),board=shell(app,'<p class="game-hint" data-hint>点击开始，数字会出现 3 秒。</p><button class="btn btn-primary" data-start>开始闪记</button><div class="digit-flash is-hidden" data-flash></div><div class="digit-answer is-hidden" data-answer><input class="field" inputmode="numeric" maxlength="5" placeholder="输入刚才的 5 位数字"><button class="btn btn-primary">确认</button></div>');board.querySelector('[data-start]').onclick=function(){this.hidden=true;var f=board.querySelector('[data-flash]');f.textContent=value;f.classList.remove('is-hidden');setTimeout(function(){f.classList.add('is-hidden');var a=board.querySelector('[data-answer]');a.classList.remove('is-hidden');a.querySelector('input').focus()},3000)};board.querySelector('[data-answer] button').onclick=function(){var input=board.querySelector('input');if(input.value===value)result(app,'你按原顺序记住了这组数字。');else{board.querySelector('[data-hint]').textContent='还差一点，正确数字是 '+value+'。可以再试一次。';input.value='';board.querySelector('[data-start]').hidden=false;board.querySelector('[data-answer]').classList.add('is-hidden')}}}
    function path(app){var seq=shuffle([0,1,2,3,4,5,6,7,8]).slice(0,4),answer=[],board=shell(app,'<p class="game-hint" data-hint>点击开始，观察星点亮起的顺序。</p><button class="btn btn-primary" data-start>开始观察</button><div class="path-grid">'+Array.from({length:9},function(_,i){return '<button aria-label="星点 '+(i+1)+'" data-cell="'+i+'">'+motif('✦')+'</button>'}).join('')+'</div>');function show(k){if(k>=seq.length){board.querySelector('[data-hint]').textContent='现在按相同顺序点击星点。';return}var c=board.querySelector('[data-cell="'+seq[k]+'"]');c.classList.add('is-lit');setTimeout(function(){c.classList.remove('is-lit');setTimeout(function(){show(k+1)},180)},500)}board.querySelector('[data-start]').onclick=function(){this.hidden=true;show(0)};board.querySelectorAll('[data-cell]').forEach(function(b){b.onclick=function(){answer.push(Number(b.dataset.cell));b.classList.add('is-picked');setTimeout(function(){b.classList.remove('is-picked')},220);var wrong=answer.some(function(v,i){return v!==seq[i]});if(wrong){answer=[];board.querySelector('[data-hint]').textContent='顺序不同，再观察一次。';board.querySelector('[data-start]').hidden=false}else if(answer.length===seq.length)result(app,'你复现了一条由四个位置组成的空间轨迹。')}})}
    function target(app){var symbols=['○','△','□','◇','▽','☆','●','▢','♢','⊙','◁','⬡'],targets=['◇','☆','⊙'],round=0,board=shell(app,'<div class="target-call">寻找 <b data-target></b></div><div class="target-grid" data-grid></div><p class="game-hint" data-hint>找到目标后进入下一轮。</p>');function draw(){var t=targets[round];board.querySelector('[data-target]').textContent=t;board.querySelector('[data-grid]').innerHTML=shuffle(symbols).map(function(x){return '<button data-symbol="'+x+'">'+x+'</button>'}).join('');board.querySelectorAll('[data-symbol]').forEach(function(b){b.onclick=function(){if(b.dataset.symbol===t){round++;if(round===targets.length)result(app,'你完成了连续三轮目标搜索。');else draw()}else{b.classList.add('is-miss');setTimeout(function(){b.classList.remove('is-miss')},260)}}})}draw()}
    hub();
  }
  global.YTGrowthGames={catalog:CATALOG,mount:mount};
})(window);
