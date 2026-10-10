/* Human completion is independent of reached stages and student preview progress. */
(function (g) {
  'use strict';
  var fields = ['classId', 'classIds', 'className', 'courseId', 'courseType', 'progressMode', 'themeLessonId', 'themeLessonTitle', 'themeTopicId', 'themeTopicTitle', 'themeDimensionId', 'themeDimensionName', 'themeEntryMode', 'themeStorySnapshot', 'completionStatus', 'completed', 'completedAt', 'completionConfirmedBy', 'completionConfirmedAt', 'endDecision'];
  function snapshot(s, previous) {
    var out = Object.assign({}, previous || {});
    fields.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(s, key)) out[key] = s[key] == null ? s[key] : JSON.parse(JSON.stringify(s[key]));
    });
    out.courseType = out.courseType || 'syllabus';
    out.progressMode = out.progressMode || 'teacher';
    if (!out.completionStatus) {
      out.completed = out.completed === true || !!out.completedAt;
      out.completionStatus = out.completed ? 'completed' : 'unconfirmed';
    }
    return out;
  }
  function recordsUrl(s) {
    var ids = Array.isArray(s.classIds) ? s.classIds : String(s.classId || '').split(',').filter(Boolean);
    ids = Array.from(new Set(ids.map(String)));
    return 'teacher.html?view=records' + (ids.length === 1 ? '&scopeClass=' + encodeURIComponent(ids[0]) : '');
  }
  function mark(s, done) {
    var now = Date.now();
    s.completed = done;
    s.completionStatus = done ? 'completed' : 'unconfirmed';
    s.completedAt = done ? now : null;
    s.completionConfirmedBy = 'teacher';
    s.completionConfirmedAt = now;
    s.endDecision = done ? 'completed' : 'interrupted';
    return s;
  }
  function resume(s) {
    if (!s.active || s.status !== 'live' || !s.completionConfirmedAt) return false;
    // teacher.html restores the session but replaces its record. Repair on console entry.
    // Resuming invalidates the previous end decision; the next end requires a fresh choice.
    s.previousEndDecision = {endDecision: s.endDecision, completedAt: s.completedAt, confirmedAt: s.completionConfirmedAt};
    s.completed = false;
    s.completionStatus = 'unconfirmed';
    s.completedAt = null;
    s.completionConfirmedBy = null;
    s.completionConfirmedAt = null;
    s.endDecision = null;
    return true;
  }
  function choose(onChoice) {
    if (document.getElementById('class-end-choice')) return;
    var focus = document.activeElement, dialog = document.createElement('dialog');
    dialog.id = 'class-end-choice';
    dialog.setAttribute('aria-labelledby', 'class-end-title');
    dialog.style.cssText = 'margin:auto;inset:0;border:1px solid #c7ded9;border-radius:18px;padding:24px;width:min(420px,calc(100vw - 40px));box-sizing:border-box;color:#173e45;box-shadow:0 20px 70px #173e4533';
    dialog.innerHTML = '<h2 id="class-end-title" style="margin:0 0 12px;font-size:22px">这堂课上完了吗？</h2><p style="line-height:1.7;color:#60777b">自动保存课堂记录；结束后 10 分钟内可恢复。</p><div style="display:flex;flex-wrap:wrap;gap:10px"><button type="button" data-end-choice="completed" style="flex:1;min-height:44px;background:#14796b;color:white;border:0;border-radius:10px">已上完</button><button type="button" data-end-choice="interrupted" style="flex:1;min-height:44px;background:#fff;margin:auto;inset:0;border:1px solid #c7ded9;border-radius:10px;color:#173e45">中途结束</button></div><button type="button" data-end-cancel style="margin-top:16px;min-height:36px;border:0;background:transparent;color:#60777b">继续上课</button>';
    document.body.appendChild(dialog);
    function close() { dialog.close(); dialog.remove(); if (focus && focus.isConnected) focus.focus(); }
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    dialog.querySelector('[data-end-cancel]').onclick = close;
    dialog.querySelectorAll('[data-end-choice]').forEach(function (button) {
      button.onclick = function () { var done = button.dataset.endChoice === 'completed'; close(); onChoice(done); };
    });
    dialog.showModal();
    dialog.querySelector('[data-end-cancel]').focus();
  }
  g.YTClassEndCompletion = {snapshot: snapshot, recordsUrl: recordsUrl, mark: mark, resume: resume, choose: choose};
})(window);
