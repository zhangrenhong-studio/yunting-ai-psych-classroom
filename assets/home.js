/* 学生端：非课堂为个人成长空间；老师开启课堂后由课堂场次状态接管。 */
(function (global) {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }
  function getRecords() { try { return JSON.parse(global.localStorage.getItem('yunting-class-records-v1')) || []; } catch (ignore) { return []; } }
  function setRecords(rows) { try { global.localStorage.setItem('yunting-class-records-v1', JSON.stringify(rows)); } catch (ignore) {} }
  function remember(state) {
    if (!state || !state.courseId || !state.sessionId) { return; }
    var rows = getRecords();
    var index = rows.findIndex(function (x) { return x && x.sessionId === state.sessionId; });
    var snapshot = {
      sessionId: state.sessionId,
      title: state.courseTitle,
      classId: state.classId,
      className: state.className,
      at: state.startedAt || state.createdAt || Date.now(),
      endedAt: state.endedAt || null,
      status: state.status === 'ended' ? '已结束' : (state.status === 'cancelled' ? '已取消' : (state.status === 'waiting' ? '等待开始' : '进行中')),
      expectedStudents: state.expectedStudents,
      actualStudents: state.actualStudents == null ? null : state.actualStudents,
      presenceMode: state.presenceMode || 'not-connected',
      reachedStages: state.reachedStages || []
    };
    if (index >= 0) {
      rows[index] = Object.assign({}, rows[index], snapshot);
      var row = rows.splice(index, 1)[0];
      rows.unshift(row);
    } else {
      rows.unshift(snapshot);
    }
    setRecords(rows.slice(0, 20));
  }
  function openLayer(mount, kind) {
    var body = {
      chat:'<p class="layer-lead">这里是学生自己的对话空间。可以从一句说不上来的话、今天的一件事或一种心情开始。</p><div class="chat-bubble"><b>小悦悦</b><p>我在。现在最想说的一句话是什么？</p></div><textarea class="layer-input" readonly placeholder="平台框架预览：真实 AI 对话、身份权限与持久化将在服务层接入后启用。"></textarea>',
      audio:'<p class="layer-lead">从现在的需要开始，不需要先解释为什么。</p><div class="sound-choices"><button>我有点紧</button><button>我想慢下来</button><button>学习累了</button><button>睡前还在想很多事</button></div><div class="audio-box"><span>给自己一小段时间，慢一点</span><small>现有呼吸引导音频</small><audio controls preload="none" src="assets/audio/05-breath.mp3"></audio></div>',
      wall:'<p class="layer-lead">匿名或公开贴一句想留给同学的话。这里不用于私密求助或希望老师联系的内容。</p><div class="sticky-wall"><article>慢一点也没关系。<small>匿名同学</small></article><article>今天愿意开口，就已经很好了。<small>匿名同学</small></article><article>我也还在慢慢适应。<small>小林</small></article></div><div class="wall-actions"><button class="pill is-on">匿名发布</button><button class="pill">公开发布</button></div><textarea class="layer-input" placeholder="写一句话……"></textarea><button class="cta small">贴到留言墙</button><p class="preview-note">当前为本机交互预览，不代表真实多人发布。</p>',
      records:(function(){var r=getRecords(), html=''; for(var i=0;i<r.length;i++){html+='<article class="record"><b>'+esc(r[i].title)+'</b><span>'+esc(r[i].className)+' · '+new Date(r[i].at).toLocaleDateString('zh-CN')+' · '+esc(r[i].status)+'</span></article>';} return '<p class="layer-lead">这里记录参加过的课堂，不提供课程重放，也不展示完整私密对话。</p>'+(html||'<div class="empty-state">还没有课堂记录。老师开启第一堂课后，会在这里留下记录。</div>');})()
    };
    var title = { chat:'和小悦悦聊聊', audio:'心理成长方案', wall:'留言墙', records:'课堂记录' }[kind];
    var layer=document.createElement('div'); layer.className='layer'; layer.innerHTML='<div class="layer-back" data-close></div><section class="layer-card"><button class="close" data-close>×</button><p class="eyebrow">学生成长空间</p><h2>'+title+'</h2>'+body[kind]+'</section>'; mount.appendChild(layer);
    var close=layer.querySelectorAll('[data-close]'); for(var i=0;i<close.length;i++){close[i].addEventListener('click',function(){layer.remove();});}
  }
  function classroomOverlay(mount, state) {
    var old=mount.querySelector('.classroom-overlay'); if(old){old.remove();}
    if(!state.active||(state.progressMode==='student'&&state.studentCourseCompleted)){return;}
    var el=document.createElement('section'); el.className='classroom-overlay';
    el.innerHTML='<div class="classroom-glow"></div><div class="classroom-call"><p class="eyebrow">'+esc(state.className)+' · 心理成长课进行中</p><h2>'+esc(state.courseTitle)+'</h2><p>老师正在带领大家进入「'+esc({enter:'进入课堂',story:'故事导入',talk:'和小悦悦聊聊',energy:'心理能量补给',playground:'成长训练场',closing:'收束与尾声'}[state.stage]||'课堂')+'」。</p><button class="cta" data-join>进入课堂</button><small>课堂进行中，其他个人功能暂时收起。</small></div>';
    mount.appendChild(el);
    el.querySelector('[data-join]').addEventListener('click',function(){global.location.href='course.html?id='+encodeURIComponent(state.courseId)+'&mode=classroom&session='+encodeURIComponent(state.sessionId);});
  }
  function dailyMessage() {
    var messages=['今天，不用急着证明什么。','你已经在往前走了，哪怕步子很小。','慢一点，也是在照顾自己。','把注意力放回这一刻，就很好。','不确定也没关系，我们可以从一件小事开始。','每一次愿意停下来听听自己，都很重要。','今天的你，也值得被温柔对待。'];
    var day=Math.floor(new Date().setHours(0,0,0,0)/86400000);
    return messages[((day%messages.length)+messages.length)%messages.length];
  }
  function render(mount) {
    var message=dailyMessage();
    mount.innerHTML='<main class="student-home"><header class="home-top"><a href="student.html" class="brand">云听 <span>AI 智慧心理教室</span></a><div><button class="record-link" data-open="records">课堂记录</button><span class="student-pill">七年级 3 班</span></div></header><section class="moment"><div class="moment-copy"><p class="eyebrow">今日的一句话</p><h1>'+message+'</h1><p>你现在想从哪里开始？可以先聊聊，也可以先听一段声音。</p><div class="moment-actions immersive-actions"><button class="immersive-action chat" data-open="chat"><span class="action-kicker">小悦悦在这里</span><b>和小悦悦聊聊</b><span class="action-copy">从今天的一件小事开始说起。</span><span class="action-link">开始聊聊 →</span></button><button class="immersive-action sound" data-open="audio"><span class="action-kicker">给自己一小段时间</span><b>心理成长方案</b><span class="action-copy">听一段声音，让这一刻慢下来。</span><span class="action-link">开始聆听 →</span></button></div></div><img class="home-yue" src="assets/xiaoyueyue-home.jpg" alt="小悦悦"><span class="moment-orbit"></span></section><section class="home-bottom"><button class="daily-entry" data-daily><span class="eyebrow">只属于你的片刻</span><b>每日记录</b><p>写下一天，揉成纸团，收进只有你看得见的瓶子。</p><em>写下今天 →</em></button><button class="wall-entry" data-open="wall"><span class="eyebrow">班级共同表达</span><b>留言墙</b><p>看看同学贴下的便利贴，也可以匿名或公开留一句话。</p><em>去看看 →</em></button><section class="class-history"><span class="eyebrow">课堂记录</span><b>上过的课，会留在这里。</b><p>老师开启课堂后，课程会自动记录；不提供完整回放。</p><button data-open="records">查看记录 →</button></section></section><footer>学生端平台框架预览 · 课堂接管仅在同一浏览器演示状态下可验证</footer></main>';
    var account=document.querySelector('.auth-session-control'),accountHost=mount.querySelector('.home-top>div');if(account&&accountHost)accountHost.appendChild(account);
    var open=mount.querySelectorAll('[data-open]'); for(var i=0;i<open.length;i++){(function(b){b.addEventListener('click',function(){global.location.href='student-space.html?view='+encodeURIComponent(b.getAttribute('data-open'));});})(open[i]);} var daily=mount.querySelector('[data-daily]');if(daily){daily.addEventListener('click',function(){global.location.href='daily-record.html?platform=1';});}
  }
  function boot(){
    var mount=document.getElementById('app');
    if(!mount){return;}
    render(mount);
    /* 独立查看学生首页时，不让同域名下老师端留下的本机课堂状态接管页面。
       正常入口仍保留“有进行中课堂就接管学生端”的演示逻辑。 */
    var homePreview=new URLSearchParams(global.location.search).get('preview')==='home';
    if(homePreview){return;}
    var apply=function(s){remember(s);classroomOverlay(mount,s);};
    apply(global.YTClassroomDemo?global.YTClassroomDemo.read():{});
    if(global.YTClassroomDemo){global.YTClassroomDemo.subscribe(apply);}
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot);}else{boot();}
})(window);
