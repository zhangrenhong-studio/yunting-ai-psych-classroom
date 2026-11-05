/* Single-player classroom practice. No assessment, sensors or network. */
(function (global) {
  'use strict';
  const registry = global.YTNewGrowth = global.YTNewGrowth || {};
  const svg = body => '<svg viewBox="0 0 120 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  const bridgeArt = svg('<path d="M8 77h104M15 67V40m90 27V40M15 45q45-55 90 0M15 57h90M35 29v28m25-36v36m25-28v28"/><path d="M9 86q10-7 20 0t20 0t20 0t20 0t20 0"/>');
  const rhythmArt = svg('<circle cx="60" cy="48" r="30"/><path d="M12 48h17l9-16 13 33 15-40 13 32 9-9h20"/>');
  function button(action, text, secondary, extra) { return '<button type="button" class="ng-action' + (secondary ? ' secondary' : '') + '" data-ng-' + action + (extra || '') + '>' + text + '</button>'; }
  function setup(ctx, cls) {
    let live = true;
    const root = document.createElement('section'); root.className = 'ng-panel ' + cls; ctx.board.replaceChildren(root);
    const active = () => live && ctx.isActive();
    ctx.onCleanup(() => { live = false; root.replaceChildren(); });
    return { root, active };
  }
  function bridgeTogether(ctx) {
    const {root, active} = setup(ctx, 'ng-bridge');
    const presets = [
      {title:'小车送花', story:'小禾推着花车，小川负责接应。一起搭一座能让两人安心通过的桥。', a:'我的花车需要至少 2 格宽，每一段承重至少 3。窄板不能推车。', b:'我希望桥中间有可停靠的休息平台；走道两端也要有护栏。', width:2, load:3, rest:true},
      {title:'风中的书箱', story:'把书箱送到河对岸。风有点大，先听听两个人各自需要什么。', a:'书箱比较重，每一段承重至少 4；走道至少 2 格宽。', b:'风大，我希望三段都有护栏。这次不需要休息平台。', width:2, load:4, rest:false}
    ];
    let scenario=0, view='a', pieces, slots, selected=null, history=[], known, pending=null, offer=null, exchanged=false, feedback='', passed=false, sim=false, raf=0, simStart=0;
    const names={a:'小禾',b:'小川'};
    function reset() {
      cancelAnimationFrame(raf); view='a'; slots=[null,null,null]; selected=null; history=[]; known={a:false,b:false}; pending=null; offer=null; exchanged=false; feedback='先分别看看两人的信息，再向对方提问。'; passed=false; sim=false;
      pieces=[
        {id:'p0',name:'青叶护栏板',owner:'a',w:2,load:4,rail:true,rest:false,joint:'圆'},
        {id:'p1',name:'晨光护栏板',owner:'a',w:2,load:4,rail:true,rest:false,joint:'圆'},
        {id:'p2',name:'轻巧窄板',owner:'a',w:1,load:4,rail:false,rest:false,joint:'圆'},
        {id:'p3',name:'停靠平台',owner:'b',w:2,load:4,rail:true,rest:true,joint:'圆'},
        {id:'p4',name:'方口宽板',owner:'b',w:2,load:5,rail:true,rest:false,joint:'方'},
        {id:'p5',name:'薄木宽板',owner:'b',w:2,load:2,rail:false,rest:false,joint:'圆'}
      ]; draw();
    }
    const get = id => pieces.find(p=>p.id===id);
    function save(){history.push({slots:slots.slice(),owners:pieces.map(p=>p.owner),exchanged,offer:offer && Object.assign({},offer)});passed=false;}
    function place(index){
      if(!selected){feedback='先在当前角色的材料箱中选择一块板，再选择桥位。';draw();return;}
      const p=get(selected); if(p.owner!==view)return;
      save(); slots=slots.map(id=>id===selected?null:id); slots[index]=selected; selected=null; feedback='材料已放入桥位。可切换角色继续搭建，也可撤回调整。';draw();
    }
    function findings(){
      const issues=[], s=presets[scenario];
      if(slots.some(id=>!id))issues.push('桥还有空位：先把三段走道接完整。');
      slots.forEach((id,i)=>{if(!id)return;const p=get(id);if(p.joint!=='圆')issues.push('第 '+(i+1)+' 段是方口，接不上河岸和其他圆口材料。');if(p.w<s.width)issues.push('第 '+(i+1)+' 段只有 '+p.w+' 格宽，花车／书箱需要 '+s.width+' 格。');if(p.load<s.load)issues.push('第 '+(i+1)+' 段承重 '+p.load+'，本次需要至少 '+s.load+'，请换更结实的板。');if((!s.rest || i!==1)&&!p.rail)issues.push('第 '+(i+1)+' 段缺少对方需要的护栏。');});
      if(s.rest && (!slots[1]||!get(slots[1]).rest))issues.push('中间还没有可停靠的休息平台。');
      if(!known.a||!known.b)issues.push('还没听全双方需求：切换视角，完成彼此的提问与回应。');
      if(!exchanged)issues.push('还没有双方确认的材料交换：各选一块自己的材料，协商后互换。');
      return issues;
    }
    function draw(){
      if(!active())return;const s=presets[scenario], other=view==='a'?'b':'a';
      root.innerHTML='<div class="ng-kicker">表达需求 · 单人双视角协作</div><h3 class="ng-title">默契搭桥</h3><p class="ng-copy">'+s.story+' 这不是联机游戏，也不要求你一味同意对方。</p><div class="ng-row">'+presets.map((p,i)=>'<button type="button" class="ng-chip" data-ng-preset="'+i+'" aria-pressed="'+(scenario===i)+'" '+(sim?'disabled':'')+'>'+p.title+'</button>').join('')+'</div><div class="ng-row ng-view-tabs">'+['a','b'].map(v=>'<button type="button" class="ng-action '+(view===v?'ng-selected':'secondary')+'" data-ng-view="'+v+'" aria-pressed="'+(view===v)+'" '+(sim?'disabled':'')+'>看'+names[v]+'的视角</button>').join('')+'</div><div class="ng-card ng-private"><strong>'+names[view]+'的私有信息 · 仅此视角显示</strong><p>'+s[view]+'</p><p class="ng-muted">下方材料箱也只显示此人持有的材料；切换视角不会自动把需求告诉对方。</p></div><div class="ng-grid"><div class="ng-card"><h4>先问，再交换</h4>'+conversation(other)+'<p class="ng-muted">已说清：小禾 '+(known.a?'✓':'待回应')+' · 小川 '+(known.b?'✓':'待回应')+'</p></div><div class="ng-card"><h4>'+names[view]+'的材料箱</h4><p class="ng-muted">圆口才能连接桥岸。点击材料 → 点击桥位；电脑也可拖放。</p><div class="ng-materials">'+pieces.filter(p=>p.owner===view).map(p=>'<button type="button" draggable="'+!sim+'" data-ng-piece="'+p.id+'" class="ng-material '+(selected===p.id?'ng-selected':'')+'" aria-pressed="'+(selected===p.id)+'" '+(sim?'disabled':'')+'><strong>'+p.name+'</strong><span>'+p.w+' 格宽 · 承重 '+p.load+' · '+p.joint+'口</span><span>'+(p.rail?'有护栏':'无护栏')+' · '+(p.rest?'可停靠':'普通走道')+(slots.includes(p.id)?' · 已在桥上':'')+'</span></button>').join('')+'</div></div></div><div class="ng-scene ng-bridge-scene"><svg viewBox="0 0 600 190" role="img" aria-label="三段桥，圆口河岸；下方按钮可放置或更换材料"><path d="M0 150Q50 130 100 150T200 150T300 150T400 150T500 150T600 150V190H0Z" fill="#c8eff0"/><path d="M0 98H45V150H0M555 98H600V150H555" fill="#a7d9be"/>'+slots.map((id,i)=>{const p=id&&get(id),x=50+i*168;return '<g><rect x="'+x+'" y="83" width="162" height="'+(p?24:10)+'" rx="8" fill="'+(p?'#83cbbb':'#e0eceb')+'" stroke="#408b81" stroke-dasharray="'+(p?'0':'6 5')+'"/>'+(p&&p.rail?'<path d="M'+(x+7)+' 82V53H'+(x+155)+'V82M'+(x+80)+' 53V82" stroke="#387d73" fill="none"/>':'')+'<text x="'+(x+81)+'" y="'+(p?128:65)+'" text-anchor="middle" font-size="17" fill="#24554f">'+(p?p.name:'桥位 '+(i+1))+'</text></g>';}).join('')+'<g data-ng-traveler transform="translate(16 28)"><rect width="24" height="22" rx="6" fill="#f1bc63"/><circle cx="5" cy="25" r="4" fill="#456b68"/><circle cx="20" cy="25" r="4" fill="#456b68"/></g></svg><div class="ng-slot-row">'+slots.map((id,i)=>'<button type="button" class="ng-action secondary" data-ng-slot="'+i+'" '+(sim?'disabled':'')+'>第 '+(i+1)+' 段 · '+(id?'更换':'放入')+'</button>').join('')+'</div></div><div class="ng-feedback" role="status" aria-live="polite">'+feedback+'</div><div class="ng-actions">'+button('undo','撤回上一步',true,history.length&&!sim?'':' disabled')+button('simulate',sim?'正在试走…':'让两人试走',false,sim?' disabled':'')+(passed?button('bridge-finish','带着这次协商经验完成'): '')+'</div><p class="ng-muted">试走只检验结构与双方需求，不给个人打分。不合适可以继续商量、换板再试。</p>';
    }
    function conversation(other){
      if(pending)return pending.to===view?'<p>'+names[pending.from]+'问：“'+(pending.kind==='need'?'你过桥时有什么不能忽略的需要？':'你手里的材料各有什么特点？')+'”</p>'+button('answer','把我的实际情况告诉对方',true):'<p>问题已提出，等待'+names[pending.to]+'回答。请切换到对方视角。</p>';
      if(offer)return offer.from===view?'<p>你提出用「'+get(offer.id).name+'」交换。切到对方视角，可以接受，也可以拒绝再商量。</p>'+button('cancel-trade','撤回提议',true):'<p>'+names[offer.from]+'愿意交换「'+get(offer.id).name+'」。先从你的材料箱选一块，再确认互换。</p>'+button('accept-trade','用我选中的材料互换')+button('cancel-trade','暂不交换，继续商量',true);
      return button('ask-need','问对方：你需要什么？',true)+button('ask-stock','问对方：你有什么材料？',true)+'<p class="ng-muted">选中自己的材料后可提出交换，另一视角有权拒绝。</p>'+button('offer','用选中的材料提出交换',true);
    }
    function click(e){if(!active()||sim)return;const b=e.target.closest('button');if(!b||!root.contains(b)||b.disabled)return;
      if(b.hasAttribute('data-ng-preset')){scenario=Number(b.dataset.ngPreset);reset();return;}
      if(b.hasAttribute('data-ng-view')){view=b.dataset.ngView;selected=null;feedback='现在只看'+names[view]+'掌握的线索。';}
      if(b.hasAttribute('data-ng-piece'))selected=b.dataset.ngPiece;
      if(b.hasAttribute('data-ng-slot')){place(Number(b.dataset.ngSlot));return;}
      if(b.hasAttribute('data-ng-ask-need')||b.hasAttribute('data-ng-ask-stock')){pending={from:view,to:view==='a'?'b':'a',kind:b.hasAttribute('data-ng-ask-need')?'need':'stock'};feedback='把问题交给另一位角色，切换后由对方回应。';}
      if(b.hasAttribute('data-ng-answer')&&pending&&pending.to===view){const p=pending; if(p.kind==='need')known[view]=true;feedback=names[view]+'回答：“'+(p.kind==='need'?presets[scenario][view]:pieces.filter(x=>x.owner===view).map(x=>x.name+'：'+x.w+'格宽、承重'+x.load+'、'+x.joint+'口'+(x.rail?'、有护栏':'')+(x.rest?'、可停靠':'')).join('；'))+'”';pending=null;}
      if(b.hasAttribute('data-ng-offer')){if(!selected)feedback='先选中你愿意拿来交换的一块材料。';else{offer={from:view,id:selected};feedback='交换提议已发出，切换视角听听对方的决定。';}}
      if(b.hasAttribute('data-ng-cancel-trade')){offer=null;feedback='暂不交换也可以。重新表达需要，再选别的方案。';}
      if(b.hasAttribute('data-ng-accept-trade')&&offer&&offer.from!==view){if(!selected||get(selected).owner!==view)feedback='请选择当前角色愿意拿出的材料，不必接受不合适的交换。';else{save();get(offer.id).owner=view;get(selected).owner=offer.from;offer=null;selected=null;exchanged=true;feedback='双方各拿出一块材料，交换完成。材料的结构属性没有改变。';}}
      if(b.hasAttribute('data-ng-undo')&&history.length){const h=history.pop();slots=h.slots;pieces.forEach((p,i)=>p.owner=h.owners[i]);exchanged=h.exchanged;offer=h.offer;passed=false;selected=null;feedback='已撤回最近一次放置或交换，可以重新协商。';}
      if(b.hasAttribute('data-ng-simulate')){simulate();return;}
      if(b.hasAttribute('data-ng-bridge-finish')&&passed){passed=false;ctx.complete('你用双视角问答说清了双方需要，协商交换材料，并搭出了符合宽度、承重、连接和安全需求的桥。');return;}
      draw();
    }
    function simulate(){const issues=findings();passed=false;sim=true;simStart=performance.now();feedback='先加载，再沿桥试走。检验的是材料，不是谁做得好不好。';draw();
      const failedSlot=slots.findIndex(id=>!id||get(id).joint!=='圆'||get(id).w<presets[scenario].width||get(id).load<presets[scenario].load);
      function frame(now){if(!active())return;const t=Math.min(1,(now-simStart)/2200), limit=failedSlot<0?1:(failedSlot+.5)/3, x=16+530*Math.min(t,limit);const cart=root.querySelector('[data-ng-traveler]');if(cart)cart.setAttribute('transform','translate('+x+' 28)');if(t<1){raf=requestAnimationFrame(frame);return;}sim=false;passed=issues.length===0;feedback=passed?'试走通过：三段连接相容，宽度和承重足够，也照顾了双方提出的需要。你们不是单纯“听谁的”，而是调整了共同方案。':issues.join('<br>');draw();}
      raf=requestAnimationFrame(frame);
    }
    function drag(e){const b=e.target.closest('[data-ng-piece]');if(!active()||sim||!b){e.preventDefault();return;}selected=b.dataset.ngPiece;if(e.dataTransfer)e.dataTransfer.setData('text/plain',selected);}
    function over(e){if(active()&&!sim&&e.target.closest('[data-ng-slot]'))e.preventDefault();}
    function drop(e){const slot=e.target.closest('[data-ng-slot]');if(!active()||sim||!slot)return;e.preventDefault();const id=e.dataTransfer&&e.dataTransfer.getData('text/plain');if(get(id)&&get(id).owner===view){selected=id;place(Number(slot.dataset.ngSlot));}}
    root.addEventListener('click',click);root.addEventListener('dragstart',drag);root.addEventListener('dragover',over);root.addEventListener('drop',drop);
    ctx.onCleanup(()=>{cancelAnimationFrame(raf);root.removeEventListener('click',click);root.removeEventListener('dragstart',drag);root.removeEventListener('dragover',over);root.removeEventListener('drop',drop);});reset();
  }
  function rhythmRecharge(ctx){
    const {root, active}=setup(ctx,'ng-rhythm');
    let route='slow', reduced=global.matchMedia?global.matchMedia('(prefers-reduced-motion: reduce)').matches:false, stage=-1, state='intro', elapsed=0, last=0, raf=0, paused=false, marks=0, lastTap=-Infinity, lastMove=-Infinity, checkpoints=new Set(), reflection='', reuse='', finished=false;
    const duration=[12000,12000,12000];
    const titles=['睁眼追随光点','找到舒服的拍子','松开肩膀，给身体一点空间'];
    const instructions=()=>stage===0?'保持睁眼，只用舒服的视线追随光点。不想转头就不转；每当新一站亮起，轻点对应的站点，表示你看到了。':stage===1?(route==='slow'?'按缓缓亮起的圆点轻点，可以只动手指，不必追赶。':'跟随稍活泼的圆点轻点，力度轻一点，不必追赶。'):'肩膀轻轻抬起一点，再放回舒服的位置；也可只张开、放松手指。每做完一次，点一下“做完一次”。不拉到疼，不强求幅度。';
    function intro(){state='intro';stage=-1;draw();}
    function draw(){if(!active())return;
      let html='<div class="ng-kicker">觉察节奏 · 自主选择</div><h3 class="ng-title">节奏充电站</h3><p class="ng-copy">不比速度，不排名，也不要求练习后一定更舒服。全程睁眼，自然呼吸，不用刻意深呼吸或屏息。</p>';
      if(state==='intro')html+='<div class="ng-grid"><button type="button" class="ng-card ng-route '+(route==='slow'?'ng-selected':'')+'" data-ng-route="slow" aria-pressed="'+(route==='slow')+'"><strong>慢下来 · 湖面小舟</strong><span>缓缓追光、轻轻点拍、放松肩膀</span></button><button type="button" class="ng-card ng-route '+(route==='up'?'ng-selected':'')+'" data-ng-route="up" aria-pressed="'+(route==='up')+'"><strong>提提神 · 晨光小站</strong><span>明亮追光、舒适点拍、轻柔伸展</span></button></div><p class="ng-copy">三段各至少 12 秒，需要你实际追随、轻点和做动作后确认。随时可暂停；头晕、疼痛或不舒服就停止。不要忍着完成。</p>'+motionControl()+'<div class="ng-actions">'+button('begin','按我舒服的方式开始')+'</div>';
      if(state==='practice')html+='<div class="ng-progress" aria-label="当前练习进度">第 '+(stage+1)+' / 3 段 · '+titles[stage]+'</div><h4>'+titles[stage]+'</h4><p class="ng-copy">'+instructions()+'</p>'+motionControl()+'<div class="ng-scene ng-rhythm-scene" data-ng-cue-scene><div class="ng-cue-track" aria-hidden="true"><i class="ng-moving-cue" data-ng-moving-cue></i></div><div class="ng-stations">'+[0,1,2].map(i=>'<button type="button" data-ng-follow="'+i+'" '+(stage!==0?'hidden':'')+'>站点 '+(i+1)+'</button>').join('')+'</div>'+(stage===1?'<button type="button" class="ng-tap" data-ng-tap>轻点这里</button>':'')+(stage===2?'<div class="ng-stretch-art" aria-hidden="true">'+svg('<circle cx="60" cy="21" r="10"/><path d="M60 33v40M60 43 30 34M60 43l30-9M60 73 42 89M60 73l18 16"/>')+'</div>'+button('move','做完一次轻柔动作',true):'')+'</div><div class="ng-feedback" role="status" data-ng-rhythm-status></div><p class="ng-muted" data-ng-time></p><div class="ng-actions">'+button('pause',paused?'继续练习':'暂停',true)+button('next-segment',stage<2?'进入下一段':'完成三段，看看现在的感觉',false,' disabled')+button('skip','跳过本段并结束本次',true)+button('stop','不舒服，立即停止',true)+'</div><p class="ng-muted">等待不是完成：追光至少看见 3 站；轻点至少 4 次；轻柔动作至少 2 次。没有要求踩准某一拍。</p>';
      if(state==='stopped')html+='<div class="ng-card"><h4>本次已停止，没有记为完成</h4><p>把视线放在身边稳定的物体上，回到舒服的坐姿。需要时告诉老师。你可以不继续。</p></div>'+button('restart','重新选择练习',true);
      if(state==='reflect')html+='<div class="ng-card"><h4>现在和刚开始相比，感觉怎样？</h4><p>没有标准答案。练习不保证改变感受。</p><div class="ng-row">'+['差不多','更舒服一点','没那么舒服'].map(x=>'<button type="button" class="ng-chip" data-ng-reflection="'+x+'" aria-pressed="'+(reflection===x)+'">'+x+'</button>').join('')+'</div>'+(reflection==='没那么舒服'?'<p>先停止动作，回到舒服的姿势；需要时告诉老师。下次可以换成更轻的动作，或不做。</p>':'')+'<h4>挑一个以后愿意用的小休息</h4><div class="ng-row">'+['睁眼看看远处的固定物','轻点几下自己的舒服节奏','轻轻放下肩膀或放松手指'].map(x=>'<button type="button" class="ng-chip" data-ng-reuse="'+x+'" aria-pressed="'+(reuse===x)+'">'+x+'</button>').join('')+'</div></div><div class="ng-actions">'+button('rhythm-finish','带走我的小休息',false,reflection&&reuse?'':' disabled')+'</div>';
      root.innerHTML=html;if(state==='practice')paint();
    }
    function motionControl(){return '<label class="ng-motion"><input type="checkbox" data-ng-reduced '+(reduced?'checked':'')+'> 减少动态：光点按站显示，不连续移动</label>';}
    function target(){return [0,1,2,1][Math.floor(elapsed/2500)%4];}
    function ready(){return elapsed>=duration[stage]&&(stage===0?checkpoints.size>=3:stage===1?marks>=4:marks>=2);}
    function paint(){if(!active()||state!=='practice')return;
      const cue=root.querySelector('[data-ng-moving-cue]');const cycle=route==='slow'?2000:1300;
      if(cue){let x=stage===0?(reduced?target()/2:(1-Math.cos(elapsed/5000*Math.PI))/2):.5;cue.style.left=(8+x*84)+'%';cue.style.opacity=paused?'.35':(stage===1?(elapsed%cycle<450?'1':'.35'):'1');cue.style.transform='translateX(-50%) scale('+(stage===1&&!reduced&&elapsed%cycle<450?'1.18':'1')+')';}
      root.querySelectorAll('[data-ng-follow]').forEach(b=>{const lit=Number(b.dataset.ngFollow)===target();b.classList.toggle('is-lit',lit&&!paused);b.disabled=paused;b.setAttribute('aria-label','站点 '+(Number(b.dataset.ngFollow)+1)+(lit?'，当前亮起':''));});
      const tap=root.querySelector('[data-ng-tap]');if(tap){tap.disabled=paused;tap.classList.toggle('is-lit',!paused&&elapsed%cycle<450);}
      const move=root.querySelector('[data-ng-move]');if(move)move.disabled=paused;
      const text=paused?'已暂停。准备好再继续，暂停时间不计入练习。':stage===0?'已看见 '+checkpoints.size+' / 3 个不同站点。':stage===1?'已轻点 '+marks+' / 4 次；不必踩准拍点。':'已确认 '+marks+' / 2 次轻柔动作。';
      const status=root.querySelector('[data-ng-rhythm-status]');if(status.textContent!==text)status.textContent=text;
      root.querySelector('[data-ng-time]').textContent=elapsed<duration[stage]?'本段还需至少 '+Math.ceil((duration[stage]-elapsed)/1000)+' 秒，按舒服的方式继续。':ready()?'这一段已完成，准备好后再进入下一步。':'时间已足够，完成上面的实际互动即可；也可以随时停止。';
      root.querySelector('[data-ng-next-segment]').disabled=paused||!ready();
    }
    function frame(now){if(!active()||state!=='practice')return;if(!paused){elapsed+=Math.max(0,Math.min(now-last,200));paint();}last=now;raf=requestAnimationFrame(frame);}
    function beginStage(i){cancelAnimationFrame(raf);stage=i;elapsed=0;marks=0;checkpoints=new Set();lastTap=-Infinity;lastMove=-Infinity;paused=false;state='practice';last=performance.now();draw();raf=requestAnimationFrame(frame);}
    function stop(){cancelAnimationFrame(raf);state='stopped';paused=false;draw();}
    function click(e){if(!active()||finished)return;const b=e.target.closest('button');if(!b||!root.contains(b)||b.disabled)return;
      if(b.hasAttribute('data-ng-route')){route=b.dataset.ngRoute;draw();}
      if(b.hasAttribute('data-ng-begin'))beginStage(0);
      if(b.hasAttribute('data-ng-restart'))intro();
      if(state==='practice'){
        if(b.hasAttribute('data-ng-pause')){paused=!paused;last=performance.now();draw();return;}
        if(b.hasAttribute('data-ng-stop')||b.hasAttribute('data-ng-skip')){stop();return;}
        if(paused)return;
        if(b.hasAttribute('data-ng-follow')&&stage===0&&Number(b.dataset.ngFollow)===target())checkpoints.add(target());
        if(b.hasAttribute('data-ng-tap')&&stage===1&&elapsed-lastTap>=500){marks++;lastTap=elapsed;}
        if(b.hasAttribute('data-ng-move')&&stage===2&&elapsed-lastMove>=3000&&elapsed>=2000){marks++;lastMove=elapsed;}
        if(b.hasAttribute('data-ng-next-segment')&&ready()){if(stage<2)beginStage(stage+1);else{cancelAnimationFrame(raf);state='reflect';draw();}return;}paint();
      }
      if(state==='reflect'){
        if(b.hasAttribute('data-ng-reflection')){reflection=b.dataset.ngReflection;draw();}
        if(b.hasAttribute('data-ng-reuse')){reuse=b.dataset.ngReuse;draw();}
        if(b.hasAttribute('data-ng-rhythm-finish')&&reflection&&reuse){finished=true;ctx.complete('你按自己的节奏完成了三段睁眼练习。现在的感觉：'+reflection+'；愿意带走的小休息：'+reuse+'。感受没有标准答案。');}
      }
    }
    function change(e){if(active()&&e.target.matches('[data-ng-reduced]')){reduced=e.target.checked;if(state==='practice')paint();}}
    function visibility(){if(active()&&state==='practice'&&document.hidden){paused=true;draw();}}
    root.addEventListener('click',click);root.addEventListener('change',change);document.addEventListener('visibilitychange',visibility);
    ctx.onCleanup(()=>{cancelAnimationFrame(raf);root.removeEventListener('click',click);root.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility);});intro();
  }
  registry.bridgeTogether={id:'bridgeTogether',title:'默契搭桥',ability:'沟通协商',summary:'切换两位角色，问清需求、交换材料，真正搭好一座桥。',icon:bridgeArt,art:bridgeArt,start:bridgeTogether};
  registry.rhythmRecharge={id:'rhythmRecharge',title:'节奏充电站',ability:'节奏觉察与自主调节',summary:'选择慢下来或提提神，用追光、轻点与轻柔动作找到自己的节奏。',icon:rhythmArt,art:rhythmArt,start:rhythmRecharge};
})(window);
