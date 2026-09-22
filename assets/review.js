/* ==========================================================================
   云听 AI 智慧心理教室 · 观察材料视图
   --------------------------------------------------------------------------
   只读呈现本机留档。格式即老师会看到的格式：
     保留原话 + 主题上下文，不含任何标签、分级或判断。

   本页不做归纳、不打分、不生成摘要——归纳是老师的工作，不是系统的。
   ========================================================================== */

(function (global) {
  'use strict';

  var STAGE_LABEL = {
    enter: '进入课堂',
    story: '故事导入',
    talk: '和小悦悦聊聊',
    energy: '心理能量补给',
    playground: '成长训练场',
    closing: '收束与尾声'
  };

  var STAGE_ORDER = ['enter', 'story', 'talk', 'energy', 'playground', 'closing'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function timeOf(iso) {
    if (!iso) { return ''; }
    try {
      var d = new Date(iso);
      var p = function (n) { return n < 10 ? '0' + n : String(n); };
      return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    } catch (e) { return ''; }
  }

  /* --- 一节课的材料 --- */
  function courseHtml(rec) {
    var tr = rec.transcript || [];

    /* 按环节分组，保持环节的课程顺序 */
    var byStage = {};
    for (var i = 0; i < tr.length; i++) {
      var s = tr[i].stage || 'other';
      if (!byStage[s]) { byStage[s] = []; }
      byStage[s].push(tr[i]);
    }

    var body = '';
    for (var k = 0; k < STAGE_ORDER.length; k++) {
      var stageId = STAGE_ORDER[k];
      var items = byStage[stageId];
      if (!items || !items.length) { continue; }

      var rows = '';
      for (var j = 0; j < items.length; j++) {
        var it = items[j];
        var isSkip = it.raw == null;
        rows +=
          '<div class="rec-item">' +
            (it.prompt ? '<div class="rec-prompt">' + esc(it.prompt) + '</div>' : '') +
            (isSkip
              ? '<div class="rec-raw is-skipped">（这一步学生选择先不写）</div>'
              : '<div class="rec-raw">' + esc(it.raw) + '</div>') +
            '<div class="rec-time">' + esc(timeOf(it.at)) + '</div>' +
          '</div>';
      }

      body +=
        '<div class="rec-stage">' +
          '<div class="rec-stage-name">' + esc(STAGE_LABEL[stageId] || stageId) + '</div>' +
          rows +
        '</div>';
    }

    /* 收束摘要：颜色与出口。颜色不是等级，这里也不做任何解释。 */
    var closing = '';
    if (rec.pickedColorLabel || rec.pickedOutlet) {
      closing = '<div class="rec-closing">' +
        (rec.pickedColorLabel
          ? '<span>课后自选颜色：' + esc(rec.pickedColorLabel) + '</span>'
          : '<span>课后自选颜色：（未选）</span>') +
        (rec.pickedOutlet
          ? '<span>留下的出口：' + esc(rec.pickedOutletLabel || rec.pickedOutlet) + '</span>'
          : '') +
      '</div>';
    }

    var written = 0;
    for (var w = 0; w < tr.length; w++) { if (tr[w].raw) { written += 1; } }

    return '<section class="rec-course">' +
      '<div class="rec-course-head">' +
        '<span class="rec-course-title">' + esc(rec.courseTitle || rec.courseId) + '</span>' +
        '<span class="rec-meta">' +
          written + ' 处学生原话 · 开始于 ' + esc(timeOf(rec.startedAt)) +
        '</span>' +
        '<button class="rec-clear" data-clear="' + esc(rec.courseId) + '">清除这节课的本机留档</button>' +
      '</div>' +
      (body || '<div class="rec-stage"><div class="rec-stage-name">本课暂无学生输入</div></div>') +
      closing +
    '</section>';
  }

  function render() {
    var mount = document.getElementById('app');
    var all = global.YTStore.readRecord();

    var head =
      '<a class="review-back" href="student.html">← 回到课程库</a>' +
      '<div class="review-head">' +
        '<h1 class="t-title">主题观察材料</h1>' +
        '<p class="t-body">' +
          '这里呈现学生在课堂中写下的原话，以及当时对应的主题上下文。' +
        '</p>' +
        '<div class="review-rule">' +
          '<strong>这份材料不含任何标签。</strong>' +
          '系统不判断焦虑、抑郁、风险等级或其他心理结论，不输出疾病名称，' +
          '不给学生分级，也不生成摘要——归纳与研判由老师人工完成。' +
          '颜色选项不代表好坏或风险等级，学生也不需要解释选择原因。' +
          '<br><br>' +
          '所有内容仅保存在这台设备上，不联网、不外发。' +
          (global.YTStore.hasPersistentBacking()
            ? ''
            : '<br><br><strong>当前浏览器不支持本机存储，本次没有留存任何内容。</strong>') +
        '</div>' +
      '</div>';

    var keyList = [];
    for (var k in all) {
      if (Object.prototype.hasOwnProperty.call(all, k)) { keyList.push(k); }
    }

    var body;
    if (!all || !keyList.length) {
      body =
        '<div class="review-empty">' +
          '<h2 class="t-title">还没有材料</h2>' +
          '<p class="t-body">走完任意一节课后，学生在故事、对话、训练和收束中写下的原话会出现在这里。</p>' +
          '<div class="review-actions">' +
            '<a class="btn btn-primary" href="course.html?id=lesson-01">上第 1 节</a>' +
            '<a class="btn btn-quiet" href="course.html?id=lesson-02">上第 2 节</a>' +
          '</div>' +
        '</div>';
    } else {
      body = '';
      /* 按课程库顺序排，而不是按留档顺序 */
      var order = ['lesson-01', 'lesson-02'];
      for (var i = 0; i < order.length; i++) {
        if (all[order[i]]) { body += courseHtml(all[order[i]]); }
      }
      for (var j = 0; j < keyList.length; j++) {
        if (order.indexOf(keyList[j]) === -1) { body += courseHtml(all[keyList[j]]); }
      }
    }

    mount.innerHTML = '<div class="review">' + head + body + '</div>';

    var clears = mount.querySelectorAll('[data-clear]');
    for (var c = 0; c < clears.length; c++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          if (global.confirm('清除这节课在本机留下的全部内容？此操作不可撤销。')) {
            global.YTStore.clearRecord(btn.getAttribute('data-clear'));
            render();
          }
        });
      })(clears[c]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})(window);
