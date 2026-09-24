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
    enter: '进入课堂',
    story: '故事导入',
    talk: '和小悦悦聊聊',
    energy: '心理能量补给',
    playground: '成长训练场',
    closing: '收束与尾声'
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

    var agreements = '';
    for (var i = 0; i < (d.agreements || []).length; i++) {
      agreements += '<span>' + esc(d.agreements[i]) + '</span>';
    }

    root.innerHTML =
      '<div class="scene-enter">' +
        '<div class="enter-body stagger">' +
          '<div>' +
            '<p class="t-eyebrow enter-eyebrow">' + esc(d.eyebrow || '') + '</p>' +
            '<h1 class="t-display enter-title">' + esc(d.title) + '</h1>' +
            '<p class="t-lead enter-subtitle">' + esc(d.subtitle || '') + '</p>' +
          '</div>' +
          '<blockquote class="enter-opening">' + esc(d.opening || '') + '</blockquote>' +
          '<div class="enter-agreement stack-3">' + agreements + '</div>' +
          '<div class="enter-actions">' +
            '<button class="btn btn-primary" data-act="confirm">' +
              esc(d.confirmLabel || '我准备好了') +
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
    var d = course.stages.story;
    var beats = d.beats || [];
    var p = d.prompt || {};
    var root = el('section', 'stage');
    root.setAttribute('data-stage', 'story');

    /* 故事一次只呈现一个情境片段：用渐隐渐显推进，而不是让长文本滚动。 */
    root.innerHTML =
      '<div class="scene-story">' +
        '<article class="story-frame" aria-label="故事导入">' +
          '<div class="story-header">' +
            '<p class="t-eyebrow">故事导入</p>' +
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
              '<button class="btn btn-ghost" data-act="skip">' + esc(p.skipLabel || '这次先不写') + '</button>' +
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

    function submit(skipped) {
      var ta = root.querySelector('[data-input]');
      var val = ta ? ta.value : '';
      if (skipped || !val.trim()) {
        global.YTStore.recordSkip({ stage: 'story', nodeId: p.id, prompt: p.text });
      } else {
        global.YTStore.record({ stage: 'story', nodeId: p.id, prompt: p.text, raw: val });
      }
      onDone();
    }

    root.querySelector('[data-act="submit"]').addEventListener('click', function () { submit(false); });
    root.querySelector('[data-act="skip"]').addEventListener('click', function () { submit(true); });

    return { root: root, activate: function () {}, deactivate: function () {} };
  }

  /* ======================================================================
     环节 3 · 和小悦悦聊聊 —— 私密房间
     ====================================================================== */

  function buildTalk(course, onDone) {
    var d = course.stages.talk;
    var nodes = d.nodes || [];
    var counter = global.YTDialogue.makeTurnCounter(d.maxStudentTurns || 6);
    var root = el('section', 'stage');
    root.setAttribute('data-stage', 'talk');

    root.innerHTML =
      '<div class="scene-talk">' +
        '<div class="room"></div>' +
        '<div class="talk-head">' +
          '<span class="talk-presence-dot" aria-hidden="true"></span>' +
          '<span class="t-small">' + esc(d.presenceLabel || '小悦悦') + '</span>' +
          '<span class="talk-private">只在这里，不在班级公开</span>' +
        '</div>' +
        '<div class="talk-log" data-log></div>' +
        '<div class="talk-composer" data-composer></div>' +
      '</div>';

    var log = root.querySelector('[data-log]');
    var composer = root.querySelector('[data-composer]');
    var echo = '';
    var nodeIdx = 0;

    /* 取环节 2 的原话，作为「接住表达」的引用来源 */
    var tr = global.YTStore.get().transcript;
    for (var i = 0; i < tr.length; i++) {
      if (tr[i].stage === 'story' && tr[i].raw) { echo = tr[i].raw; }
    }

    function scrollDown() {
      log.scrollTop = log.scrollHeight;
    }

    function say(text, cls) {
      var bubble = el('div', 'msg ' + (cls || 'msg-yue'), fill(text, { storyEcho: echo }));
      log.appendChild(bubble);
      scrollDown();
    }

    function clearComposer() { composer.innerHTML = ''; }

    function addSkipButton(label, onClick) {
      var b = el('button', 'btn btn-ghost t-small', esc(label));
      b.addEventListener('click', onClick);
      b.style.alignSelf = 'flex-start';
      composer.appendChild(b);
      return b;
    }

    /* --- 自由输入 --- */
    function askFree(node, onAnswered) {
      var cfg = node.input || {};
      var wrap = el('div', 'composer-row');
      var ta = document.createElement('textarea');
      ta.className = 'field';
      ta.rows = 2;
      ta.maxLength = cfg.maxLen || 200;
      ta.placeholder = cfg.placeholder || '';

      var send = el('button', 'btn btn-primary', '说完了');
      wrap.appendChild(ta);
      wrap.appendChild(send);
      composer.appendChild(wrap);

      addSkipButton(cfg.skipLabel || '这次先不说', function () {
        onAnswered({ skipped: true, text: '' });
      });

      function submit() {
        var v = ta.value;
        if (!v.trim()) { return; }
        onAnswered({ skipped: false, text: v });
      }

      send.addEventListener('click', submit);
      ta.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { submit(); }
      });
      ta.focus();
    }

    /* --- 选项输入 --- */
    function askChoice(node, onAnswered) {
      var cfg = node.input || {};
      var chips = el('div', 'chips');
      var opts = cfg.options || [];

      for (var i = 0; i < opts.length; i++) {
        (function (opt) {
          var c = el('button', 'chip', esc(opt.label));
          c.addEventListener('click', function () {
            onAnswered({ skipped: false, text: opt.label, reply: opt.reply, optionId: opt.id });
          });
          chips.appendChild(c);
        })(opts[i]);
      }
      composer.appendChild(chips);
    }

    function runNode() {
      if (nodeIdx >= nodes.length) { finish(); return; }
      var node = nodes[nodeIdx];
      nodeIdx += 1;

      var lines = node.say || [];
      for (var i = 0; i < lines.length; i++) {
        (function (line, k) {
          setTimeout(function () { say(line, 'msg-yue'); }, k * 620);
        })(lines[i], i);
      }

      setTimeout(function () { presentInput(node); }, lines.length * 620 + 320);
    }

    function presentInput(node) {
      var cfg = node.input;

      /* catch 之类不需要输入的节点：直接往下走 */
      if (!cfg) { runNode(); return; }

      clearComposer();

      function answered(res) {
        clearComposer();

        /* 记录原话或跳过 */
        if (res.skipped) {
          global.YTStore.recordSkip({ stage: 'talk', nodeId: node.id, prompt: (node.say || []).join('') });
        } else if (res.text) {
          global.YTStore.record({ stage: 'talk', nodeId: node.id, prompt: (node.say || []).join(''), raw: res.text });
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
        setTimeout(runNode, 900);
      }

      if (cfg.type === 'choice') {
        askChoice(node, answered);
      } else {
        askFree(node, answered);
      }
    }

    function finish() {
      clearComposer();
      var closing = d.closing || [];
      for (var i = 0; i < closing.length; i++) {
        (function (line, k) {
          setTimeout(function () { say(line, 'msg-yue'); }, k * 700);
        })(closing[i], i);
      }
      setTimeout(onDone, closing.length * 700 + 900);
    }

    return {
      root: root,
      activate: function () {
        if (!log.childNodes.length) {
          var opening = d.opening || [];
          for (var i = 0; i < opening.length; i++) {
            (function (line, k) {
              setTimeout(function () { say(line, 'msg-yue'); }, k * 620);
            })(opening[i], i);
          }
          setTimeout(runNode, opening.length * 620 + 400);
        }
      },
      deactivate: function () {}
    };
  }

  /* ======================================================================
     环节 4 · 心理能量补给 —— 音频引导的单焦点舞台
     ====================================================================== */

  function buildEnergy(course, onDone) {
    var d = course.stages.energy || {};
    var track = d.track || {};
    var root = el('section', 'stage');
    root.setAttribute('data-stage', 'energy');
    var src = track.src || '';
    if (src && !/^(https?:|data:|\/)/.test(src)) {
      src = ((course.audio && course.audio.basePath) || '') + src;
    }
    root.innerHTML =
      '<div class="scene-energy">' +
        '<section class="energy-player">' +
          '<div class="energy-cover"><span></span><i>♪</i></div>' +
          '<div class="energy-copy">' +
            '<p class="t-eyebrow">心理能量补给</p>' +
            '<h2 class="t-title">' + esc(d.title || '听一段音乐，把时间留给自己') + '</h2>' +
            '<p class="t-body">' + esc(d.intro || '不需要回答问题，只需要听。') + '</p>' +
            '<div class="energy-track">' +
              '<div><b>' + esc(track.title || '本课心理能量音频') + '</b><span>' + esc(track.subtitle || '音乐素材接入后显示正式名称') + '</span></div>' +
              '<em>' + esc(track.durationLabel || '待配置') + '</em>' +
            '</div>' +
            '<div class="energy-progress"><i data-progress></i></div>' +
            '<div class="energy-time"><span data-current>00:00</span><span data-duration>' + esc(track.durationLabel || '--:--') + '</span></div>' +
            '<div class="energy-controls">' +
              '<button class="energy-play" data-play ' + (src ? '' : 'disabled') + '>' + (src ? '▶ 播放音乐' : '音乐文件待接入') + '</button>' +
              '<label>音量 <input type="range" min="0" max="1" step="0.05" value="0.8" data-volume ' + (src ? '' : 'disabled') + '></label>' +
            '</div>' +
            '<p class="energy-status" data-status>' + (src ? '准备好后，点击播放。' : '当前只展示播放器结构，尚未使用语音或其他素材代替音乐。') + '</p>' +
            '<div class="energy-actions">' +
              '<button class="btn btn-primary" data-finish ' + (src ? 'disabled' : '') + '>' + (src ? '听完了，继续' : '当前预览先跳过') + '</button>' +
              (src ? '<button class="btn btn-ghost" data-skip>这次先听到这里</button>' : '') +
            '</div>' +
          '</div>' +
          (src ? '<audio preload="metadata" src="' + esc(src) + '" data-audio></audio>' : '') +
        '</section>' +
      '</div>';

    var audio = root.querySelector('[data-audio]');
    var play = root.querySelector('[data-play]');
    var finish = root.querySelector('[data-finish]');
    var skip = root.querySelector('[data-skip]');
    var volume = root.querySelector('[data-volume]');
    var bar = root.querySelector('[data-progress]');
    var current = root.querySelector('[data-current]');
    var duration = root.querySelector('[data-duration]');
    var status = root.querySelector('[data-status]');

    function clock(sec) {
      if (!isFinite(sec)) { return '--:--'; }
      var n = Math.max(0, Math.floor(sec));
      return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
    }
    function complete(skipped) {
      if (audio) { audio.pause(); }
      global.YTStore.record({ stage:'energy', nodeId:track.id || 'music', prompt:'心理能量补给音乐聆听', raw:skipped ? '学生选择提前结束聆听' : '音乐播放完成' });
      onDone();
    }
    if (audio) {
      audio.volume = 0.8;
      audio.addEventListener('loadedmetadata', function () { duration.textContent = clock(audio.duration); });
      audio.addEventListener('timeupdate', function () {
        current.textContent = clock(audio.currentTime);
        bar.style.width = audio.duration ? Math.min(100, audio.currentTime / audio.duration * 100) + '%' : '0%';
      });
      audio.addEventListener('ended', function () {
        play.textContent = '↻ 再听一遍';
        finish.disabled = false;
        status.textContent = '音乐已经播放结束。你可以继续，也可以再听一遍。';
      });
      audio.addEventListener('error', function () {
        play.disabled = true;
        finish.disabled = false;
        status.textContent = '音乐暂时无法加载，可以先继续课堂。';
      });
      play.addEventListener('click', function () {
        global.YTAudio.stopAll();
        if (audio.ended) { audio.currentTime = 0; }
        if (audio.paused) {
          audio.play().then(function () { play.textContent = 'Ⅱ 暂停'; status.textContent = '正在播放，只需要安静地听。'; }).catch(function () { status.textContent = '浏览器没有允许自动播放，请再点击一次。'; });
        } else { audio.pause(); play.textContent = '▶ 继续播放'; status.textContent = '已经暂停，准备好时可以继续。'; }
      });
      volume.addEventListener('input', function () { audio.volume = Number(volume.value); });
      finish.addEventListener('click', function () { complete(false); });
      if (skip) { skip.addEventListener('click', function () { complete(true); }); }
    } else {
      finish.addEventListener('click', function () { complete(true); });
    }
    return {
      root: root,
      activate: function () {},
      deactivate: function () { if (audio) { audio.pause(); } }
    };
  }

  /* ======================================================================
     环节 5 · 成长训练场 —— 可选择、可操作的能力训练小游戏
     ====================================================================== */

  function buildPlayground(course, onDone) {
    var d = course.stages.playground || {};
    var root = el('section', 'stage');
    root.setAttribute('data-stage', 'playground');
    root.innerHTML =
      '<div class="scene-playground">' +
        '<header class="playground-title">' +
          '<p class="t-eyebrow">成长训练场</p>' +
          '<h2 class="t-title">' + esc(d.title || '选择一项大脑训练') + '</h2>' +
          '<p class="t-body">' + esc(d.intro || '从注意力、视觉观察和记忆等训练中选择一项。') + '</p>' +
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
          mount.innerHTML = '<p class="t-body">训练小游戏暂时没有加载成功。</p>';
          return;
        }
        global.YTGrowthGames.mount(mount, {
          appIds: d.appIds,
          onGameComplete: function (app) {
            global.YTStore.record({ stage:'playground', nodeId:app.id, prompt:'选择的训练小游戏', raw:app.title });
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
    var outlets = d.outlets || [];
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
            '<p class="picked-meaning" data-meaning></p>' +
            '<button class="btn btn-ghost" data-act="skip-color">这次先不选</button>' +
          '</div>' +

          '<div class="closing-step stack-5 is-hidden" data-step="leave">' +
            '<h2 class="t-title">' + esc(d.leavingPrompt || '') + '</h2>' +
            '<div class="outlets" data-outlets>' + outletHtml + '</div>' +
            '<div class="stack-3 is-hidden" data-write>' +
              '<p class="t-body" data-hint></p>' +
              '<div class="note">' +
                '<textarea class="field" rows="3" data-text maxlength="200"></textarea>' +
              '</div>' +
              '<div class="row gap-4 wrap">' +
                '<button class="btn btn-primary" data-act="keep">留在这里</button>' +
                '<button class="btn btn-ghost" data-act="nokeep">还是不写了</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="closing-step stack-6 is-hidden" data-step="end">' +
            '<div class="ending">' + endingHtml + '</div>' +
            '<div class="row gap-4 wrap center" style="justify-content:center">' +
              '<button class="btn btn-quiet" data-act="restart">再走一次这节课</button>' +
              '<a class="btn btn-quiet" href="student.html">回到课程库</a>' +
            '</div>' +
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
    var currentOutlet = null;

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

    /* --- 第二步：留不留 --- */
    var outletEls = root.querySelectorAll('.outlet');
    for (var o = 0; o < outletEls.length; o++) {
      (function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-outlet');
          var item = outletById(id);
          global.YTStore.get().pickedOutlet = id;
          /* 观察材料是给老师看的，存 id 老师看不懂（"self"）——
             和 pickedColorLabel 一样，把中文说法一起存下来。 */
          global.YTStore.get().pickedOutletLabel = item ? item.label : id;

          for (var i = 0; i < outletEls.length; i++) {
            outletEls[i].className = (outletEls[i] === b) ? 'outlet is-picked' : 'outlet';
          }

          if (id === 'none') {
            global.YTStore.recordSkip({ stage: 'closing', nodeId: 'leave', prompt: d.leavingPrompt });
            setTimeout(toEnd, 500);
            return;
          }

          currentOutlet = item;
          hint.textContent = item.hint || '';
          write.className = 'stack-3 rise';
          /* 求助通道语义不同，必须让学生知道它会被谁看到 */
          if (item.shared) {
            hint.textContent = (item.hint || '') + '（这条会被老师看到）';
          }
          ta.focus();
        });
      })(outletEls[o]);
    }

    function keepClick() {
      var v = ta.value;
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
      } else {
        global.YTStore.recordSkip({ stage: 'closing', nodeId: currentOutlet ? currentOutlet.id : 'leave', prompt: '' });
      }
      toEnd();
    }

    root.querySelector('[data-act="keep"]').addEventListener('click', keepClick);
    root.querySelector('[data-act="nokeep"]').addEventListener('click', function () {
      global.YTStore.recordSkip({ stage: 'closing', nodeId: currentOutlet ? currentOutlet.id : 'leave', prompt: '' });
      toEnd();
    });

    function toEnd() {
      stepLeave.className = 'closing-step stack-5 is-hidden';
      stepEnd.className = 'closing-step stack-6 rise';
      if (d.audio) { global.YTAudio.play(d.audio); }
      global.YTStore.get().finishedAt = new Date().toISOString();
      global.YTStore.commit();
      onDone();
    }

    root.querySelector('[data-act="restart"]').addEventListener('click', function () {
      global.location.reload();
    });

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
      if (i === idx) {
        s.root.className = 'stage is-active';
      } else {
        s.root.className = 'stage';
      }
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
    if (app.teacherPreview) {
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
    if (app.review) {
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
        if (!session || !session.active || session.courseId !== course.id) { return; }
        var followedStage = app.teacherPreview
          ? (session.progressMode === 'student' ? (session.teacherPreviewStage || session.stage) : session.stage)
          : (session.progressMode === 'student' ? (session.studentStage || session.stage) : session.stage);
        var target = STAGE_ORDER.indexOf(followedStage);
        if (target >= 0 && target !== app.index) {
          if (app.teacherPreview) { app.previewCompletedStage = null; }
          goTo(target, true);
          setClassroomGate(null);
        }
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
