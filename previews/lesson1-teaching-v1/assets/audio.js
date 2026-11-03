/* ==========================================================================
   云听 AI 智慧心理教室 · 音频层
   --------------------------------------------------------------------------
   硬约束：只用 HTMLAudioElement，不用 Web Audio API。

   原因：Web Audio 加载音频需要 decodeAudioData(ArrayBuffer)，而拿到 ArrayBuffer
   的常规途径是 fetch / XHR —— 这两者在 file:// 下都被 CORS 挡死。媒体元素
   （<audio src>）的加载不属于 CORS 请求，在 file:// 下正常。

   当前没有任何音频素材。因此本层的行为是：所有槽位默认不存在，
   探测失败即永久标记为不可用，静默降级，绝不阻塞任何 UI。
   ========================================================================== */

(function (global) {
  'use strict';

  var PROBE_TIMEOUT = 2500;   // 教室电脑上坏文件不能卡住流程

  var state = {
    basePath: '',
    manifest: {},
    unavailable: {},   // slotId -> true，永久标记，不重试
    players: {},       // slotId -> HTMLAudioElement
    muted: false,
    unlocked: false    // 自动播放策略：首次 play 必须发生在用户手势之后
  };

  /** 配置一个课程的音频清单。file 为 null 即表示素材尚未到位。 */
  function configure(basePath, manifest) {
    stopAll();
    state.basePath = basePath || '';
    state.manifest = manifest || {};
    state.unavailable = {};
    state.players = {};
  }

  function entryFor(slotId) {
    if (!state.manifest) { return null; }
    var e = state.manifest[slotId];
    if (!e || !e.file) { return null; }
    return e;
  }

  /**
   * 探测某个槽位是否真的可用（返回 Promise<boolean>）。
   * 调用方绝不用它来决定"能不能继续"——只用它决定"要不要跳过某个为音频准备的停顿"。
   */
  function probe(slotId) {
    return new Promise(function (resolve) {
      if (state.unavailable[slotId]) { resolve(false); return; }

      var e = entryFor(slotId);
      if (!e) {
        state.unavailable[slotId] = true;   // 素材未到位，本轮不会再有
        resolve(false);
        return;
      }

      var url = state.basePath + e.file;
      var el = document.createElement('audio');
      var done = false;

      function finish(ok) {
        if (done) { return; }
        done = true;
        clearTimeout(timer);
        if (!ok) {
          state.unavailable[slotId] = true;
          state.players[slotId] = null;
        } else {
          el.preload = 'auto';
          state.players[slotId] = el;
        }
        resolve(ok);
      }

      var timer = setTimeout(function () { finish(false); }, PROBE_TIMEOUT);

      el.addEventListener('canplaythrough', function () { finish(true); }, false);
      el.addEventListener('loadedmetadata', function () { finish(true); }, false);
      el.addEventListener('error', function () { finish(false); }, false);

      el.src = url;
      el.load();
    });
  }

  function isAvailable(slotId) {
    return !!state.players[slotId];
  }

  /** 静音开关状态（只存内存，不落盘）。 */
  function setMuted(m) {
    state.muted = !!m;
    for (var k in state.players) {
      if (Object.prototype.hasOwnProperty.call(state.players, k) && state.players[k]) {
        state.players[k].muted = state.muted;
      }
    }
  }

  function isMuted() { return state.muted; }

  /** 首次用户手势时调用，解锁后续的自动播放。 */
  function unlock() {
    state.unlocked = true;
  }

  /**
   * 播放一个槽位。立即返回，不阻塞任何 UI。
   * @param {string} slotId
   * @param {Object=} opts { loop, restart }
   */
  function play(slotId, opts) {
    opts = opts || {};
    var el = state.players[slotId];
    if (!el || !state.unlocked) { return false; }

    try {
      var e = entryFor(slotId);
      el.loop = opts.loop != null ? !!opts.loop : !!(e && e.loop);
      if (e && typeof e.gain === 'number') { el.volume = e.gain; }
      el.muted = state.muted;
      if (opts.restart !== false) { el.currentTime = 0; }
      var p = el.play();
      // 播放失败（策略、坏文件）不该冒泡成未捕获的 Promise 拒绝
      if (p && typeof p.catch === 'function') { p.catch(function () {}); }
      return true;
    } catch (err) {
      return false;
    }
  }

  function stop(slotId) {
    var el = state.players[slotId];
    if (!el) { return; }
    try { el.pause(); el.currentTime = 0; } catch (e) { /* 忽略 */ }
  }

  function stopAll() {
    for (var k in state.players) {
      if (Object.prototype.hasOwnProperty.call(state.players, k)) { stop(k); }
    }
  }

  /** 进入某环节时预加载该环节要用到的槽位，避免教室网络/磁盘抖动。 */
  function preload(slotIds) {
    if (!slotIds) { return; }
    for (var i = 0; i < slotIds.length; i++) {
      var id = slotIds[i];
      if (!state.unavailable[id] && !state.players[id]) {
        probe(id);   // 失败会静默标记，不影响流程
      }
    }
  }

  global.YTAudio = {
    configure: configure,
    probe: probe,
    isAvailable: isAvailable,
    play: play,
    stop: stop,
    stopAll: stopAll,
    preload: preload,
    setMuted: setMuted,
    isMuted: isMuted,
    unlock: unlock
  };
})(window);
