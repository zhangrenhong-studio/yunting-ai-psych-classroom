/* 节奏星轨 — local-only, one action, sixty active seconds. */
(function (global) {
  'use strict';
  var icon = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="32" cy="34" r="11"/><path d="M10 12l15 15M54 12L39 27M11 54l14-13M53 54L39 41M32 5v10"/><circle cx="10" cy="12" r="4"/><circle cx="54" cy="12" r="4"/><path d="m32 27 2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>';
  function start(ctx) {
    ctx.board.innerHTML = '<section class="starry-game" aria-label="节奏星轨单人游戏"><header class="starry-hud"><div><span class="starry-eyebrow">节奏星轨 · 单人</span><strong data-starry-clock>60 <small>秒</small></strong></div><div class="starry-count">已点亮 <b data-starry-count>0</b><span>颗星</span></div><div class="starry-tools"><button type="button" data-starry-sound aria-pressed="false">声音：关</button><button type="button" data-starry-pause disabled>暂停</button></div></header><div class="starry-progress" aria-hidden="true"><i></i></div><div class="starry-sky"><canvas data-starry-canvas tabindex="0" aria-label="光球到达中央光环时，点击星空或按空格点亮。所有轨道使用同一个操作。"></canvas><div class="starry-caption" data-starry-caption>等光球抵达光环，再轻轻一点</div><div class="starry-overlay" data-starry-overlay><div class="starry-sheet"><span class="starry-badge">一人 · 一分钟 · 一片星空</span><div class="starry-mark">'+icon+'</div><h3>把节拍，连成星座</h3><p>光球到达中央光环时，点击星空或按空格，点亮属于你的星轨。</p><button type="button" class="starry-primary" data-starry-start>开始点亮 <span aria-hidden="true">↗</span></button><small>错过也没关系，跟着下一颗继续。</small></div></div></div><footer class="starry-footer"><span><i></i> 所有轨道，只需同一个动作</span><span>点击星空 <em>/</em> <kbd>空格</kbd></span></footer></section>';
    var root=ctx.board.querySelector('.starry-game'), canvas=root.querySelector('canvas'), g=canvas.getContext('2d');
    var overlay=root.querySelector('[data-starry-overlay]'), pause=root.querySelector('[data-starry-pause]'), sound=root.querySelector('[data-starry-sound]');
    var clock=root.querySelector('[data-starry-clock]'), count=root.querySelector('[data-starry-count]'), caption=root.querySelector('[data-starry-caption]'), progress=root.querySelector('.starry-progress i');
    var state='intro', elapsed=0, hits=0, misses=0, notes=[], last=0, lastTap=-10, raf=0, dead=false, W=800, H=550;
    var enabled=false, audio=null, voices=new Set(), bursts=[], feedbackUntil=0, listeners=[];
    var reduced=global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var WINDOW=.22, DURATION=60, TRAVEL=1.9;
    function listen(el,type,fn,options){el.addEventListener(type,fn,options);listeners.push(function(){el.removeEventListener(type,fn,options);});}
    function active(){return !dead && root.isConnected && ctx.isActive() && !document.hidden;}
    function buildNotes(){
      notes=[];var t=2.3, i=0;
      while(t<59.55){notes.push({id:i,arrival:Number(t.toFixed(3)),hit:false,missed:false,lane:(i*5+Math.floor(i/4))%6,sounded:false});
        var section=Math.floor(t/10), spacing=section%3===0?[1.12,1.12,.84,1.4]:section%3===1?[.72,.72,1.08,.72,1.44]:[.9,.6,.9,1.2];
        t+=spacing[i%spacing.length];i++;
      }
    }
    function snapshot(){
      canvas.dataset.starryState=state;canvas.dataset.starryElapsed=elapsed.toFixed(3);canvas.dataset.starryHits=String(hits);canvas.dataset.starryMisses=String(misses);
      root.dataset.starryState=state;
    }
    Object.defineProperty(canvas,'starrySnapshot',{configurable:true,value:function(){return {elapsed:elapsed,state:state,notes:notes.map(function(n){return {id:n.id,arrival:n.arrival,hit:n.hit,missed:n.missed};}),hits:hits,misses:misses};}});
    function hud(){clock.innerHTML=Math.ceil(Math.max(0,60-elapsed))+' <small>秒</small>';count.textContent=hits;progress.style.width=(elapsed/60*100)+'%';snapshot();}
    function silence(){voices.forEach(function(v){try{v.stop();}catch(e){}});voices.clear();if(audio && audio.state==='running')audio.suspend().catch(function(){});}
    function wakeAudio(){
      if(!enabled)return;
      try{if(!audio){var AC=global.AudioContext||global.webkitAudioContext;if(!AC){enabled=false;sound.textContent='声音不可用';sound.setAttribute('aria-pressed','false');return;}audio=new AC();}
        audio.resume().catch(function(){});
      }catch(e){enabled=false;sound.textContent='声音不可用';sound.setAttribute('aria-pressed','false');}
    }
    function tone(freq,duration,volume){
      if(!enabled || !audio || audio.state!=='running' || state!=='playing')return;
      var o=audio.createOscillator(), gain=audio.createGain(), now=audio.currentTime;o.type='sine';o.frequency.value=freq;
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
      o.connect(gain);gain.connect(audio.destination);voices.add(o);o.onended=function(){voices.delete(o);o.disconnect();gain.disconnect();};o.start(now);o.stop(now+duration+.02);
    }
    function pauseGame(){if(state!=='playing')return;state='paused';pause.textContent='继续';silence();caption.textContent='星空已暂停 · 点「继续」接上节拍';hud();draw();}
    function sync(now){
      if(state!=='playing'){last=now;return;}
      if(!active()){last=now;pauseGame();return;}
      var old=elapsed;elapsed=Math.min(DURATION,elapsed+Math.max(0,(now-last)/1000));last=now;
      notes.forEach(function(n){
        if(!n.sounded && n.arrival<=elapsed){n.sounded=true;if(n.arrival>=old-.06)tone([392,440,523.25,587.33,659.25,783.99][n.lane],.16,.055);}
        if(!n.hit && !n.missed && elapsed>n.arrival+WINDOW){n.missed=true;misses++;}
      });
      bursts=bursts.filter(function(b){return elapsed-b.time<.75;});
      if(elapsed>=DURATION)finishRound();
      hud();
    }
    function tap(event){
      if(event && event.type==='keydown'){if(event.code!=='Space' || event.repeat)return;if(event.target.closest('button,input,textarea,select,a'))return;event.preventDefault();}
      if(state!=='playing' || !active())return;
      sync(performance.now());if(state!=='playing' || elapsed-lastTap<.14)return;lastTap=elapsed;
      var nearest=null, delta=Infinity;notes.forEach(function(n){var d=Math.abs(n.arrival-elapsed);if(!n.hit&&!n.missed&&d<=WINDOW && d<delta){nearest=n;delta=d;}});
      if(nearest){nearest.hit=true;hits++;bursts.push({time:elapsed,lane:nearest.lane});feedbackUntil=elapsed+.65;caption.textContent=hits%8===0?'星座正在展开，继续跟着光走':'点亮了 · 下一颗正向你靠近';tone(1046.5,.21,.025);}
      hud();draw();
    }
    function begin(){
      if(!active())return;elapsed=0;hits=0;misses=0;lastTap=-10;bursts=[];feedbackUntil=0;buildNotes();state='playing';last=performance.now();
      overlay.hidden=true;pause.disabled=false;pause.textContent='暂停';caption.textContent='等光球抵达光环，再轻轻一点';wakeAudio();canvas.focus({preventScroll:true});hud();draw();
    }
    function finishRound(){
      state='finished';pause.disabled=true;silence();
      overlay.innerHTML='<div class="starry-sheet"><span class="starry-badge">60 秒星空旅程 · 已完成</span><div class="starry-mark">'+icon+'</div><h3>这片星空，由你点亮</h3><p>每一次跟上节拍，都留下了一点光。</p><div class="starry-result"><div><b>'+hits+'</b><span>颗已点亮</span></div><div><b>'+misses+'</b><span>颗轻轻掠过</span></div></div><div class="starry-result-actions"><button type="button" data-starry-replay>再玩一次</button><button type="button" class="starry-primary" data-starry-finish>带着星光返回</button></div><small>仅记录本轮命中与错过，不代表能力或心理评分。</small></div>';
      overlay.hidden=false;caption.textContent='你的星座已留在这片夜空';overlay.querySelector('[data-starry-finish]').focus({preventScroll:true});
    }
    function dot(x,y,r,color){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=color;g.fill();}
    function strokeCircle(x,y,r,color,width){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.strokeStyle=color;g.lineWidth=width;g.stroke();}
    function vertex(i){var a=i*2.39996-.9, r=.18+(i%5)*.065;return {x:W*.5+Math.cos(a)*W*r,y:H*.49+Math.sin(a)*H*r};}
    function draw(){
      if(dead||!canvas.width)return;g.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
      var bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#081627');bg.addColorStop(.55,'#0a2c38');bg.addColorStop(1,'#0b1b30');g.fillStyle=bg;g.fillRect(0,0,W,H);
      var cx=W*.5, cy=H*.51, ring=Math.max(30,Math.min(46,Math.min(W,H)*.105)), outer=Math.min(W,H)*.48;
      var nebula=g.createRadialGradient(cx,cy,10,cx,cy,Math.max(W,H)*.65);nebula.addColorStop(0,'#39c5bc17');nebula.addColorStop(.6,'#205d6b0c');nebula.addColorStop(1,'#06142500');g.fillStyle=nebula;g.fillRect(0,0,W,H);
      for(var s=0;s<95;s++){var sx=((Math.sin(s*123.4)+1)*437.7)%1*W, sy=((Math.sin(s*43.8+2)+1)*238.9)%1*H;dot(sx,sy,s%8===0?1.6:.8,s%5===0?'#c8d7b690':'#b3dfed45');}
      var vertices=Math.min(30,hits);g.lineWidth=1;
      for(var v=0;v<vertices;v++){var p=vertex(v);if(v){var prev=vertex(v-1);g.beginPath();g.moveTo(prev.x,prev.y);g.lineTo(p.x,p.y);g.strokeStyle='#e7cd8050';g.stroke();}dot(p.x,p.y,2.4,'#edda9d');dot(p.x,p.y,6,'#edd99c12');}
      for(var lane=0;lane<6;lane++){var angle=-Math.PI/2+lane*Math.PI/3, dx=Math.cos(angle), dy=Math.sin(angle);g.beginPath();g.moveTo(cx+dx*ring,cy+dy*ring);g.lineTo(cx+dx*outer,cy+dy*outer);g.strokeStyle='#83dbe51b';g.lineWidth=1;g.stroke();dot(cx+dx*outer,cy+dy*outer,2,'#85cfd35c');}
      strokeCircle(cx,cy,ring+10,'#8febe419',1);strokeCircle(cx,cy,ring,'#b5f4ecb0',2);dot(cx,cy,ring-6,'#0a2b3b');
      notes.forEach(function(n){if(n.hit||n.missed)return;var until=n.arrival-elapsed;if(until>TRAVEL||until< -WINDOW)return;var a=-Math.PI/2+n.lane*Math.PI/3, r=ring+(outer-ring)*until/TRAVEL, x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
        var near=Math.abs(until)<=WINDOW;g.save();if(!reduced){g.shadowBlur=near?22:13;g.shadowColor=near?'#ffe2a3':'#7ce9ed';}dot(x,y,near?8:6,near?'#ffe7aa':'#93eef0');g.restore();dot(x-1.5,y-1.5,2,'#fff8df');
        if(!reduced){g.beginPath();g.moveTo(x+Math.cos(a)*10,y+Math.sin(a)*10);g.lineTo(x+Math.cos(a)*26,y+Math.sin(a)*26);g.strokeStyle='#95e6e842';g.lineWidth=3;g.stroke();}
      });
      bursts.forEach(function(b){var age=(elapsed-b.time)/.75;g.globalAlpha=(1-age)*.6;strokeCircle(cx,cy,ring+(reduced?4:age*37),'#f4d79c',2);if(!reduced)for(var j=0;j<8;j++){var a=j*Math.PI/4+b.lane;dot(cx+Math.cos(a)*(ring+age*52),cy+Math.sin(a)*(ring+age*52),2*(1-age),'#ffe9b5');}g.globalAlpha=1;});
      g.textAlign='center';g.fillStyle='#daf6ed';g.font='500 '+Math.max(13,ring*.33)+'px system-ui';g.fillText('点亮',cx,cy+5);
      if(state==='playing'&&elapsed>feedbackUntil)caption.textContent=Math.floor(elapsed/10)%3===1?'节拍稍密了，跟着下一颗光':'等光球抵达光环，再轻轻一点';
    }
    function resize(){var r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;W=r.width;H=r.height;var dpr=Math.min(2.5,global.devicePixelRatio||1);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);draw();}
    function frame(now){if(dead)return;sync(now);draw();raf=requestAnimationFrame(frame);}
    listen(root,'click',function(e){
      if(e.target.closest('[data-starry-start],[data-starry-replay]'))begin();
      else if(e.target.closest('[data-starry-pause]')){if(state==='playing'){sync(performance.now());pauseGame();}else if(state==='paused'&&active()){state='playing';last=performance.now();pause.textContent='暂停';caption.textContent='等光球抵达光环，再轻轻一点';wakeAudio();hud();canvas.focus({preventScroll:true});}}
      else if(e.target.closest('[data-starry-sound]')){enabled=!enabled;sound.textContent='声音：'+(enabled?'开':'关');sound.setAttribute('aria-pressed',String(enabled));if(enabled)wakeAudio();else silence();}
      else if(e.target.closest('[data-starry-finish]') && state==='finished'&&!dead){var text='完成了 60 秒节奏星轨，点亮 '+hits+' 颗星，'+misses+' 颗掠过。';dispose();ctx.complete(text);}
    });
    listen(canvas,'pointerdown',function(e){if(e.button!==0)return;e.preventDefault();canvas.focus({preventScroll:true});tap(e);});
    listen(document,'keydown',tap);
    listen(document,'visibilitychange',function(){if(document.hidden)pauseGame();last=performance.now();});
    listen(global,'blur',function(){if(state==='playing'){sync(performance.now());pauseGame();}});
    var observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;if(observer)observer.observe(canvas);listen(global,'resize',resize);
    function dispose(){if(dead)return;dead=true;cancelAnimationFrame(raf);if(observer)observer.disconnect();listeners.forEach(function(fn){fn();});silence();if(audio){audio.close().catch(function(){});audio=null;}state='disposed';snapshot();}
    ctx.onCleanup(dispose);buildNotes();resize();hud();raf=requestAnimationFrame(frame);
  }
  global.YTNewGrowth=global.YTNewGrowth||{};
  global.YTNewGrowth.rhythmRecharge={id:'rhythmRecharge',title:'节奏星轨',ability:'节拍观察与动作协调',summary:'跟随光球，用一次轻点把一分钟的节拍连成星座。',icon:icon,art:icon,start:start};
  function preview(){if(new URLSearchParams(global.location.search).get('temporaryTraining')!=='starry')return;var tries=0,t=global.setInterval(function(){if(global.YueYueClass){global.YueYueClass.goto('playground');var b=document.querySelector('[data-game="rhythmRecharge"]');if(b){b.click();global.clearInterval(t);}}if(++tries>=50)global.clearInterval(t);},120);}
  if(document.readyState==='loading')global.addEventListener('DOMContentLoaded',preview,{once:true});else preview();
})(window);
