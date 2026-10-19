/* ==========================================================================
   云听 AI 智慧心理教室 · 课程引擎
   --------------------------------------------------------------------------
   引擎只认六个环节的名字和流转规则，不认任何一句具体文案。
   所有文案来自课程包（courses/*.js）。

   语法基线压在 ES2017：不用 ?. 和 ??。学校电脑上常见 360 极速模式和老版
   Chromium，遇到不认识的语法会直接白屏，而这里没有构建步骤可以降级。
   ========================================================================== */

(function (global) {
  'use strict';

  var STAGE_ORDER = ['enter', 'story', 'talk', 'energy', 'playground', 'closing'];

  var STAGE_LABEL = {
    enter: '课前准备',
    story: '故事引导',
    talk: 'AI 互动陪伴',
    energy: '音频干预',
    playground: '成长训练',
    closing: '心语留言'
  };

  var TRACK_SETS = {
    green: ['#a7f3d0', '#34d399'],
    blue:  ['#bae6fd', '#38bdf8'],
    pink:  ['#c7d9f7', '#6f9fd2']
  };

  var app = {
    course: null,
    review: true,      // 评审模式：顶部可自由跳转；课堂模式无跳转入口
    teacherPreview: false,
    previewCompletedStage: null,
    stages: [],        // { id, root, activate, deactivate }
    index: 0,
    host: null,
    nav: null
  };

  /* ======================================================================
     工具
     ====================================================================== */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* 模板插值：课程文案是作者写的，学生输入一律经过 esc()。
     引擎里任何回显学生文字的位置都不得绕过这里。 */
  function fill(tpl, vars) {
    return String(tpl == null ? '' : tpl).replace(/\{\{(\w+)\}\}/g, function (m, k) {
      return (vars && vars[k] != null) ? esc(vars[k]) : m;
    });
  }

  function companion(course, cls, line) {
    var cfg = course.companion || {};
    if (!cfg.image) { return ''; }
    return '<aside class="' + esc(cls || 'companion') + '">' +
             '<img src="' + esc(cfg.image) + '" alt="' + esc(cfg.name || '课堂陪伴伙伴') + '">' +
             (line ? '<div class="companion-bubble">' + esc(line) + '</div>' : '') +
           '</aside>';
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (html != null) { n.innerHTML = html; }
    return n;
  }

  function param(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(global.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  }

  function findCourse(id) {
    var reg = global.COURSE_REGISTRY || [];
    for (var i = 0; i < reg.length; i++) {
      if (reg[i].id === id) { return reg[i]; }
    }
    return null;
  }

  function applyTrack(root, trackName) {
    var set = TRACK_SETS[trackName] || TRACK_SETS.green;
    root.style.setProperty('--track-a', set[0]);
    root.style.setProperty('--track-b', set[1]);
  }

  /* ======================================================================
     环节 1 · 进入课堂 —— 门槛
     ====================================================================== */

  function buildEnter(course) {
    var d = course.stages.enter;
    var root = el('section', 'stage');
    root.setAttribute('data-stage', 'enter');

    root.innerHTML =
      '<div class="scene-enter">' +
        '<div class="enter-body stagger">' +
          '<div>' +
            '<h1 class="t-display enter-title">' + esc(d.title) + '</h1>' +
          '</div>' +
          '<p class="t-lead enter-subtitle">请坐舒服，戴好耳机。准备好后，我们就开始。</p>' +
          '<div class="enter-actions">' +
            '<button class="btn btn-primary" data-act="confirm">' +
              esc('准备好了，进入课堂') +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    return {
      root: root,
      activate: function () {},
      deactivate: function () {},
      /* 这个按钮同时是全站音频的解锁手势——
         Chrome 的自动播放策略要求首次 play 发生在用户手势之后。 */
      onConfirm: function (next) {
        root.querySelector('[data-act="confirm"]').addEventListener('click', function () {
          global.YTAudio.unlock();
          if (d.audio) { global.YTAudio.play(d.audio); }
          next();
        });
      }
    };
  }

  /* ======================================================================
     环节 2 · 故事导入 —— 摊开的读本
     ====================================================================== */

  function buildStory(course, onDone) {
    if (global.YTStoryLetter) { return global.YTStoryLetter.build(course, onDone); }
    var d = course.stages.story;
    var beats = d.beats || [];
    var p = d.prompt || {};
    var root = el('section', 'stage');
    root.setAttribute('data-stage', 'story');

    /* 故事一次只呈现一个情境片段：用渐隐渐显推进，而不是让长文本滚动。 */
    root.innerHTML =
      '<div class="scene-story">' +
        '<article class="story-frame" aria-label="故事引导">' +
          '<div class="story-header">' +
            '<p class="t-eyebrow">故事引导</p>' +
            '<p class="story-frame-label">' + esc(d.frameLabel || '') + '</p>' +
          '</div>' +
          '<div class="story-page" data-page>' +
            '<p class="story-scene-label" data-scene></p>' +
            '<p class="story-copy" data-beat></p>' +
          '</div>' +
          '<div class="story-reveal is-hidden" data-reveal>' +
            '<p class="story-question">' + esc(p.text || '') + '</p>' +
            '<div class="note">' +
              '<textarea class="field" rows="3" data-input maxlength="' + (p.maxLen || 120) + '" ' +
                'placeholder="' + esc(p.placeholder || '') + '"></textarea>' +
            '</div>' +
            '<div class="story-actions">' +
              '<button class="btn btn-primary" data-act="submit">写好了，继续</button>' +
            '</div>' +
          '</div>' +
          '<div class="story-nav" data-nav>' +
            '<button class="btn btn-quiet" data-act="prev">上一段</button>' +
            '<span class="story-page-count" data-count></span>' +
            '<button class="btn btn-primary" data-act="next">继续读</button>' +
          '</div>' +
        '</article>' +
      '</div>';

    var page = root.querySelector('[data-page]');
    var scene = root.querySelector('[data-scene]');
    var beat = root.querySelector('[data-beat]');
    var count = root.querySelector('[data-count]');
    var nav = root.querySelector('[data-nav]');
    var prevBtn = root.querySelector('[data-act="prev"]');
    var nextBtn = root.querySelector('[data-act="next"]');
    var reveal = root.querySelector('[data-reveal]');
    var idx = 0;

    function renderPage(turn) {
      var item = beats[idx] || {};
      page.className = 'story-page' + (turn ? ' is-turning' : '');
      scene.textContent = item.scene || '';
      beat.textContent = item.text || '';
      count.textContent = beats.length ? (idx + 1) + ' / ' + beats.length : '';
      prevBtn.disabled = idx === 0;
      nextBtn.textContent = idx === beats.length - 1 ? '读完这一段' : '继续读';
      if (turn) { setTimeout(function () { page.className = 'story-page'; }, 620); }
    }

    function showReflection() {
      page.className = 'story-page is-hidden';
      nav.className = 'story-nav is-hidden';
      reveal.className = 'story-reveal rise';
      var ta = root.querySelector('[data-input]');
      if (ta) { ta.focus(); }
    }

    prevBtn.addEventListener('click', function () {
      if (idx > 0) { idx -= 1; renderPage(true); }
    });
    nextBtn.addEventListener('click', function () {
      if (idx < beats.length - 1) { idx += 1; renderPage(true); }
      else { showReflection(); }
    });
    renderPage(false);
    if (!beats.length) { showReflection(); }

    function submit() {
      var ta = root.querySelector('[data-input]');
      var val = ta ? ta.value : '';
      if (!val.trim()) { if (ta) { ta.focus(); } return; }
      global.YTStore.record({ stage: 'story', nodeId: p.id, prompt: p.text, raw: val });
      onDone();
    }
    root.querySelector('[data-act="submit"]').addEventListener('click', submit);

    return { root: root, activate: function () {}, deactivate: function () {} };
  }

  /* ======================================================================
     环节 3 · 和小悦悦聊聊 —— 私密房间
     ====================================================================== */

  /* A message row, not a second card: only 小悦悦 has an avatar. */
  function appendTalkMessage(log, html, isStudent) {
    var row = el('div', 'talk-message ' + (isStudent ? 'talk-message-student' : 'talk-message-yue'));
    if (!isStudent) {
      var avatar = document.createElement('img');
      avatar.className = 'talk-avatar';
      avatar.src = 'assets/xiaoyueyue-dialogue.jpg';
      avatar.alt = '小悦悦';
      avatar.width = 44;
      avatar.height = 44;
      row.appendChild(avatar);
    }
    row.appendChild(el('div', 'msg ' + (isStudent ? 'msg-me msg-student' : 'msg-yue'), html));
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    return row;
  }

  function buildThemeReflection(course, onDone) {
    var d = course.stages.talk, root = el('section', 'stage');
    root.setAttribute('data-stage', 'talk');
    root.innerHTML = '<div class="scene-talk"><div class="talk-head"><span class="t-small">小悦悦 · 主题表达</span><button type="button" class="btn btn-ghost r99-talk-next" data-reflection-next>下一步</button></div><div class="talk-log" data-log role="log" aria-live="polite" aria-label="主题表达记录"></div><div class="talk-composer" data-composer><div class="composer-row"><textarea class="field" rows="1" maxlength="1200" data-reflection aria-label="写下你的表达"></textarea><div class="r99-talk-actions"><button type="button" class="btn btn-primary" data-save-expression>发送</button></div></div></div></div>';
    var log = root.querySelector('[data-log]');
    appendTalkMessage(log, '当前是主题表达练习，不会生成自动回复。', false);
    appendTalkMessage(log, esc(d.reflectionPrompt || ''), false);
    root.querySelector('[data-save-expression]').onclick = function () {
      var input = root.querySelector('[data-reflection]'), value = input.value.trim();
      if (!value) return;
      global.YTStore.record({stage:'talk',nodeId:'theme-expression',prompt:d.reflectionPrompt,raw:value});
      appendTalkMessage(log, esc(value), true);
      input.value = '';
      root.querySelector('[data-log]').scrollTop = root.querySelector('[data-log]').scrollHeight;
    };
    root.querySelector('[data-reflection]').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.isComposing) {
        e.preventDefault();
        root.querySelector('[data-save-expression]').click();
      }
    });
    var reflectionCompleted = false;
    root.querySelector('[data-reflection-next]').onclick = function () {
      if (reflectionCompleted) { return; }
      reflectionCompleted = true;
      this.disabled = true;
      onDone();
    };
    return {root:root,activate:function(){},deactivate:function(){}};
  }

  function buildTalk(course, onDone) {
    if (course.stages.talk.aiConnected === false) return buildThemeReflection(course, onDone);
    var d = course.stages.talk;
    var nodes = d.nodes || [];
    var counter = global.YTDialogue.makeTurnCounter(d.maxStudentTurns || 6);
    var root = el('section', 'stage');
    root.setAttribute('data-stage', 'talk');

    root.innerHTML =
      '<div class="scene-talk">' +
        '<div class="talk-head">' +
          '<span class="talk-presence-dot" aria-hidden="true"></span>' +
          '<span class="t-small">' + esc(d.presenceLabel || '小悦悦') + '</span>' +
          '<button type="button" class="btn btn-ghost r99-talk-next" data-talk-next>下一步</button>' +
        '</div>' +
        '<div class="talk-log" data-log role="log" aria-live="polite" aria-label="和小悦悦的聊天记录"></div>' +
        '<div class="talk-composer"><div data-composer><div class="composer-row"><textarea class="field" rows="1" maxlength="1200" data-talk-input aria-label="发给小悦悦的消息"></textarea><button type="button" class="btn btn-primary" data-talk-send>发送</button></div></div></div>' +
      '</div>';

    var log = root.querySelector('[data-log]');
    var ta = root.querySelector('[data-talk-input]');
    var send = root.querySelector('[data-talk-send]');
    var answerQueue = [];
    var answerHandler = null;
    var currentNode = null;
    var finishing = false;
    var echo = '';
    var nodeIdx = 0;
    var active = false;
    var completed = false;
    var started = false;
    var pending = [];

    /* Review navigation pauses pending work; completion cancels it altogether. */
    function arm(task) {
      if (task.id !== null || completed) { return; }
      var generation = task.generation = (task.generation || 0) + 1;
      task.startedAt = Date.now();
      task.id = setTimeout(function () {
        if (generation !== task.generation || !active || completed) { return; }
        task.id = null;
        var index = pending.indexOf(task);
        if (index < 0) { return; }
        pending.splice(index, 1);
        task.fn();
      }, task.delay);
    }
    function later(fn, delay) {
      var task = { fn: fn, delay: delay, id: null, startedAt: 0 };
      pending.push(task);
      if (active && !completed) { arm(task); }
    }
    function pauseTimers() {
      active = false;
      pending.forEach(function (task) {
        if (task.id !== null) {
          clearTimeout(task.id);
          task.generation += 1;
          task.id = null;
          task.delay = Math.max(0, task.delay - (Date.now() - task.startedAt));
        }
      });
    }
    function completeTalk() {
      if (completed) { return; }
      pauseTimers();
      pending = [];
      completed = true;
      answerHandler = null;
      answerQueue = [];
      send.disabled = true;
      ta.disabled = true;
      root.querySelector('[data-talk-next]').disabled = true;
      onDone();
    }
    root.querySelector('[data-talk-next]').addEventListener('click', completeTalk);

    /* 取环节 2 的原话，作为「接住表达」的引用来源 */
    var tr = global.YTStore.get().transcript;
    for (var i = 0; i < tr.length; i++) {
      if (tr[i].stage === 'story' && tr[i].raw) { echo = tr[i].raw; }
    }

    function scrollDown() {
      log.scrollTop = log.scrollHeight;
    }

    function say(text, cls) {
      var transcript = global.YTStore.get().transcript || [];
      for (var t = 0; t < transcript.length; t++) {
        if (transcript[t].stage === 'story' && transcript[t].raw) { echo = transcript[t].raw; }
      }
      var isStudent = cls === 'msg-me' || cls === 'msg-student';
      appendTalkMessage(log, isStudent ? esc(text) : fill(text, { storyEcho: echo }), isStudent);
      scrollDown();
    }

    /* The composer is mounted once. Accepted messages are echoed/recorded now,
       while scripted answer handlers consume them in order when ready. */
    function drainAnswers() {
      if (!active || completed || !answerHandler || !answerQueue.length) { return; }
      var handler = answerHandler;
      answerHandler = null;
      handler(answerQueue.shift());
    }
    function submit() {
      if (!active || completed || !ta.value.trim()) { return; }
      var text = ta.value;
      global.YTStore.record({
        stage: 'talk', nodeId: currentNode ? currentNode.id : 'opening',
        prompt: currentNode ? (currentNode.say || []).join('') : (d.opening || []).join(''),
        raw: text
      });
      say(text, 'msg-me');
      ta.value = '';
      answerQueue.push({ skipped: false, text: text });
      drainAnswers();
    }
    send.addEventListener('click', submit);
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.isComposing) {
        e.preventDefault(); submit();
      }
    });

    function runNode() {
      if (!active || completed || finishing) { return; }
      if (nodeIdx >= nodes.length) { finish(); return; }
      var node = nodes[nodeIdx];
      currentNode = node;
      nodeIdx += 1;

      var lines = node.say || [];
      for (var i = 0; i < lines.length; i++) {
        (function (line, k) {
          later(function () { say(line, 'msg-yue'); }, k * 620);
        })(lines[i], i);
      }

      later(function () { presentInput(node); }, lines.length * 620 + 320);
    }

    function presentInput(node) {
      if (!active || completed || finishing) { return; }
      var cfg = node.input;

      /* catch 之类不需要输入的节点：直接往下走 */
      if (!cfg) { runNode(); return; }

      function answered(res) {
        if (!active || completed || answered.used) { return; }
        answered.used = true;
        /* A choice reply is used only for an exact, normalized label match.
           Other free text follows the existing scripted dialogue fallback. */
        if (cfg.type === 'choice') {
          var normalize = function (text) { return String(text || '').normalize('NFKC').trim().toLowerCase(); };
          var options = cfg.options || [];
          for (var i = 0; i < options.length; i++) {
            if (normalize(res.text) === normalize(options[i].label)) {
              res.reply = options[i].reply;
              break;
            }
          }
        }

        /* 选项节点：回复直接来自课程包里的 option.reply */
        if (res.reply) {
          say(res.reply, 'msg-yue');
        } else {
          var r = global.YTDialogue.decide({
            text: res.text,
            skipped: res.skipped,
            branches: node.branches,
            replies: node.replies
          });
          say(r.text, 'msg-yue');
        }

        counter.spend();

        if (counter.exhausted()) { finish(); return; }
        later(runNode, 900);
      }

      answerHandler = answered;
      drainAnswers();
    }

    function finish() {
      if (finishing || completed) { return; }
      finishing = true;
      answerHandler = null;
      var closing = d.closing || [];
      for (var i = 0; i < closing.length; i++) {
        (function (line, k) {
          later(function () { say(line, 'msg-yue'); }, k * 700);
        })(closing[i], i);
      }
      later(completeTalk, closing.length * 700 + 900);
    }

    return {
      root: root,
      activate: function () {
        if (completed || active) { return; }
        active = true;
        pending.forEach(arm);
        drainAnswers();
        if (!started) {
          started = true;
          var opening = d.opening || [];
          for (var i = 0; i < opening.length; i++) {
            (function (line, k) {
              later(function () { say(line, 'msg-yue'); }, k * 620);
            })(opening[i], i);
          }
          later(runNode, opening.length * 620 + 400);
        }
      },
      deactivate: pauseTimers
    };
  }

  /* ======================================================================
     环节 4 · 心理能量补给 —— 音频引导的单焦点舞台
     ====================================================================== */

  function buildEnergy(course, onDone) {
    var d = course.stages.energy || {}, track = d.track || {};
    var root = el('section', 'stage');
    root.setAttribute('data-stage', 'energy');
    var src = track.src || '';
    if (src && !/^(https?:|data:|\/)/.test(src)) src = ((course.audio && course.audio.basePath) || '') + src;
    var demoAllowed = app.teacherPreview && app.review;
    var companion = d.companionVideo || {};
    var videoMarkup = companion.src ? '<video class="energy-companion-video" data-companion-video src="' + esc(companion.src) + '" poster="' + esc(companion.poster || '') + '" muted playsinline loop preload="metadata" disablepictureinpicture aria-label="云朵陪伴听音乐"></video>' + (companion.poster ? '<img class="energy-video-fallback" data-video-fallback src="' + esc(companion.poster) + '" alt="云朵陪伴画面" hidden>' : '') : '';
    root.innerHTML = '<div class="scene-energy">' +
      (demoAllowed ? '<button type="button" class="btn btn-ghost energy-demo-next" data-energy-demo-next aria-label="下一步（仅老师演示）">下一步</button>' : '') +
      '<p class="energy-positive-copy">让音乐陪你放松片刻，也记得温柔地照顾自己。<span class="energy-phrase">慢慢来</span>，每一次小小的调整，都在积蓄成长的力量。</p>' +
      '<div class="energy-visual" aria-label="云朵陪伴画面">' + videoMarkup + '</div>' +
      '<section class="energy-player" aria-label="音乐播放器"><div class="energy-player-main">' +
      '<div class="energy-track-info"><h2 class="t-title" data-audio-title>' + esc(track.title || '心理能量成长训练') + '</h2><p class="energy-status" data-status role="status" aria-live="polite"></p></div>' +
      '<div class="energy-transport"><div class="energy-control-row"><button type="button" class="energy-play" data-play ' + (src ? '' : 'disabled') + '>' + (src ? '▶ 播放音乐' : '音频待配置') + '</button></div>' +
      '<div class="energy-timeline"><span data-current>00:00</span><div class="energy-progress" role="progressbar" aria-label="音频播放进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-progressbar><i data-progress></i></div><span data-duration>' + esc(src ? (track.durationLabel || '--:--') : '--:--') + '</span></div></div>' +
      '<div class="energy-side-controls"><label class="energy-volume"><span class="energy-volume-label">音量</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg><input type="range" min="0" max="1" step="0.05" value="0.8" data-volume aria-label="音量" style="--volume-fill:80%" ' + (src ? '' : 'disabled') + '></label></div></div>' +
      '<div class="energy-actions"><button type="button" class="btn btn-primary" data-finish disabled>听完了，继续</button></div>' +
      '</section>' + (src ? '<audio preload="metadata" src="' + esc(src) + '" data-audio></audio>' : '') + '</div>';
    var audio = root.querySelector('[data-audio]'), play = root.querySelector('[data-play]');
    var finish = root.querySelector('[data-finish]'), demoNext = root.querySelector('[data-energy-demo-next]');
    var volume = root.querySelector('[data-volume]'), bar = root.querySelector('[data-progress]');
    var current = root.querySelector('[data-current]'), duration = root.querySelector('[data-duration]');
    var status = root.querySelector('[data-status]'), progressbar = root.querySelector('[data-progressbar]');
    var active = false, classPaused = false, failed = false, completed = false, listenedToEnd = false, hadPlayback = false, playEpoch = 0;
    var companionVideo = root.querySelector('[data-companion-video]'), videoFallback = root.querySelector('[data-video-fallback]');
    var videoUnavailable = false, videoPending = false, videoEpoch = 0;
    if (companionVideo) { companionVideo.muted = true; companionVideo.defaultMuted = true; companionVideo.loop = true; }
    function syncCompanion() {
      if (!companionVideo) return;
      if (videoUnavailable) {
        if (videoFallback) { var runFallback = active && !classPaused && !completed && !document.hidden && audio && !audio.paused && !audio.ended && !failed; var fallbackSrc = runFallback && companion.animatedFallback ? companion.animatedFallback : companion.poster; if (fallbackSrc && videoFallback.getAttribute('src') !== fallbackSrc) videoFallback.src = fallbackSrc; }
        return;
      }
      companionVideo.muted = true;
      if (!active || classPaused || completed || document.hidden || !audio || audio.paused || audio.ended || failed) {
        videoEpoch++; videoPending = false; companionVideo.pause(); return;
      }
      if (!companionVideo.paused || videoPending) return;
      var token = ++videoEpoch; videoPending = true;
      var promise = companionVideo.play();
      if (promise && promise.then) promise.then(function(){
        if (token !== videoEpoch) { if (!active || classPaused || !audio || audio.paused) companionVideo.pause(); return; }
        videoPending = false;
        if (!active || classPaused || completed || document.hidden || audio.paused || audio.ended) companionVideo.pause();
      }).catch(function(){ if (token === videoEpoch) videoPending = false; });
    }

    function clock(sec) {
      if (!isFinite(sec)) return '--:--';
      var n = Math.max(0, Math.floor(sec));
      return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
    }
    // Reconcile from the real media state on every relevant event and re-entry.
    // Do not depend on one delivery of "ended" or on the rounded on-screen clock.
    function sync() {
      if (audio) {
        var finite = Number.isFinite(audio.duration) && audio.duration > 0;
        if (audio.ended || (hadPlayback && finite && !audio.seeking && audio.currentTime >= audio.duration)) listenedToEnd = true;
        current.textContent = clock(audio.currentTime);
        if (finite) duration.textContent = clock(audio.duration);
        var percent = finite ? Math.min(100, audio.currentTime / audio.duration * 100) : 0;
        bar.style.width = percent + '%';
        progressbar.setAttribute('aria-valuenow', String(Math.round(percent)));
        play.disabled = classPaused || completed;
        if (failed) { play.textContent = '重新加载'; status.textContent = '音频暂时无法播放，请重试。'; }
        else if (!audio.paused && !audio.ended) { play.textContent = 'Ⅱ 暂停'; status.textContent = '正在播放'; }
        else if (listenedToEnd && (audio.ended || (finite && audio.currentTime >= audio.duration))) { play.textContent = '↻ 再听一遍'; status.textContent = '播放完成'; }
        else if (audio.currentTime > 0) { play.textContent = '▶ 继续播放'; status.textContent = '已暂停'; }
        else { play.textContent = '▶ 播放音乐'; status.textContent = ''; }
      } else status.textContent = '音频待配置';
      finish.disabled = !audio || !listenedToEnd || classPaused || completed;
      if (demoNext) demoNext.disabled = classPaused || completed;
      play.dataset.playState = failed ? 'retry' : (audio && !audio.paused && !audio.ended ? 'playing' : (audio && audio.ended ? 'replay' : 'paused'));
      play.setAttribute('aria-label', play.textContent.replace(/^[▶Ⅱ↻\s]+/, ''));
      play.title = play.getAttribute('aria-label');
      syncCompanion();
    }
    function complete(demo) {
      sync();
      if (!active || classPaused || completed || (!demo && !listenedToEnd)) return;
      completed = true; playEpoch++;
      if (audio) audio.pause();
      global.YTStore.record({ stage:'energy', nodeId:track.id || 'music', prompt:'心理能量成长训练', raw:demo ? '老师演示：通过下一步进入下一环节，未计为音频听完' : '音乐播放完成' });
      sync(); onDone();
    }
    if (audio) {
      audio.volume = 0.8;
      ['loadedmetadata','durationchange','timeupdate','pause','seeked','canplay'].forEach(function(name){ audio.addEventListener(name, sync); });
      audio.addEventListener('playing', function(){ hadPlayback = true; failed = false; sync(); });
      audio.addEventListener('ended', function(){ listenedToEnd = true; sync(); });
      audio.addEventListener('error', function(){ failed = true; sync(); });
      play.addEventListener('click', function(){
        if (!active || classPaused || completed) return;
        var token = ++playEpoch;
        global.YTAudio.stopAll();
        if (!audio.paused && !failed) { audio.pause(); sync(); return; }
        if (failed) { failed = false; audio.load(); }
        if (audio.ended) { audio.currentTime = 0; if (companionVideo && !videoUnavailable) companionVideo.currentTime = 0; }
        var promise = audio.play();
        if (promise && promise.then) promise.then(function(){
          if (!active || classPaused || token !== playEpoch) { if (!active || classPaused) audio.pause(); return; }
          sync();
        }).catch(function(error){
          if (token !== playEpoch || !active || classPaused) return;
          sync(); if (error && error.name !== 'AbortError' && !failed) status.textContent = '请再次点击播放';
        });
      });
      volume.addEventListener('input', function(){ audio.volume = Number(volume.value); volume.style.setProperty('--volume-fill', Math.round(Number(volume.value) * 100) + '%'); });
    }
    if (companionVideo) {
      companionVideo.addEventListener('loadeddata', function(){
        if (companion.transparent) {
          try {
            var probeCanvas = document.createElement('canvas'); probeCanvas.width = probeCanvas.height = 8;
            var ctx = probeCanvas.getContext('2d', {willReadFrequently:true}); ctx.drawImage(companionVideo,0,0,8,8);
            if (ctx.getImageData(0,0,1,1).data[3] > 10) { videoUnavailable = true; companionVideo.pause(); companionVideo.hidden = true; if (videoFallback) videoFallback.hidden = false; syncCompanion(); return; }
          } catch(ignore) {}
        }
        syncCompanion();
      });
      companionVideo.addEventListener('error', function(){ videoUnavailable = true; companionVideo.pause(); companionVideo.hidden = true; if (videoFallback) videoFallback.hidden = false; syncCompanion(); });
    }
    finish.addEventListener('click', function(){ complete(false); });
    if (demoNext) demoNext.addEventListener('click', function(){ complete(true); });
    document.addEventListener('visibilitychange', function(){ if (active) { if (document.hidden) syncCompanion(); else sync(); } });
    var energyDock = root.querySelector('.energy-player'), energyCanvas = root.querySelector('.scene-energy'), positiveCopy = root.querySelector('.energy-positive-copy');
    function measureDock(){ var h = energyDock.getBoundingClientRect().height; if (h > 0) energyCanvas.style.setProperty('--energy-dock-height', Math.ceil(h) + 'px'); var copyHeight = positiveCopy ? positiveCopy.getBoundingClientRect().height : 0; energyCanvas.style.setProperty('--energy-copy-height', Math.ceil(copyHeight) + 'px'); }
    if (global.ResizeObserver) { var energyObserver = new global.ResizeObserver(measureDock); energyObserver.observe(energyDock); if (positiveCopy) energyObserver.observe(positiveCopy); }
    global.addEventListener('resize', measureDock);
    measureDock();
    sync();
    return {
      root: root,
      activate: function(){ active = true; completed = false; measureDock(); sync(); },
      deactivate: function(){ active = false; playEpoch++; if (audio) audio.pause(); sync(); },
      setPaused: function(value){ classPaused = !!value; if (classPaused) { playEpoch++; if (audio) audio.pause(); } sync(); }
    };
  }

  /* ======================================================================
     环节 5 · 成长训练场 —— 可选择、可操作的能力练习
     ====================================================================== */

  function buildPlayground(course, onDone) {
    var d = course.stages.playground || {};
    var root = el('section', 'stage');
    root.setAttribute('data-stage', 'playground');
    root.innerHTML =
      '<div class="scene-playground">' +
        '<header class="playground-title">' +
          '<h2 class="t-title">成长训练</h2><p class="r109-growth-intro">每一次小练习，都在积累成长的力量。</p>' +
        '</header>' +
        '<div class="playground-board" data-games></div>' +
      '</div>';
    var started = false;
    return {
      root: root,
      activate: function () {
        if (started) { return; }
        started = true;
        var mount = root.querySelector('[data-games]');
        if (!global.YTGrowthGames) {
          mount.innerHTML = '<p class="t-body">训练项目暂时没有加载成功。</p>';
          return;
        }
        global.YTGrowthGames.mount(mount, {
          appIds: d.appIds,
          onGameComplete: function (app) {
            global.YTStore.record({ stage:'playground', nodeId:app.id, prompt:'选择的训练项目', raw:app.title });
          },
          onStageComplete: function () { onDone(); }
        });
      },
      deactivate: function () {}
    };
  }

  /* ======================================================================
     环节 6 · 情绪收束与尾声 —— 光谱
     ====================================================================== */

  function buildClosing(course, onDone) {
    var d = course.stages.closing;
    var colors = d.colors || [];
    var outlets = [{ id: 'teacher', label: '留给老师', hint: ((d.outlets || []).filter(function (x) { return x.id === 'teacher'; })[0] || {}).hint || '有一件事，我希望有机会和老师说说……', shared: true }];
    var root = el('section', 'stage');
    root.setAttribute('data-stage', 'closing');

    var swatches = '';
    var labels = '';
    for (var i = 0; i < colors.length; i++) {
      swatches += '<button class="swatch" data-color="' + esc(colors[i].id) + '" ' +
                  'style="background:' + esc(colors[i].hex) + '" ' +
                  'aria-label="' + esc(colors[i].label) + '"></button>';
      labels += '<span data-label="' + esc(colors[i].id) + '">' + esc(colors[i].label) + '</span>';
    }

    var outletHtml = '';
    for (var j = 0; j < outlets.length; j++) {
      outletHtml += '<button class="outlet" data-outlet="' + esc(outlets[j].id) + '">' +
                    esc(outlets[j].label) + '</button>';
    }

    var endingHtml = '';
    for (var k = 0; k < (d.ending || []).length; k++) {
      endingHtml += '<p>' + esc(d.ending[k]) + '</p>';
    }

    root.innerHTML =
      '<div class="scene-closing">' +
        '<div class="dye" data-dye></div>' +
        '<div class="closing-body">' +

          '<div class="closing-step stack-5" data-step="color">' +
            '<h2 class="t-title">' + esc(d.colorsPrompt || '') + '</h2>' +
            '<div class="spectrum">' + swatches + '</div>' +
            '<div class="spectrum-labels">' + labels + '</div>' +
            '<p class="r112-color-purpose"><span>选一个贴近此刻心情的颜色，</span><span>给今天的自己留个记录。</span><br>颜色没有好坏，也没有标准答案。</p>' +
            '<p class="picked-meaning" data-meaning></p>' +
            '<button class="btn btn-ghost" data-act="skip-color">这次先不选</button>' +
          '</div>' +

          '<div class="closing-step stack-5 is-hidden" data-step="leave">' +
            '<h2 class="t-title">' + esc('最后，想留下点什么吗？') + '</h2>' +
            '<div class="row gap-4 wrap r99-closing-choices" style="justify-content:center" data-leave-choices><button class="btn btn-primary" data-act="write-teacher">留言给老师</button><button class="btn btn-ghost" data-act="exit-now">这次先退出</button></div>' +
            '<div class="stack-3" data-write hidden>' +
              '<p class="t-body" data-hint></p>' +
              '<div class="note">' +
                '<textarea class="field" rows="3" data-text maxlength="200" aria-label="给老师的留言"></textarea>' +
              '</div>' +
              '<div class="row gap-4 wrap">' +
                '<button class="btn btn-primary" data-act="keep">提交留言并结束</button>' +
                '<button type="button" class="btn btn-ghost" data-act="cancel-message">取消留言</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="closing-step stack-6 is-hidden" data-step="end">' +
            '<div class="ending"><h2 class="t-title">本堂课已结束</h2></div>' +
            (app.teacherPreview ? '<button class="btn btn-quiet" data-act="close-preview">关闭预览</button>' : '') +
          '</div>' +

        '</div>' +
      '</div>';

    var dye = root.querySelector('[data-dye]');
    var meaning = root.querySelector('[data-meaning]');
    var stepColor = root.querySelector('[data-step="color"]');
    var stepLeave = root.querySelector('[data-step="leave"]');
    var stepEnd = root.querySelector('[data-step="end"]');
    var write = root.querySelector('[data-write]');
    var hint = root.querySelector('[data-hint]');
    var ta = root.querySelector('[data-text]');
    var currentOutlet = outlets[0];
    hint.textContent = currentOutlet.hint;

    function colorById(id) {
      for (var i = 0; i < colors.length; i++) { if (colors[i].id === id) { return colors[i]; } }
      return null;
    }
    function outletById(id) {
      for (var i = 0; i < outlets.length; i++) { if (outlets[i].id === id) { return outlets[i]; } }
      return null;
    }

    /* --- 第一步：选色 --- */
    function pickColor(id) {
      var c = colorById(id);
      if (!c) { return; }
      global.YTStore.get().pickedColor = c.id;
      global.YTStore.get().pickedColorLabel = c.label;
      global.YTStore.commit();
      dye.style.background = 'radial-gradient(60% 60% at 50% 45%, ' + c.hex + ' 0%, transparent 72%)';
      dye.className = 'dye is-on';
      meaning.textContent = c.meaning;

      var sw = root.querySelectorAll('.swatch');
      for (var i = 0; i < sw.length; i++) {
        sw[i].className = (sw[i].getAttribute('data-color') === id) ? 'swatch is-picked' : 'swatch';
      }
      var lb = root.querySelectorAll('[data-label]');
      for (var j = 0; j < lb.length; j++) {
        lb[j].className = (lb[j].getAttribute('data-label') === id) ? 'is-picked' : '';
      }
    }

    var swatchEls = root.querySelectorAll('.swatch');
    for (var s = 0; s < swatchEls.length; s++) {
      (function (b) {
        b.addEventListener('click', function () {
          pickColor(b.getAttribute('data-color'));
          setTimeout(toLeave, 900);
        });
      })(swatchEls[s]);
    }

    root.querySelector('[data-act="skip-color"]').addEventListener('click', function () {
      global.YTStore.recordSkip({ stage: 'closing', nodeId: 'color', prompt: d.colorsPrompt });
      toLeave();
    });

    function toLeave() {
      stepColor.className = 'closing-step stack-5 is-hidden';
      stepLeave.className = 'closing-step stack-5 rise';
    }

    function keepClick() {
      if (app.courseCompleted) { return; }
      var v = ta.value;
      if (!v.trim()) { toEnd(); return; }
      global.YTStore.get().pickedOutlet = 'teacher';
      global.YTStore.get().pickedOutletLabel = '留给老师';
      if (v.trim()) {
        global.YTStore.record({
          stage: 'closing',
          nodeId: currentOutlet ? currentOutlet.id : 'leave',
          prompt: currentOutlet ? currentOutlet.hint : '',
          raw: v
        });
        if (!app.teacherPreview && currentOutlet && currentOutlet.id === 'teacher' && global.YTSupportFlow) {
          global.YTSupportFlow.create({ text: v, source: '课程收束 · 想让老师知道', courseTitle: course.title || '' });
        }
      }
      toEnd();
    }

    root.querySelector('[data-act="keep"]').addEventListener('click', keepClick);
    root.querySelector('[data-act="write-teacher"]').addEventListener('click', function(){write.hidden=false;root.querySelector('[data-leave-choices]').style.display='none';ta.focus();});
    root.querySelector('[data-act="cancel-message"]').addEventListener('click', function () {
      write.hidden = true;
      root.querySelector('[data-leave-choices]').style.display = '';
      root.querySelector('[data-act="write-teacher"]').focus();
    });
    root.querySelector('[data-act="exit-now"]').addEventListener('click', function(){toEnd();});
    function toEnd() {
      stepLeave.className = 'closing-step stack-5 is-hidden';
      stepEnd.className = 'closing-step stack-6 rise';
      if (d.audio) { global.YTAudio.play(d.audio); }
      global.YTStore.get().finishedAt = new Date().toISOString();
      global.YTStore.commit();
      onDone();
    }

    var closePreview = root.querySelector('[data-act="close-preview"]');
    if (closePreview) { closePreview.addEventListener('click', function () {
      if (global.parent !== global) {
        try {
          var parentDoc = global.parent.document;
          var expand = parentDoc.getElementById('previewExpand');
          if (parentDoc.body.classList.contains('preview-open') && expand) { expand.click(); }
          var toggle = parentDoc.getElementById('previewToggle');
          if (toggle && toggle.getAttribute('aria-expanded') !== 'false') { toggle.click(); return; }
        } catch (ignore) {}
        global.parent.postMessage({ type: 'yunting:close-preview' }, global.location.origin);
      }
      else { global.close(); if (!global.closed) { global.location.replace('teacher.html'); } }
    }); }

    return { root: root, activate: function () {}, deactivate: function () {} };
  }

  /* ======================================================================
     环节流转
     ====================================================================== */

  function goTo(idx, silent) {
    if (idx < 0 || idx >= app.stages.length) { return; }
    var prev = app.stages[app.index];
    if (prev && prev !== app.stages[idx] && prev.deactivate) { prev.deactivate(); }

    app.index = idx;

    for (var i = 0; i < app.stages.length; i++) {
      var s = app.stages[i];
      s.root.classList.toggle('is-active', i === idx);
    }

    applyTrack(document.body, (app.course.tracks || {})[STAGE_ORDER[idx]] || 'green');

    var cur = app.stages[idx];
    if (cur.activate) { cur.activate(); }

    if (app.nav) {
      var btns = app.nav.querySelectorAll('[data-goto]');
      for (var j = 0; j < btns.length; j++) {
        var on = parseInt(btns[j].getAttribute('data-goto'), 10) === idx;
        btns[j].className = on ? 'nav-btn is-on' : 'nav-btn';
        btns[j].setAttribute('aria-current', on ? 'step' : 'false');
      }
      var currentLabel = app.nav.querySelector('[data-current-label]');
      var currentCount = app.nav.querySelector('[data-current-count]');
      if (currentLabel) { currentLabel.textContent = STAGE_LABEL[STAGE_ORDER[idx]]; }
      if (currentCount) { currentCount.textContent = (idx + 1) + ' / ' + STAGE_ORDER.length; }
      app.nav.className = 'review-nav';
      var flowToggle = app.nav.querySelector('[data-act="flow"]');
      if (flowToggle) {
        flowToggle.setAttribute('aria-expanded', 'false');
        flowToggle.textContent = '查看完整流程';
      }
    }

    global.YTStore.saveProgress(STAGE_ORDER[idx]);
    global.scrollTo(0, 0);
  }

  function next() { goTo(app.index + 1); }

  /* 课堂模式下记录学生当前环节的个人任务。统一控制模式完成后等待老师推进；
     自主探索模式完成后自行进入下一环节，完成整课后自动退出课堂。 */
  function completeCurrentStage() {
    if (STAGE_ORDER[app.index] === 'closing') {
      app.courseCompleted = true;
      setClassroomGate(null);
      if (app.teacherPreview) { return; }
      if (!app.review && global.YTClassroomDemo) {
        var completedSession = global.YTClassroomDemo.read();
        completedSession.studentProgress = completedSession.studentProgress || {};
        completedSession.studentProgress.closing = { status: 'completed', completedAt: Date.now() };
        completedSession.studentStage = 'closing';
        completedSession.studentCourseCompleted = true;
        completedSession.studentExitedAt = Date.now();
        completedSession.reachedStages = Array.from(new Set((completedSession.reachedStages || []).concat('closing')));
        global.YTClassroomDemo.write(completedSession);
      }
      global.location.replace('student.html?classroomCompleted=1');
      return;
    }
    if (app.teacherPreview) {
      if (app.review || param('layoutPreview') === '99') {
        app.previewCompletedStage = null;
        goTo(app.index + 1, true);
        setClassroomGate(null);
        return;
      }
      var previewSession = global.YTClassroomDemo && global.YTClassroomDemo.read();
      if (previewSession && previewSession.progressMode === 'student') {
        var previewNext = app.index + 1;
        if (previewNext < STAGE_ORDER.length) {
          previewSession.teacherPreviewStage = STAGE_ORDER[previewNext];
          previewSession.teacherPreviewStageStartedAt = Date.now();
          global.YTClassroomDemo.write(previewSession);
          app.previewCompletedStage = null;
          goTo(previewNext, true);
          setClassroomGate(null);
        } else {
          setClassroomGate('completed', '老师体验已完成', '这只是老师的独立体验，不会计入任何学生的课堂进度或私密记录。');
        }
      } else {
        app.previewCompletedStage = STAGE_ORDER[app.index];
        setClassroomGate('completed', '教师演示操作已完成', '老师可从课堂管理区进入下一环节，学生端会同步进入。老师的操作不会写入学生记录。');
      }
      return;
    }
    if (!app.review && global.YTClassroomDemo) {
      var session = global.YTClassroomDemo.read();
      var stage = STAGE_ORDER[app.index];
      session.studentProgress = session.studentProgress || {};
      session.studentProgress[stage] = {
        status: 'completed',
        completedAt: Date.now()
      };
      session.reachedStages = Array.from(new Set((session.reachedStages || []).concat(stage)));
      if (session.progressMode === 'student') {
        var nextIndex = app.index + 1;
        if (nextIndex < STAGE_ORDER.length) {
          session.studentStage = STAGE_ORDER[nextIndex];
          session.studentStageStartedAt = Date.now();
          session.reachedStages = Array.from(new Set(session.reachedStages.concat(session.studentStage)));
          global.YTClassroomDemo.write(session);
          goTo(nextIndex, true);
          setClassroomGate(null);
        } else {
          session.studentStage = stage;
          session.studentCourseCompleted = true;
          session.studentExitedAt = Date.now();
          global.YTClassroomDemo.write(session);
          setClassroomGate('completed', '这节课已经完成', '正在退出课堂，返回你的个人空间。');
          global.setTimeout(function () { global.location.replace('student.html?classroomCompleted=1'); }, 900);
        }
        return;
      }
      global.YTClassroomDemo.write(session);
      setClassroomGate('completed', '这一部分已经完成', '先休息一下，等待老师带大家继续。');
      return;
    }
    next();
  }

  function setClassroomGate(mode, title, copy) {
    if (!app.classroomGate) { return; }
    if (!mode) {
      app.classroomGate.hidden = true;
      app.classroomGate.className = 'classroom-gate';
      return;
    }
    app.classroomGate.hidden = false;
    app.classroomGate.className = 'classroom-gate is-' + mode;
    app.classroomGate.querySelector('[data-gate-title]').textContent = title || '';
    app.classroomGate.querySelector('[data-gate-copy]').textContent = copy || '';
  }

  /* ======================================================================
     装配
     ====================================================================== */

  function boot() {
    /* 引擎不知道任何一节课的名字。没带 ?id= 就取注册表里的第一节。 */
    var reg = global.COURSE_REGISTRY || [];
    var id = param('id') || (reg.length ? reg[0].id : null);
    var course = id ? findCourse(id) : null;
    var app_el = document.getElementById('app');

    if (!course) {
      app_el.innerHTML =
        '<div style="padding:80px 24px;text-align:center">' +
          '<h1 class="t-title">没有找到这节课</h1>' +
          '<p class="t-body" style="margin-top:12px">课程 ID：' + esc(id) + '</p>' +
          '<p style="margin-top:24px"><a class="btn btn-quiet" href="student.html">回到课程库</a></p>' +
        '</div>';
      return;
    }

    app.course = course;
    app.review = param('mode') !== 'classroom';
    app.teacherPreview = param('preview') === 'teacher';

    if (app.teacherPreview && global.YTStore.setPersistence) { global.YTStore.setPersistence(false); }
    global.YTStore.start(course);
    global.YTAudio.configure(course.audio ? course.audio.basePath : '', course.audio ? course.audio.manifest : {});

    /* 课程包自检：开发时就能发现问题，而不是等学生看到 */
    if (global.console && console.warn) {
      var problems = global.YTDialogue.lint(course);
      if (problems.length) {
        console.warn('[课程包自检] ' + course.id + ' 有 ' + problems.length + ' 处问题：');
        for (var w = 0; w < problems.length; w++) { console.warn('  · ' + problems[w]); }
      }
    }

    /* 评审导航：真实课堂版本没有这个入口，学生不能自由跳转 */
    if (app.review && param('review') === '1') {
      document.body.className = 'has-review-nav';

      var nav = el('nav', 'review-nav');
      nav.setAttribute('aria-label', '课程环节导航');
      var inner = '<div class="review-nav-summary">' +
                    '<span class="nav-tag">评审模式</span>' +
                    '<span class="review-current"><small data-current-count>1 / 6</small><b data-current-label>进入课堂</b></span>' +
                    '<button class="review-flow-toggle" data-act="flow" aria-expanded="false">查看完整流程</button>' +
                  '</div>' +
                  '<div class="review-flow">' +
                    '<span class="nav-course">' + esc(course.title) + '</span>' +
                    '<span class="nav-sep"></span>';
      for (var i = 0; i < STAGE_ORDER.length; i++) {
        inner += '<button class="nav-btn" data-goto="' + i + '">' +
                 '<em>' + (i + 1) + '</em><span>' + STAGE_LABEL[STAGE_ORDER[i]] + '</span></button>';
      }
      inner += '<div class="review-tools"><button class="nav-btn nav-icon" data-act="mute" title="静音" aria-label="切换静音">🔊</button>';
      inner += '<a class="nav-btn nav-icon" href="review.html" title="观察材料" aria-label="观察材料">◎</a>';
      inner += '<a class="nav-btn nav-icon" href="student.html" title="回到课程库" aria-label="回到课程库">✕</a></div></div>';
      nav.innerHTML = inner;
      app_el.appendChild(nav);
      app.nav = nav;

      var flowToggle = nav.querySelector('[data-act="flow"]');
      flowToggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        this.setAttribute('aria-expanded', open ? 'true' : 'false');
        this.textContent = open ? '收起完整流程' : '查看完整流程';
      });

      var nb = nav.querySelectorAll('[data-goto]');
      for (var g = 0; g < nb.length; g++) {
        (function (btn) {
          btn.addEventListener('click', function () {
            goTo(parseInt(btn.getAttribute('data-goto'), 10));
          });
        })(nb[g]);
      }

      nav.querySelector('[data-act="mute"]').addEventListener('click', function () {
        var m = !global.YTAudio.isMuted();
        global.YTAudio.setMuted(m);
        this.textContent = m ? '🔇' : '🔊';
      });
    }

    var host = el('div', 'stage-host');
    app_el.appendChild(host);
    app.host = host;

    var enter = buildEnter(course);
    var story = buildStory(course, completeCurrentStage);
    var talk = buildTalk(course, completeCurrentStage);
    var energy = buildEnergy(course, completeCurrentStage);
    var playground = buildPlayground(course, completeCurrentStage);
    var closing = buildClosing(course, completeCurrentStage);

    app.stages = [enter, story, talk, energy, playground, closing];
    for (var s = 0; s < app.stages.length; s++) { host.appendChild(app.stages[s].root); }

    enter.onConfirm(completeCurrentStage);

    if (!app.review) {
      var gate = el('div', 'classroom-gate');
      gate.hidden = true;
      gate.innerHTML = '<section><span>云听课堂</span><h2 data-gate-title></h2><p data-gate-copy></p></section>';
      app_el.appendChild(gate);
      app.classroomGate = gate;
    }

    goTo(0);

    /* 同页面控课 API：为后续的老师控课留出接口，将来的壳无论怎么换，
       控课逻辑都不用重写。 */
    global.YueYueClass = {
      course: course,
      state: function () { return { stage: STAGE_ORDER[app.index], index: app.index }; },
      goto: function (name) {
        var i = STAGE_ORDER.indexOf(name);
        if (i >= 0) { goTo(i); }
      },
      next: next,
      prev: function () { goTo(app.index - 1); },
      store: global.YTStore
    };

    /* 前端演示桥接：课堂页只跟随老师当前开放环节，不提供学生自主跳转。
       真实产品须由已鉴权的实时课堂服务替代此浏览器本地状态。 */
    if (!app.review && global.YTClassroomDemo) {
      function followTeacher(session) {
        if (app.courseCompleted) { setClassroomGate(null); return; }
        if (session && session.courseId === course.id && (session.status === 'ended' || (!app.teacherPreview && session.studentCourseCompleted))) {
          if (app.teacherPreview) {
            goTo(STAGE_ORDER.indexOf('closing'), true);
            var closingRoot = closing.root;
            closingRoot.querySelectorAll('[data-step]').forEach(function (step) { step.classList.toggle('is-hidden', step.getAttribute('data-step') !== 'end'); });
            app.courseCompleted = true;
            setClassroomGate(null);
          } else { global.location.replace('student.html?classroomCompleted=1'); }
          return;
        }
        if (!session || !session.active || session.courseId !== course.id) { if (story.setPaused) story.setPaused(true); if (energy.setPaused) energy.setPaused(true); return; }
        var followedStage = app.teacherPreview
          ? (session.progressMode === 'student' ? (session.teacherPreviewStage || session.stage) : session.stage)
          : (session.progressMode === 'student' ? (session.studentStage || session.stage) : session.stage);
        var target = STAGE_ORDER.indexOf(followedStage);
        if (target >= 0 && target !== app.index) {
          if (app.teacherPreview) { app.previewCompletedStage = null; }
          goTo(target, true);
          setClassroomGate(null);
        }
        if (story.setPaused) story.setPaused(!!session.paused || session.status === 'waiting');
        if (energy.setPaused) energy.setPaused(!!session.paused || session.status === 'waiting');
        document.body.className = session.paused ? 'classroom-is-paused' : (session.status === 'waiting' ? 'classroom-is-waiting' : '');
        if (session.status === 'waiting') {
          setClassroomGate('waiting', '课堂即将开始', '请留在这里，老师准备好后会带大家一起进入。');
        } else if (session.paused) {
          setClassroomGate('paused', '课堂暂时停一下', '你的内容已经保留，请等待老师继续课堂。');
        } else if (app.teacherPreview && app.previewCompletedStage === STAGE_ORDER[app.index]) {
          setClassroomGate('completed', '教师演示操作已完成', '这是老师的可操作演示视图，不会计入任何学生的课堂进度或私密记录。请从右侧切换环节。');
        } else if (session.progressMode !== 'student' && session.studentProgress && session.studentProgress[STAGE_ORDER[app.index]] && session.studentProgress[STAGE_ORDER[app.index]].status === 'completed') {
          setClassroomGate('completed', '这一部分已经完成', '先休息一下，等待老师带大家继续。');
        } else if (session.progressMode === 'student' && session.studentCourseCompleted && !app.teacherPreview) {
          setClassroomGate('completed', '这节课已经完成', '正在退出课堂，返回你的个人空间。');
          global.setTimeout(function () { global.location.replace('student.html?classroomCompleted=1'); }, 300);
        } else {
          setClassroomGate(null);
        }
      }
      followTeacher(global.YTClassroomDemo.read());
      global.YTClassroomDemo.subscribe(followTeacher);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
