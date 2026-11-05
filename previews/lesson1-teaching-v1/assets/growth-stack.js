/* 稳稳叠高 — one continuous minute, real contact geometry, no score thresholds. */
(function (global) {
  'use strict';
  var icon = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" aria-hidden="true"><path d="M10 51h44M17 50V36h30v14M21 35V21h26v14M26 20V9h22v11"/><path d="M25 42h4m8 0h4M29 27h4m5 0h4M33 14h7"/></svg>';
  var art = '<svg viewBox="0 0 180 130" fill="none" aria-hidden="true"><circle cx="135" cy="30" r="19" fill="#f5d58e"/><path d="M10 111Q90 88 172 111" stroke="#98b49b" stroke-width="14" stroke-linecap="round"/><g stroke="#577b75" stroke-width="2"><rect x="49" y="78" width="80" height="29" rx="4" fill="#f4d6ab"/><rect x="59" y="48" width="71" height="29" rx="4" fill="#b3cfc5"/><rect x="51" y="18" width="65" height="29" rx="4" fill="#eab8aa"/><path d="M45 77h88M55 47h79M47 17h73" stroke="#799b97" stroke-width="5"/><path d="M66 88h11v13H66zM91 88h11v13H91zM72 58h11v12H72zM98 58h11v12H98zM65 27h10v11H65zM90 27h10v11H90z" fill="#fff3ce"/></g></svg>';
  function start(ctx) {
    ctx.board.innerHTML = '<section class="stack-game" tabindex="0" aria-label="稳稳叠高"><header class="stack-hud"><div><span class="stack-eyebrow">云间小屋 · 单人</span><strong data-stack-clock>60 <small>秒</small></strong></div><div class="stack-height">小屋高度 <b data-stack-height>0</b><span> 层</span></div><button type="button" data-stack-pause disabled>暂停</button></header><div class="stack-progress"><i></i></div><div class="stack-viewport"><canvas data-stack-canvas tabindex="0" aria-label="小屋积木在左右移动，点击画面或按空格落下；P 键暂停。"></canvas><div class="stack-note" data-stack-note role="status">等小屋对齐，再轻轻放下</div><div class="stack-overlay" data-stack-overlay><div class="stack-sheet"><span class="stack-badge">给自己一分钟，盖一座小屋</span><div class="stack-mark">'+art+'</div><h3>稳稳叠高</h3><p>等移动的小屋对准下方，点击画面或按空格放下，叠偏了就用下一块调整。</p><button type="button" class="stack-primary" data-stack-start>开始 60 秒</button><small>没有关卡，落空也可以继续。</small></div></div></div><footer class="stack-controls"><span>点击画面 / <kbd>空格</kbd> 放下</span><span>观察 · 等待 · 调整</span></footer></section>';
    var root=ctx.board.querySelector('.stack-game'), canvas=root.querySelector('canvas'), g=canvas.getContext('2d');
    var overlay=root.querySelector('[data-stack-overlay]'), pauseButton=root.querySelector('[data-stack-pause]'), clock=root.querySelector('[data-stack-clock]'), heightLabel=root.querySelector('[data-stack-height]'), note=root.querySelector('[data-stack-note]'), progress=root.querySelector('.stack-progress i');
    var W=600,H=650, camera=500, state='intro', elapsed=0, placed=0, misses=0, perfect=0, moving=null, falling=null, tower=[], particles=[], raf=0,last=0,dead=false,completed=false,seed=0, wobble=0, lean=0, wait=0;
    var listeners=[], colors=['#e9b8a6','#aacbc1','#ead39e','#bfc7dc','#dbbeca'];
    function listen(el,type,fn,opts){el.addEventListener(type,fn,opts);listeners.push(function(){el.removeEventListener(type,fn,opts);});}
    function valid(){return !dead&&root.isConnected&&ctx.isActive();}
    function random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
    function top(){return tower[tower.length-1];}
    function copy(b){return b?{x:b.x,width:b.width,y:b.y,speed:b.speed||0}:null;}
    canvas.stackSnapshot=function(){return {elapsed:elapsed,state:state,moving:copy(moving),top:copy(top()),placed:placed,misses:misses,perfect:perfect,falling:falling?Object.assign(copy(falling),{vy:falling.vy,miss:!!falling.miss}):null,worldWidth:W,worldHeight:H};};
    function hud(){
      clock.innerHTML=Math.ceil(Math.max(0,60-elapsed))+' <small>秒</small>';heightLabel.textContent=placed;progress.style.width=elapsed/60*100+'%';
      [root,canvas].forEach(function(el){el.dataset.stackState=state;el.dataset.stackElapsed=elapsed.toFixed(2);el.dataset.stackPlaced=String(placed);el.dataset.stackMisses=String(misses);});
    }
    function spawn(){
      var width=106+random()*54, speed=(105+random()*38)*(random()>.5?1:-1);
      moving={x:speed>0?24:W-width-24,y:top().y-Math.min(174,Math.max(80,H*.36)),width:width,height:44,speed:speed,phase:random()*6.28,color:colors[Math.floor(random()*colors.length)]};
    }
    function reset(){seed=(Math.random()*4294967295)>>>0;elapsed=placed=misses=perfect=wobble=lean=wait=0;completed=false;particles=[];falling=null;tower=[{x:202,y:0,width:196,height:52,color:'#e9d4ad',base:true}];camera=H*.76;spawn();}
    function resize(){var r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;H=Math.max(500,Math.min(800,W*r.height/r.width));var dpr=Math.min(2,global.devicePixelRatio||1);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);camera=H*.70-top().y;if(moving)moving.y=top().y-Math.min(174,Math.max(80,H*.36));draw();}
    function rounded(x,y,w,h,r,fill){g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=fill;g.fill();}
    function ellipse(x,y,rx,ry,fill){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=fill;g.fill();}
    function block(b,isMoving){
      var y=b.y+camera;if(y>H+100||y< -100)return;
      g.save();g.translate(b.x+b.width/2,y+b.height);var angle=b===top()&&!b.base?lean+Math.sin(wobble*25)*wobble*.055:0;if(b.miss)angle=b.angle||0;g.rotate(angle);
      var squash=b===top()?Math.sin(Math.min(1,wobble)*Math.PI)*.07:0;g.scale(1+squash,1-squash);
      var x=-b.width/2;rounded(x+4,-b.height+6,b.width,b.height,5,'#52746d22');rounded(x,-b.height,b.width,b.height,5,b.color);
      g.fillStyle='#fff7df55';g.fillRect(x+3,-b.height+5,b.width-6,3);
      rounded(x-3,-b.height-3,b.width+6,7,3,b.base?'#a6b394':'#6f9690');
      g.fillStyle='#6c8d8440';g.fillRect(x,-5,b.width,5);
      var windows=Math.max(2,Math.floor(b.width/34));for(var i=0;i<windows;i++){var wx=x+12+i*(b.width-22)/windows;rounded(wx,-b.height+14,15,19,3,'#668b88');rounded(wx+2,-b.height+12,12,18,2,'#fff1c5');g.fillStyle='#d3b788';g.fillRect(wx+7,-b.height+12,1.5,18);g.fillRect(wx+2,-b.height+20,12,1.5);}
      if(b.base){rounded(-13,-30,26,30,10,'#9f8b72');g.fillStyle='#e6c78c';g.fillRect(6,-16,3,3);}
      if(isMoving){g.strokeStyle='#ffffffaa';g.setLineDash([4,5]);g.lineWidth=1;g.strokeRect(x-6,-b.height-9,b.width+12,b.height+16);g.setLineDash([]);}
      g.restore();
    }
    function draw(){if(dead||!canvas.width)return;g.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
      var sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#dbeee9');sky.addColorStop(.62,'#f7edda');sky.addColorStop(1,'#f5dfc5');g.fillStyle=sky;g.fillRect(0,0,W,H);
      ellipse(490,90,34,34,'#f3d390');ellipse(480,80,34,34,'#f9dfa4');
      for(var c=0;c<5;c++){var cx=((c*149+elapsed*2)%760)-80,cy=65+(c%3)*74;ellipse(cx,cy,39,12,'#fffcf4bb');ellipse(cx+16,cy-9,20,18,'#fffcf4bb');ellipse(cx-14,cy-6,18,14,'#fffcf4bb');}
      var horizon=H-75+Math.min(70,(-top().y)*.08);for(var j=0;j<12;j++){var bh=35+(j*29%75);rounded(j*58-20,horizon-bh,47,bh+90,5,j%2?'#c6d6c655':'#b9ccca66');g.fillStyle='#f9f2dc88';for(var k=0;k<3;k++)g.fillRect(j*58-8+k*11,horizon-bh+15,5,8);}
      if(camera<H+140){ellipse(300,camera+75,420,70,'#cad6ae');ellipse(300,camera+96,410,66,'#afc2a3');
        [55,115,488,550].forEach(function(x,i){var y=camera+36+(i%2)*18;rounded(x-3,y-25,6,34,3,'#a38f70');ellipse(x,y-42,23,32,'#8fae91');ellipse(x-7,y-50,15,22,'#adc19b');});
        rounded(185,camera+48,230,12,5,'#aeb596');}
      var t=top();if(moving||falling){g.strokeStyle='#789e8f55';g.lineWidth=2;g.setLineDash([5,7]);g.beginPath();g.moveTo(t.x,t.y+camera-130);g.lineTo(t.x,t.y+camera-7);g.moveTo(t.x+t.width,t.y+camera-130);g.lineTo(t.x+t.width,t.y+camera-7);g.stroke();g.setLineDash([]);}
      tower.forEach(function(b){block(b,false);});if(moving)block(moving,true);if(falling)block(falling,false);
      particles.forEach(function(p){g.globalAlpha=Math.max(0,p.life/.65);ellipse(p.x,p.y+camera,3,2,p.color);});g.globalAlpha=1;
    }
    function drop(){if(!valid()||state!=='playing'||!moving)return;falling=Object.assign({},moving,{vy:25,miss:false,checked:false,angle:0});moving=null;note.textContent='轻轻落下……';canvas.focus({preventScroll:true});}
    function burst(b){for(var i=0;i<15;i++)particles.push({x:b.x+random()*b.width,y:b.y+44,vx:(random()-.5)*130,vy:-20-random()*80,life:.65,color:i%2?'#fff6dc':'#c2aa76'});}
    function update(dt){
      elapsed=Math.min(60,elapsed+dt);wobble=Math.max(0,wobble-dt);camera+=(H*.69-top().y-camera)*Math.min(1,dt*6);
      if(moving){moving.x+=moving.speed*(1+.12*Math.sin(elapsed*1.5+moving.phase))*dt;if(moving.x<18){moving.x=18;moving.speed=Math.abs(moving.speed);}if(moving.x+moving.width>W-18){moving.x=W-18-moving.width;moving.speed=-Math.abs(moving.speed);}}
      if(falling){var b=falling,t=top(),previousBottom=b.y+b.height;b.vy+=1080*dt;b.y+=b.vy*dt;
        if(!b.checked&&previousBottom<=t.y&&b.y+b.height>=t.y){b.checked=true;var left=Math.max(t.x,b.x),right=Math.min(t.x+t.width,b.x+b.width),overlap=Math.max(0,right-left),center=b.x+b.width/2;
          // A resting block needs its centre of mass inside its actual contact interval.
          if(overlap>=16&&center>=left+4&&center<=right-4){b.y=t.y-b.height;var offset=(center-(t.x+t.width/2))/(t.width/2);lean=Math.max(-.05,Math.min(.05,offset*.055));wobble=.85;placed++;var aligned=Math.abs(center-(t.x+t.width/2))<=10;if(aligned)perfect++;tower.push(b);falling=null;burst(b);wait=.24;note.textContent=aligned?'正好对齐，稳稳落下':'接住了！下一块往'+(offset>0?'左':'右')+'一点，找回平衡';}
          else{b.miss=true;misses++;b.spin=(center<t.x+t.width/2?-1:1)*1.2;note.textContent='这块滑落了，下一块再试试';}
        }
        if(falling&&falling.miss){falling.angle+=falling.spin*dt;falling.x+=falling.spin*90*dt;}
        if(falling&&falling.y+camera>H+80){falling=null;wait=.1;}
      }
      if(!moving&&!falling){wait-=dt;if(wait<=0)spawn();}
      particles.forEach(function(p){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;});particles=particles.filter(function(p){return p.life>0;});
      if(elapsed>=60)finish();
    }
    function loop(now){raf=0;if(!valid()){dispose();return;}if(document.hidden){pause();return;}if(state!=='playing')return;var dt=last?Math.max(0,(now-last)/1000):0;last=now;dt=Math.min(dt,60-elapsed);while(dt>0&&state==='playing'){var step=Math.min(dt,1/120);update(step);dt-=step;}hud();draw();if(state==='playing')raf=requestAnimationFrame(loop);}
    function run(){if(!valid()||document.hidden)return;state='playing';overlay.hidden=true;pauseButton.disabled=false;pauseButton.textContent='暂停';pauseButton.setAttribute('aria-label','暂停游戏');last=0;hud();canvas.focus({preventScroll:true});if(!raf)raf=requestAnimationFrame(loop);}
    function pause(){if(state!=='playing')return;state='paused';cancelAnimationFrame(raf);raf=0;last=0;pauseButton.textContent='继续';pauseButton.setAttribute('aria-label','继续游戏');overlay.innerHTML='<div class="stack-sheet"><span class="stack-badge">时间也停在这里</span><h3>小屋等你回来</h3><p>暂停不计入这一分钟。</p><button type="button" class="stack-primary" data-stack-resume>继续盖小屋</button></div>';overlay.hidden=false;hud();}
    function finish(){state='finished';cancelAnimationFrame(raf);raf=0;pauseButton.disabled=true;overlay.innerHTML='<div class="stack-sheet"><span class="stack-badge">60 秒 · 小屋落成</span><h3>这一座，有你的节奏</h3><div class="stack-result"><div><b>'+placed+'</b><span>成功叠放</span></div><div><b>'+perfect+'</b><span>正好对齐</span></div><div><b>'+misses+'</b><span>滑落积木</span></div></div><p>每一块落下，都留下了这次的小小风景。</p><button type="button" class="stack-primary" data-stack-finish>收好这座小屋</button><button type="button" class="stack-secondary" data-stack-replay>再盖一座</button><small>只是本轮游戏记录，不是心理评分。</small></div>';overlay.hidden=false;hud();}
    listen(canvas,'pointerdown',function(e){if(state==='playing'){e.preventDefault();drop();}});
    listen(root,'click',function(e){var b=e.target.closest('button');if(!b||!valid())return;if(b.hasAttribute('data-stack-start')||b.hasAttribute('data-stack-replay')){reset();run();}else if(b.hasAttribute('data-stack-pause')){if(state==='playing')pause();else if(state==='paused')run();}else if(b.hasAttribute('data-stack-resume'))run();else if(b.hasAttribute('data-stack-finish')&&state==='finished'&&elapsed>=60&&!completed){completed=true;var text='完成 60 秒「稳稳叠高」：成功叠放 '+placed+' 块，正好对齐 '+perfect+' 次，滑落 '+misses+' 块。以上仅为本轮游戏记录。';dispose();ctx.complete(text);}});
    listen(global,'keydown',function(e){if(!valid()||!root.contains(document.activeElement)||e.repeat)return;if(e.code==='Space'&&state==='playing'&&document.activeElement.tagName!=='BUTTON'){e.preventDefault();drop();}else if(e.key.toLowerCase()==='p'){e.preventDefault();if(state==='playing')pause();else if(state==='paused')run();}});
    listen(global,'blur',pause);listen(document,'visibilitychange',function(){if(document.hidden)pause();});
    var observer=new ResizeObserver(resize);observer.observe(canvas);
    function dispose(){if(dead)return;dead=true;cancelAnimationFrame(raf);raf=0;observer.disconnect();listeners.forEach(function(off){off();});listeners=[];}
    ctx.onCleanup(dispose);reset();resize();hud();draw();
  }
  global.YTNewGrowth=global.YTNewGrowth||{};
  global.YTNewGrowth.bridgeTogether={id:'bridgeTogether',title:'稳稳叠高',ability:'观察时机与调整',summary:'等小屋对齐，轻轻放下；叠偏了，就用下一块找回平衡。',icon:icon,art:art,start:start};
  function preview(){if(new URLSearchParams(location.search).get('temporaryTraining')!=='stack')return;var tries=0,t=global.setInterval(function(){if(global.YueYueClass){global.YueYueClass.goto('playground');var button=document.querySelector('[data-game="bridgeTogether"]');if(button){global.clearInterval(t);button.click();return;}}if(++tries>=50)global.clearInterval(t);},100);}
  if(document.readyState==='loading')global.addEventListener('DOMContentLoaded',preview,{once:true});else preview();
})(window);
