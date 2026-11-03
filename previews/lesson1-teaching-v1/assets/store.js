/* ==========================================================================
   云听 AI 智慧心理教室 · 本机会话存储
   --------------------------------------------------------------------------
   产品要求「学生的私密表达不出本机」。同时 localStorage 在 file:// 下并不可靠
   （Chrome 的分区语义不一致，Safari 可能直接抛 QuotaExceededError）。
   这两件事指向同一个做法：不依赖持久化，默认只在内存里活着。
   localStorage 只作为可选的进度缓存，且任何失败都必须静默降级。
   ========================================================================== */

(function (global) {
  'use strict';

  var PROGRESS_KEY = 'yunting.progress.v1';

  function probeLocalStorage() {
    try {
      var t = '__yunting_probe__';
      global.localStorage.setItem(t, '1');
      global.localStorage.removeItem(t);
      return global.localStorage;
    } catch (e) {
      return null;
    }
  }

  var backing = probeLocalStorage();
  var persistenceEnabled = true;

  /* --- 会话：唯一的学生数据容器，默认只活在内存里 --- */
  var session = {
    courseId: null,
    courseTitle: null,
    startedAt: null,
    stage: null,
    /* 保留原话 + 主题上下文。刻意不含任何标签、评分、分级字段——
       这是数据层的强制约束，不是使用规范。 */
    transcript: [],
    pickedColor: null,
    pickedColorLabel: null,
    pickedOutlet: null,
    pickedOutletLabel: null,
    finishedAt: null
  };

  /**
   * 记一条学生原话。
   * @param {Object} e { stage, nodeId, prompt, raw }
   */
  function record(e) {
    var raw = e.raw == null ? '' : String(e.raw);
    if (!raw.trim()) { return null; }

    var entry = {
      at: new Date().toISOString(),
      stage: e.stage || '',
      nodeId: e.nodeId || '',
      prompt: e.prompt || '',   // 主题上下文：学生当时在回答什么问题
      raw: raw.trim()           // 原话，不做任何改写
    };
    session.transcript.push(entry);
    persist();
    return entry;
  }

  /** 学生明确选择「不写」时，也留一条痕迹（但没有内容）。 */
  function recordSkip(e) {
    session.transcript.push({
      at: new Date().toISOString(),
      stage: e.stage || '',
      nodeId: e.nodeId || '',
      prompt: e.prompt || '',
      raw: null,
      skipped: true
    });
    persist();
  }

  /* --- 本机留档 ------------------------------------------------------------
     评审视图需要跨页面读到观察材料，所以这里落到 localStorage。
     数据始终不出本机、不联网；localStorage 不可用时静默跳过，
     评审视图会明确说明"本次没有留存"而不是假装有数据。
     ---------------------------------------------------------------------- */
  var RECORD_KEY = 'yunting.records.v1';

  function snapshot() {
    return {
      courseId: session.courseId,
      courseTitle: session.courseTitle,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      pickedColor: session.pickedColor,
      pickedColorLabel: session.pickedColorLabel,
      pickedOutlet: session.pickedOutlet,
      pickedOutletLabel: session.pickedOutletLabel,
      transcript: session.transcript
    };
  }

  function persist() {
    if (!persistenceEnabled || !backing || !session.courseId) { return; }
    try {
      var all = readAll() || {};
      all[session.courseId] = snapshot();   // 按课程分开留档，两节课的都能看到
      backing.setItem(RECORD_KEY, JSON.stringify(all));
    } catch (e) { /* 留档失败不影响课堂 */ }
  }

  function readAll() {
    if (!backing) { return null; }
    try {
      var raw = backing.getItem(RECORD_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /** 读取某一节课的本机留档（评审视图用）。不传则返回全部。 */
  function readRecord(courseId) {
    var all = readAll();
    if (!all) { return null; }
    return courseId ? (all[courseId] || null) : all;
  }

  function clearRecord(courseId) {
    if (!backing) { return; }
    try {
      if (!courseId) { backing.removeItem(RECORD_KEY); return; }
      var all = readAll();
      if (all && all[courseId]) {
        delete all[courseId];
        backing.setItem(RECORD_KEY, JSON.stringify(all));
      }
    } catch (e) { /* 忽略 */ }
  }

  function start(course) {
    session.courseId = course.id;
    session.courseTitle = course.title;
    session.startedAt = new Date().toISOString();
    session.stage = 'enter';
    session.transcript = [];
    session.pickedColor = null;
    session.pickedColorLabel = null;
    session.pickedOutlet = null;
    session.pickedOutletLabel = null;
    session.finishedAt = null;
  }

  function get() { return session; }

  /* --- 进度缓存：可选、尽力而为、失败即忘 --- */
  function saveProgress(stageId) {
    session.stage = stageId;
    if (!persistenceEnabled || !backing) { return; }
    try {
      backing.setItem(PROGRESS_KEY, JSON.stringify({
        courseId: session.courseId,
        stage: stageId,
        at: new Date().toISOString()
      }));
    } catch (e) { /* 缓存失败不影响课堂 */ }
  }

  function readProgress() {
    if (!backing) { return null; }
    try {
      var raw = backing.getItem(PROGRESS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearProgress() {
    if (!backing) { return; }
    try { backing.removeItem(PROGRESS_KEY); } catch (e) { /* 忽略 */ }
  }

  global.YTStore = {
    session: session,
    start: start,
    get: get,
    record: record,
    recordSkip: recordSkip,
    commit: persist,            // 直接改过 session 字段后，调一次落档
    readRecord: readRecord,     // 评审视图用
    clearRecord: clearRecord,
    saveProgress: saveProgress,
    readProgress: readProgress,
    clearProgress: clearProgress,
    setPersistence: function (enabled) { persistenceEnabled = enabled !== false; },
    hasPersistentBacking: function () { return !!backing; }
  };
})(window);
