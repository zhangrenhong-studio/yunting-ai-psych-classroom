/* 小船穿风浪 · self-contained, local-only, 60 seconds of active play. */
(function (global) {
  'use strict';
  var icon = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 35h40L42 48H23zM32 10v25M33 12l15 17H33M8 53q8-7 16 0t16 0 16 0"/></svg>';
  function start(ctx) {
    ctx.board.innerHTML = '<section class="river-game" tabindex="0" aria-label="小船穿风浪游戏" data-river-state="intro"><div class="river-hud"><div><span class="river-eyebrow">河上航行 · 单人</span><strong data-river-clock>00:00 <small>/ 01:00</small></strong></div><div class="river-score"><span>漂流星 <b data-river-score>0</b></span><span>航程 <b data-river-distance>0</b> 米</span></div><button type="button" class="river-icon-button" data-river-pause disabled aria-label="暂停游戏">暂停</button></div><div class="river-progress" aria-hidden="true"><i></i></div><div class="river-viewport"><canvas data-river-canvas aria-label="俯视河道。左右方向键或 A、D 驾驶，空格减速，P 暂停。"></canvas><div class="river-note" data-river-note>看清前方，留一点转向空间</div><div class="river-overlay" data-river-overlay><div class="river-sheet"><span class="river-badge">一趟 60 秒的水上小旅行</span><div class="river-boat-mark">'+icon+'</div><h3>顺着水流，找到自己的航线</h3><p>左右移动鼠标 / 手指掌舵，也可用 ← → 或 A D。<br>按住「减速」或空格，给转弯留点余地。</p><div class="river-legend"><span>✦ 收集漂流星</span><span>◒ 绕过礁石与小岛</span></div><button type="button" class="river-primary" data-river-start>出发，去看一段河流 <span aria-hidden="true">→</span></button><small>没有失败，碰到障碍也能继续。只记录本轮游戏表现。</small></div></div></div><div class="river-controls"><span>宽河道更从容 · 靠岸浅湾水流更稳</span><button type="button" data-river-brake aria-pressed="false">按住减速 <kbd>空格</kbd></button></div></section>';
    var root = ctx.board.querySelector('.river-game'), canvas = root.querySelector('canvas'), g = canvas.getContext('2d');
    var overlay = root.querySelector('[data-river-overlay]'), pauseButton = root.querySelector('[data-river-pause]');
    var clock = root.querySelector('[data-river-clock]'), score = root.querySelector('[data-river-score]'), distanceLabel = root.querySelector('[data-river-distance]'), note = root.querySelector('[data-river-note]');
    var brakeButton = root.querySelector('[data-river-brake]'), progress = root.querySelector('.river-progress i');
    var routeSeed=Math.random()*10000;
    var W = 900, H = 700, dpr = 1, raf = 0, last = 0, dead = false, elapsed = 0, distance = 0, collected = 0, collisions = 0;
    var state = 'intro', boat = {x: .5, vx: 0, shield: 0}, objects = [], particles = [], nextSpawn = 540, keys = {}, target = null, braking = false, wakeTick = 0, completed = false;
    var reduceMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var listeners = [];
    function listen(el, name, fn, opts) { el.addEventListener(name, fn, opts); listeners.push(function () { el.removeEventListener(name, fn, opts); }); }
    function valid() { return !dead && root.isConnected && ctx.isActive(); }
    function random(n) { var v = Math.sin((n+routeSeed) * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
    function bank(z) { return .125 + .022 * Math.sin(z / 460) + .012 * Math.sin(z / 180); }
    function inBay() { return Math.floor(distance / 1050) % 3 === 1 && (boat.x < .27 || boat.x > .73); }
    canvas.riverSnapshot=function(){return {boatX:boat.x,distance:distance,elapsed:elapsed,braking:braking,inBay:inBay(),speed:braking?76:140,worldWidth:W,worldHeight:H,objects:objects.map(function(o){return Object.assign({},o)}),boatY:.76}};
    function snapshot() {
      root.dataset.riverState = state;
      root.dataset.riverElapsed = elapsed.toFixed(1);
      root.dataset.riverCollected = String(collected);
      root.dataset.riverCollisions = String(collisions);
      root.dataset.riverBoatX = boat.x.toFixed(4);
      canvas.dataset.riverState = state;
      canvas.dataset.riverElapsed = elapsed.toFixed(1);
      canvas.dataset.riverCollected = String(collected);
      canvas.dataset.riverCollisions = String(collisions);
      canvas.dataset.riverBoatX = boat.x.toFixed(4);
    }
    function hud() {
      var sec = Math.floor(elapsed);
      clock.innerHTML = String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0') + ' <small>/ 01:00</small>';
      score.textContent = collected;
      distanceLabel.textContent = Math.floor(distance / 10);
      progress.style.width = (elapsed / 60 * 100) + '%';
      var bay = inBay();
      note.textContent = bay ? '浅湾缓流 · 转向更稳' : braking ? '正在减速 · 留出转向的余地' : Math.floor(distance / 1500) % 2 ? '流纹正在偏转 · 小幅修正方向' : '宽处绕行，或穿过窄道拾星';
      note.classList.toggle('is-bay', bay);
      snapshot();
    }
    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      H = 760; W = Math.max(340, H * rect.width / rect.height);
      dpr = Math.min(2, global.devicePixelRatio || 1);
      canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
      draw();
    }
    function path(points, fill) { g.beginPath(); points.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); g.fillStyle = fill; g.fill(); }
    function ellipse(x,y,rx,ry,color) { g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fillStyle=color; g.fill(); }
    function star(x,y,r) { g.beginPath(); for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5, rr=i%2?r*.45:r; var px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;if(i)g.lineTo(px,py);else g.moveTo(px,py);}g.closePath();g.fillStyle='#ffe79a';g.fill();g.strokeStyle='#d99739';g.lineWidth=2;g.stroke(); }
    function tree(x,y,s) { ellipse(x+4*s,y+8*s,16*s,8*s,'rgba(19,60,52,.17)');g.fillStyle='#655d40';g.fillRect(x-2*s,y,4*s,14*s);ellipse(x,y-7*s,15*s,19*s,'#3f7759');ellipse(x-4*s,y-13*s,11*s,13*s,'#65946b');ellipse(x-7*s,y-18*s,5*s,7*s,'#8ba877'); }
    function draw() {
      if(dead || !canvas.width) return;
      g.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
      var bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#479b9a');bg.addColorStop(.55,'#2c7f87');bg.addColorStop(1,'#61aaa0');g.fillStyle=bg;g.fillRect(0,0,W,H);
      // Flow lines are tied to world position, not wall time: paused really means still.
      var startRow=Math.floor((distance-H)/100), endRow=Math.ceil((distance+H)/100);
      for(var r=startRow;r<=endRow;r++) for(var c=0;c<8;c++) {
        var fx=(c+random(r*8+c)) / 8 * W, fy=H*.76-(r*100-distance);
        g.strokeStyle='rgba(195,237,217,.19)';g.lineWidth=1.5;g.beginPath();g.moveTo(fx,fy);g.bezierCurveTo(fx+12,fy+12,fx-8,fy+28,fx+3,fy+44);g.stroke();
      }
      var left=[],right=[];
      for(var y=-30;y<=H+30;y+=20){var z=distance+(H*.76-y);var margin=bank(z)*W;var bay=Math.floor(z/1050)%3===1?W*.035:0;left.push([margin-bay,y]);right.push([W-margin+bay,y]);}
      path([[0,-30]].concat(left,[[0,H+30]]),'#c3c79a');path([[W,-30]].concat(right,[[W,H+30]]),'#c3c79a');
      path([[0,-30]].concat(left.map(function(p){return[p[0]-10,p[1]];}),[[0,H+30]]),'#6f9668');
      path([[W,-30]].concat(right.map(function(p){return[p[0]+10,p[1]];}),[[W,H+30]]),'#6f9668');
      for(var t=Math.floor((distance-H)/82);t<(distance+H)/82;t++){
        var ty=H*.76-(t*82-distance), side=random(t+50)>.5;
        tree(side? W*(.95-random(t)*.05):W*(.03+random(t)*.05),ty,.65+random(t+20)*.5);
        if(t%3===0){var lx=W*(side?.79:.21);ellipse(lx,ty+15,9,4,'#91ba83');ellipse(lx+3,ty+10,4,3,'#efc3bb');}
      }
      objects.forEach(function(o){var x=o.x*W,y=H*.76-(o.z-distance);if(y < -200 || y>H+200)return;
        if(o.type==='star'){ellipse(x,y+4,20,12,'rgba(250,226,139,.11)');star(x,y,12);}
        else if(o.type==='island'){
          ellipse(x+4,y+8,o.rx*W+6,o.ry+6,'rgba(13,64,64,.2)');ellipse(x,y,o.rx*W+5,o.ry+5,'#c8cd9d');ellipse(x,y-3,o.rx*W,o.ry-3,'#7fa275');tree(x,y-12,.85);ellipse(x-9,y+34,12,8,'#9aa38b');
          g.fillStyle='#e0efd7';g.font='12px system-ui';g.textAlign='center';g.fillText(o.x>.5?'宽道 ←':'→ 宽道',x+(o.x>.5?-o.rx*W-34:o.rx*W+34),y-45);
        } else {ellipse(x+3,y+7,o.rx*W+4,16,'rgba(19,65,68,.24)');ellipse(x,y,o.rx*W,o.ry,'#768c88');ellipse(x-4,y-5,o.rx*W*.73,o.ry*.62,'#a7b6a5');g.strokeStyle='rgba(222,247,225,.45)';g.beginPath();g.ellipse(x,y+12,o.rx*W+9,8,0,0,Math.PI);g.stroke();}
      });
      particles.forEach(function(p){g.globalAlpha=p.life/p.max;ellipse(p.x*W,p.y,p.r,p.r*.55,p.color);});g.globalAlpha=1;
      var bx=boat.x*W,by=H*.76;
      g.save();g.translate(bx,by);g.rotate(boat.vx*1.4);
      ellipse(3,9,16,35,'rgba(13,54,63,.25)');
      if(boat.shield>0){g.strokeStyle='rgba(255,239,187,.75)';g.lineWidth=2;g.beginPath();g.ellipse(0,0,24,43,0,0,Math.PI*2);g.stroke();}
      path([[0,-36],[12,-19],[15,19],[8,32],[-8,32],[-15,19],[-12,-19]],'#684e3d');
      path([[0,-31],[9,-17],[11,18],[6,27],[-6,27],[-11,18],[-9,-17]],'#d5a06a');
      g.strokeStyle='#916442';g.lineWidth=2;for(var yy=-14;yy<25;yy+=10){g.beginPath();g.moveTo(-10,yy);g.lineTo(10,yy);g.stroke();}
      g.fillStyle='#f0cf8b';g.fillRect(-10,-7,20,5);g.fillStyle='#4c6d68';g.fillRect(-8,7,16,8);
      g.strokeStyle='#e5bd83';g.lineWidth=3;g.beginPath();g.moveTo(-22,18);g.lineTo(22,-4);g.stroke();g.restore();
      var shade=g.createLinearGradient(0,0,0,130);shade.addColorStop(0,'rgba(17,55,60,.22)');shade.addColorStop(1,'rgba(17,55,60,0)');g.fillStyle=shade;g.fillRect(0,0,W,130);
    }
    function spawn() {
      while(nextSpawn < distance+H+240){
        var n=Math.floor(nextSpawn/240), x=.28+random(n)*.44;
        if(n%5===0){x=n%10===0?.57:.43;objects.push({type:'island',x:x,z:nextSpawn,rx:.1,ry:88});
          var lane=x>.5?.79:.21;for(var j=0;j<4;j++)objects.push({type:'star',x:lane,z:nextSpawn-100+j*65,rx:.025,ry:14});
        }else{
          objects.push({type:'rock',x:x,z:nextSpawn,rx:Math.max(.025,17/W),ry:22});
          objects.push({type:'star',x:x>.5?.31:.69,z:nextSpawn+70,rx:.025,ry:14});
        }
        nextSpawn+=240;
      }
    }
    function burst(x,y,color,count) {for(var i=0;i<count;i++)particles.push({x:x,y:y,vx:(Math.random()-.5)*.1,vy:(Math.random()-.5)*70,r:2+Math.random()*3,life:.7,max:.7,color:color});}
    function hit(direction) {if(boat.shield>0)return;collisions++;boat.shield=1.5;boat.vx=direction*.16;boat.x+=direction*.015;target=null;burst(boat.x,H*.76,'#e8e1bd',9);}
    function update(dt) {
      elapsed=Math.min(60,elapsed+dt);
      var speed=braking||keys[' ']?76:140, bay=inBay(), current=bay?0:Math.sin(distance/270)*(.017+ (Math.floor(distance/1500)%2)*.025);
      distance+=speed*dt;
      var steer=(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0);
      if(steer)target=null;
      var desired=steer*.36;
      if(target!==null)desired=Math.max(-.4,Math.min(.4,(target-boat.x)*4));
      boat.vx+=(desired-boat.vx)*Math.min(1,dt*(bay?10:6));
      boat.x+=(boat.vx+current)*dt;
      boat.shield=Math.max(0,boat.shield-dt);
      var edge=bank(distance)+16/W;
      if(boat.x<edge){boat.x=edge;hit(1);}if(boat.x>1-edge){boat.x=1-edge;hit(-1);}
      spawn();
      objects.forEach(function(o){var dy=o.z-distance,dx=(boat.x-o.x)*W,rx=o.rx*W+(o.type==='star'?12:13),ry=o.ry+27;
        if(!o.taken && dx*dx/(rx*rx)+dy*dy/(ry*ry)<1){
          if(o.type==='star'){o.taken=true;collected++;burst(o.x,H*.76-dy,'#ffe3a0',8);}
          else if(boat.shield<=0){var direction=dx>=0?1:-1;hit(direction);boat.x=Math.max(edge,Math.min(1-edge,o.x+direction*(o.rx+16/W)));}
        }
      });
      objects=objects.filter(function(o){return !o.taken && o.z>distance-H*.3-150;});
      wakeTick+=dt;
      if(wakeTick>.055 && !reduceMotion){wakeTick=0;particles.push({x:boat.x+(Math.random()-.5)*.015,y:H*.76+31,vx:(Math.random()-.5)*.025,vy:65,r:3+Math.random()*3,life:1,max:1,color:'#bbddd1'});}
      particles.forEach(function(p){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;});particles=particles.filter(function(p){return p.life>0;});
      hud();if(elapsed>=60)finish();
    }
    function loop(now) {
      raf=0;
      if(!valid()){dispose();return;}
      if(document.hidden){pause();return;}
      if(state!=='playing')return;
      // Hidden/pause time is excluded. No alternate clocks or fast-forward hooks.
      var dt=last ? Math.max(0,(now-last)/1000):0;last=now;
      // Simulate with small steps so a slow rendering frame cannot tunnel through a rock.
      while(dt>0 && state==='playing'){var step=Math.min(dt,1/60);update(step);dt-=step;}
      draw();if(state==='playing')raf=requestAnimationFrame(loop);
    }
    function run() {if(!valid()||document.hidden)return;state='playing';overlay.hidden=true;pauseButton.disabled=false;pauseButton.textContent='暂停';pauseButton.setAttribute('aria-label','暂停游戏');last=0;hud();root.focus({preventScroll:true});if(!raf)raf=requestAnimationFrame(loop);}
    function reset() {if(!valid())return;cancelAnimationFrame(raf);raf=0;routeSeed=Math.random()*10000;elapsed=0;distance=0;collected=0;collisions=0;boat={x:.5,vx:0,shield:0};objects=[];particles=[];nextSpawn=540;keys={};target=null;completed=false;setBrake(false);spawn();run();}
    function pause() {
      if(state!=='playing')return;
      state='paused';cancelAnimationFrame(raf);raf=0;last=0;keys={};target=null;setBrake(false);pauseButton.textContent='继续';pauseButton.setAttribute('aria-label','继续游戏');
      overlay.innerHTML='<div class="river-sheet"><span class="river-badge">时间也停在这里</span><h3>靠岸歇一会儿</h3><p>暂停不计入 60 秒航行。准备好，再接着出发。</p><button type="button" class="river-primary" data-river-resume>继续航行 →</button></div>';overlay.hidden=false;hud();
    }
    function finish() {
      state='finished';cancelAnimationFrame(raf);raf=0;keys={};setBrake(false);pauseButton.disabled=true;
      overlay.innerHTML='<div class="river-sheet"><span class="river-badge">60 秒航行完成</span><h3>这一段河流，驶过了</h3><div class="river-result"><div><strong>'+collected+'</strong><span>颗漂流星</span></div><div><strong>'+Math.floor(distance/10)+'</strong><span>米航程</span></div><div><strong>'+collisions+'</strong><span>次碰到障碍</span></div></div><p>观察水流，调整方向，也为转弯留一点余地。<br>这些只是本轮游戏记录，不是心理评分。</p><button type="button" class="river-primary" data-river-finish>收好这段航行</button><button type="button" class="river-secondary" data-river-replay>再驶一趟</button></div>';overlay.hidden=false;hud();
    }
    function setBrake(value) {braking=value;brakeButton.setAttribute('aria-pressed',String(value));}
    function pointer(e) {if(state!=='playing')return;var r=canvas.getBoundingClientRect();target=Math.max(.1,Math.min(.9,(e.clientX-r.left)/r.width));}
    listen(canvas,'pointerdown',function(e){if(state!=='playing')return;e.preventDefault();canvas.setPointerCapture(e.pointerId);pointer(e);});
    listen(canvas,'pointermove',function(e){if(e.pointerType==='mouse'||e.buttons)pointer(e);});
    listen(canvas,'pointerup',function(e){if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);});
    listen(canvas,'pointercancel',function(){target=null;});
    listen(brakeButton,'pointerdown',function(e){if(state!=='playing')return;e.preventDefault();brakeButton.setPointerCapture(e.pointerId);setBrake(true);});
    listen(brakeButton,'pointerup',function(){setBrake(false);});listen(brakeButton,'pointercancel',function(){setBrake(false);});
    listen(root,'click',function(e){var b=e.target.closest('button');if(!b||!valid())return;
      if(b.hasAttribute('data-river-start')||b.hasAttribute('data-river-replay'))reset();
      else if(b.hasAttribute('data-river-pause')){if(state==='playing')pause();else if(state==='paused')run();}
      else if(b.hasAttribute('data-river-resume'))run();
      else if(b.hasAttribute('data-river-finish')&&state==='finished'&&elapsed>=60&&!completed){completed=true;dispose();ctx.complete('完成 60 秒「小船穿风浪」航行：收集 '+collected+' 颗漂流星，航行 '+Math.floor(distance/10)+' 米，碰到障碍 '+collisions+' 次。观察水流、调整方向，为转弯留出余地；以上为本轮游戏记录。');}
    });
    listen(global,'keydown',function(e){if(!valid()||!root.contains(document.activeElement))return;var k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowLeft','ArrowRight','a','d',' ','p'].indexOf(k)<0)return;
      if(k==='p'){if(e.repeat)return;e.preventDefault();if(state==='playing')pause();else if(state==='paused')run();return;}
      if(state!=='playing')return;e.preventDefault();keys[k]=true;if(k===' ')setBrake(true);
    });
    listen(global,'keyup',function(e){var k=e.key.length===1?e.key.toLowerCase():e.key;delete keys[k];if(k===' ')setBrake(false);});
    listen(global,'blur',pause);listen(document,'visibilitychange',function(){if(document.hidden)pause();});
    var observer=new ResizeObserver(resize);observer.observe(canvas);
    function dispose(){if(dead)return;dead=true;cancelAnimationFrame(raf);raf=0;observer.disconnect();listeners.forEach(function(off){off();});listeners=[];keys={};particles=[];}
    ctx.onCleanup(dispose);resize();spawn();draw();hud();
  }
  global.YTNewGrowth = global.YTNewGrowth || {};
  global.YTNewGrowth.pressureLab = {id:'pressureLab',title:'小船穿风浪',ability:'观察与节奏调整',summary:'驾驶小船穿过风浪，选择航线，也为自己留一点缓冲。',icon:icon,art:icon,start:start};
global.addEventListener('DOMContentLoaded',function(){if(new URLSearchParams(location.search).get('temporaryTraining')!=='river')return;var tries=0,t=setInterval(function(){if(global.YueYueClass){global.YueYueClass.goto('playground');var button=document.querySelector('[data-game="pressureLab"]');if(button){button.click();clearInterval(t)}}if(++tries>40)clearInterval(t)},100)});
})(window);
