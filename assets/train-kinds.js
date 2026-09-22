/* ==========================================================================
   云听 AI 智慧心理教室 · 训练渲染器注册表
   --------------------------------------------------------------------------
   课程包的 practice.exercises[].kind 是判别字段，引擎按它分发到这里的一个渲染器。
   加一种新的训练方法 = 注册一个新渲染器，不改引擎主体。

   已注册：
     breathing —— 循环型，无叙事，有周期（4-4 呼吸）
     lenses    —— 线型，有叙事，无周期（三个镜头）

   两类在机制上就不同，不是同一段代码换文案。

   每个渲染器实现 render(stage, exercise)，并自行调用 stage.done()。
   ========================================================================== */

(function (global) {
  'use strict';

  var registry = {};

  function register(kind, renderer) { registry[kind] = renderer; }
  function get(kind) { return registry[kind] || null; }
  function has(kind) { return !!registry[kind]; }

  /* ======================================================================
     共用：把秒数变成可读的进度
     ====================================================================== */

  function makeTicker(seconds, onTick) {
    var start = null;
    var raf = null;
    var stopped = false;

    function frame(now) {
      if (stopped) { return; }
      if (start === null) { start = now; }
      var elapsed = (now - start) / 1000;
      var ratio = Math.min(1, elapsed / seconds);
      onTick(ratio, elapsed);
      if (ratio < 1) {
        raf = global.requestAnimationFrame(frame);
      }
    }

    raf = global.requestAnimationFrame(frame);

    return function stop() {
      stopped = true;
      if (raf) { global.cancelAnimationFrame(raf); }
    };
  }

  /* ======================================================================
     breathing —— 循环型
     中央光圈随 4-4 节拍缩放，环外四拍刻度依次点亮。
     刻度是无声环境的关键替代物：投影到大屏后，后排学生看不清光圈的细微缩放，
     但看得见刻度一个一个亮起来。
     ====================================================================== */

  register('breathing', function (stage, ex) {
    var cycles = ex.cycles || 2;
    var steps = ex.steps || [];
    var leadSec = ex.leadingSeconds || 6;
    var trailSec = ex.trailingSeconds || 6;

    var field = document.createElement('div');
    field.className = 'orb-field';

    var ring = document.createElement('div');
    ring.className = 'orb-ring';

    var ticks = document.createElement('div');
    ticks.className = 'orb-ticks';

    var orb = document.createElement('div');
    orb.className = 'orb is-idle';

    field.appendChild(ring);
    field.appendChild(ticks);
    field.appendChild(orb);
    stage.area.appendChild(field);

    var tickEls = [];
    var tickTimers = [];
    var stepTimer = null;
    var tickStop = null;

    var maxTicks = 0;
    for (var i = 0; i < steps.length; i++) {
      maxTicks = Math.max(maxTicks, steps[i].tickCount || 0);
    }

    /* 沿圆周均布刻度 */
    for (var t = 0; t < maxTicks; t++) {
      var d = document.createElement('i');
      d.className = 'tick';
      var angle = (t / maxTicks) * Math.PI * 2 - Math.PI / 2;
      d.style.left = (50 + 50 * Math.cos(angle)) + '%';
      d.style.top = (50 + 50 * Math.sin(angle)) + '%';
      ticks.appendChild(d);
      tickEls.push(d);
    }

    function clearTicks() {
      for (var i = 0; i < tickTimers.length; i++) { clearTimeout(tickTimers[i]); }
      tickTimers = [];
      for (var j = 0; j < tickEls.length; j++) { tickEls[j].className = 'tick'; }
    }

    function lightTicks(n) {
      for (var i = 0; i < n; i++) {
        (function (idx) {
          tickTimers.push(setTimeout(function () {
            if (tickEls[idx]) { tickEls[idx].className = 'tick is-lit'; }
          }, idx * 1000));
        })(i);
      }
    }

    function runStep(step, round, onEnd) {
      var stepIdx = indexOfStep(step);
      var nextStep = steps[(stepIdx + 1) % steps.length];
      clearTicks();

      stage.setCue(step.cue, nextStep ? nextStep.cue : '');

      /* 相位由结构决定，不拿文案当判别条件。
         若写成 cue === '吸气' ? 'inhale' : 'exhale'，渲染器就绑死在
         一节课的措辞上：换一门课把吸气写成「慢慢吸」，光圈会静默地
         全变成呼气，而且不报错。step.phase 显式声明；没写就按
         「第 1 步吸、第 2 步呼」的步序推，仍然是结构而非文字。 */
      var phase = step.phase || (stepIdx % 2 === 0 ? 'inhale' : 'exhale');
      orb.className = 'orb is-' + phase;
      stage.setProgress('第 ' + round + ' 轮 / 共 ' + cycles + ' 轮');
      if (step.audio) { global.YTAudio.play(step.audio); }
      lightTicks(step.tickCount || 0);

      tickStop = makeTicker(step.seconds, function () { /* 刻度已按秒点亮 */ });

      stepTimer = setTimeout(function () {
        if (tickStop) { tickStop(); tickStop = null; }
        onEnd();
      }, (step.seconds || 4) * 1000);
    }

    function indexOfStep(s) {
      for (var i = 0; i < steps.length; i++) { if (steps[i] === s) { return i; } }
      return 0;
    }

    function runRound(round) {
      var idx = 0;
      function next() {
        if (idx >= steps.length) {
          if (round < cycles) { runRound(round + 1); }
          else { trailing(); }
          return;
        }
        var s = steps[idx];
        idx += 1;
        runStep(s, round, next);
      }
      next();
    }

    function leading() {
      orb.className = 'orb is-idle';
      clearTicks();
      stage.setCue(ex.lead || '跟着中间的节奏就好。', steps[0] ? steps[0].cue : '');
      stage.setProgress('准备');
      if (ex.voiceSlot && global.YTAudio.isAvailable(ex.voiceSlot)) {
        global.YTAudio.play(ex.voiceSlot);
      }
      stepTimer = setTimeout(function () { runRound(1); }, leadSec * 1000);
    }

    function trailing() {
      orb.className = 'orb is-idle';
      clearTicks();
      stage.setProgress('完成');
      stage.setCue('慢慢回到这里就好。', '');
      stepTimer = setTimeout(function () { stage.done(); }, trailSec * 1000);
    }

    /* 立即跳过整个训练 */
    stage.onSkip(function () {
      clearTicks();
      if (stepTimer) { clearTimeout(stepTimer); }
      if (tickStop) { tickStop(); tickStop = null; }
      global.YTAudio.stopAll();
      stage.done();
    });

    leading();
  });

  /* ======================================================================
     lenses —— 线型
     三个镜头，每个镜头一次性的视觉变化。无周期、有叙事，
     和 breathing 在机制上就是两回事。
     最后一个镜头可以带一个输入：让学生自己产出那句话。
     ====================================================================== */

  register('lenses', function (stage, ex) {
    var steps = ex.steps || [];
    var leadSec = ex.leadingSeconds || 6;
    var trailSec = ex.trailingSeconds || 8;

    var frame = document.createElement('div');
    frame.className = 'lens-frame';

    var inner = document.createElement('div');
    inner.className = 'lens-inner';

    var arc = document.createElement('svg');
    arc.setAttribute('class', 'lens-arc');
    arc.setAttribute('viewBox', '0 0 100 100');
    arc.setAttribute('aria-hidden', 'true');
    arc.innerHTML = '<circle class="lens-arc-track" cx="50" cy="50" r="48"></circle>' +
                    '<circle class="lens-arc-bar" cx="50" cy="50" r="48"></circle>';

    frame.appendChild(arc);
    frame.appendChild(inner);
    stage.area.appendChild(frame);

    var bar = arc.querySelector('.lens-arc-bar');
    var CIRC = 2 * Math.PI * 48;

    var stepTimer = null;
    var subTimer = null;
    var tickStop = null;

    function setArc(ratio) {
      bar.style.strokeDasharray = CIRC;
      bar.style.strokeDashoffset = String(CIRC * (1 - ratio));
    }
    setArc(0);

    function clearArc() {
      if (tickStop) { tickStop(); tickStop = null; }
      /* 副文案定时器必须随镜头一起清掉，否则上一个镜头的 subNote
         会在下一个镜头里突然冒出来，接在错误的引导语后面。 */
      if (subTimer) { clearTimeout(subTimer); subTimer = null; }
      setArc(0);
    }

    function runStep(i) {
      if (i >= steps.length) { trailing(); return; }
      var s = steps[i];
      var next = steps[i + 1];

      frame.className = 'lens-frame is-' + (s.reveal || 'none');
      inner.className = 'lens-inner';
      clearArc();

      stage.setCue(s.cue, next ? next.cue : '');
      stage.setProgress('第 ' + (i + 1) + ' 个镜头 / 共 ' + steps.length + ' 个');
      /* 每个镜头都可立即跳过——想到的内容可能比预期更重 */
      stage.setSkipLabel(s.skippable ? '这个镜头先跳过' : '先跳过这段');

      /* 引导语必须落在屏幕上。音频到位时它是字幕，音频没到位时
         它就是引导本身——没有这条，三个镜头在无声环境下只剩一个
         光框和两个字，学生根本不知道该看什么。 */
      stage.setSubCue(s.note || '');

      if (s.audio) { global.YTAudio.play(s.audio); }

      /* 副文案在指定秒数后接上，覆盖引导语 */
      if (s.subNote) {
        subTimer = setTimeout(function () {
          subTimer = null;
          stage.setSubCue(s.subNote);
        }, (s.subNoteAt || Math.floor((s.seconds || 20) / 2)) * 1000);
      }

      tickStop = makeTicker(s.seconds || 20, function (ratio) { setArc(ratio); });

      stepTimer = setTimeout(function () {
        clearArc();
        /* 该镜头带输入 → 先让学生写，写完或跳过后再往下 */
        if (s.input) {
          stage.askInput(s.input, function () { runStep(i + 1); });
          return;
        }
        runStep(i + 1);
      }, (s.seconds || 20) * 1000);
    }

    function leading() {
      frame.className = 'lens-frame';
      stage.setCue(ex.lead || '接下来几个镜头，看着就好。', steps[0] ? steps[0].cue : '');
      stage.setProgress('准备');
      stepTimer = setTimeout(function () { runStep(0); }, leadSec * 1000);
    }

    function trailing() {
      frame.className = 'lens-frame is-fade';
      clearArc();
      /* 收束语由课程包给。写死在这里等于渲染器记住了某一节课的内容，
         「加一节新课不改引擎」就不成立了。 */
      stage.setCue(ex.trailingNote || '这一段就到这里。', '');
      stage.setProgress('完成');
      stepTimer = setTimeout(function () { stage.done(); }, trailSec * 1000);
    }

    stage.onSkip(function () {
      clearArc();
      if (stepTimer) { clearTimeout(stepTimer); }
      if (subTimer) { clearTimeout(subTimer); }
      global.YTAudio.stopAll();
      stage.done();
    });

    leading();
  });

  global.YTTrain = {
    register: register,
    get: get,
    has: has,
    kinds: registry
  };
})(window);
