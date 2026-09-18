/* 云听课堂场次桥接：当前仅用于同一浏览器中的可验证平台演示。
   真实学校使用需替换为服务端会话、班级成员权限和实时推送。 */
(function (global) {
  'use strict';
  var KEY = 'yunting-classroom-demo-v1';
  var CHANNEL = 'yunting-classroom-demo-channel';
  var bc = null;
  try { bc = global.BroadcastChannel ? new global.BroadcastChannel(CHANNEL) : null; } catch (ignore) {}

  function safeParse(text) { try { return JSON.parse(text); } catch (ignore) { return null; } }
  function read() {
    var raw = null;
    try { raw = global.localStorage.getItem(KEY); } catch (ignore) {}
    var state = safeParse(raw) || { active: false, stage: 'enter', courseId: null, className: '', courseTitle: '' };
    /* 兼容六环节改版前已保存在浏览器里的“体验训练”场次。 */
    if (state.stage === 'practice') { state.stage = 'energy'; }
    if (state.studentStage === 'practice') { state.studentStage = 'energy'; }
    if (Array.isArray(state.reachedStages)) {
      state.reachedStages = state.reachedStages.map(function (x) { return x === 'practice' ? 'energy' : x; });
    }
    if (state.studentProgress && state.studentProgress.practice && !state.studentProgress.energy) {
      state.studentProgress.energy = state.studentProgress.practice;
      delete state.studentProgress.practice;
    }
    return state;
  }
  function write(next) {
    next.updatedAt = Date.now();
    try { global.localStorage.setItem(KEY, JSON.stringify(next)); } catch (ignore) {}
    if (bc) { try { bc.postMessage(next); } catch (ignore) {} }
    return next;
  }
  function subscribe(fn) {
    function signal() { fn(read()); }
    global.addEventListener('storage', function (e) { if (e.key === KEY) { signal(); } });
    if (bc) { bc.onmessage = signal; }
    var timer = global.setInterval(signal, 1000);
    return function () { global.clearInterval(timer); if (bc) { bc.close(); } };
  }
  global.YTClassroomDemo = { key: KEY, read: read, write: write, subscribe: subscribe };
})(window);
