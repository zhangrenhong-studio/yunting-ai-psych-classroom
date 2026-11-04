/* First-lesson teaching support. Read-only with respect to classroom progress. */
(function () {
  'use strict';
  if (window.YTTeacherSupport) return;
  var stages = ['enter', 'story', 'talk', 'energy', 'playground', 'closing'];
  var storageKey = 'yunting-lesson-01-teaching-guide-open-v1';
  var expanded = Object.create(null);
  var dialog = null;
  var returnFocus = null;
  var returnLocator = null;
  try {
    var saved = JSON.parse(window.sessionStorage.getItem(storageKey) || '{}');
    stages.forEach(function (stage) {
      if (typeof saved[stage] === 'boolean') expanded[stage] = saved[stage];
    });
  } catch (ignore) { /* Storage may be unavailable in private browsing. */ }

  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function data() {
    var value = window.YTLesson1Support;
    return value && value.courseId === 'lesson-01' ? value : null;
  }
  function remember(stage, value) {
    expanded[stage] = value;
    try { window.sessionStorage.setItem(storageKey, JSON.stringify(expanded)); } catch (ignore) {}
  }
  function list(items) {
    return '<ul class="yt-teaching-list">' + (Array.isArray(items) ? items : []).map(function (text) {
      return '<li class="yt-teaching-item">' + escape(text) + '</li>';
    }).join('') + '</ul>';
  }
  function courseButton(id) {
    if (id !== 'lesson-01' || !data()) return '';
    return '<button type="button" class="yt-teaching-plan-button" data-yt-teaching-open="lesson-01" aria-haspopup="dialog">查看教案<span class="yt-teaching-button-arrow" aria-hidden="true"> ↗</span></button>';
  }
  function segmentSections(items) {
    function block(title, texts, extra) { return texts && texts.length ? '<section class="yt-teaching-segment-section '+(extra||'')+'"><h4>'+escape(title)+'</h4>'+texts.map(function(t){return '<p>'+escape(t)+'</p>';}).join('')+'</section>' : ''; }
    return '<div class="yt-teaching-segments">'+items.map(function(s,i){return '<article class="yt-teaching-segment"><div class="yt-teaching-segment-head"><h3>'+escape(s.title)+'</h3><small>'+escape(s.time)+'</small></div>'+block('老师怎么组织',s.lead)+block('可以这样问',s.questions,'yt-teaching-questions')+block('讲解与讨论重点',s.discuss)+block('学生怎么做',s.student)+block('小结可以这样说',[s.summary],'yt-teaching-segment-summary')+'</article>';}).join('')+'</div>';
  }
  function viewKey(stage, state) {
    var s=state||{};
    if(stage==='story')return s.lesson1StoryPhase==='knowledge'?'knowledge':'story';
    if(stage==='talk')return s.lesson1Presentation&&s.lesson1Presentation.mode==='summary'?'methods':'discussion';
    if(stage==='closing')return s.lesson1ClosingPhase==='summary'?'summary':'goal';
    return stage;
  }
  function questionSummaryContent(item) {
    return '<section class="yt-teacher-copy yt-teacher-questions"><h3>教师提问</h3>'+item.questions.map(function(text){return '<p>'+escape(text)+'</p>';}).join('')+'</section><section class="yt-teacher-copy yt-teacher-conclusion"><h3>教师小结</h3>'+item.summary.map(function(text){return '<p>'+escape(text)+'</p>';}).join('')+'</section>';
  }
  function guide(stage, segmentIndex) {
    var value = data();
    if (!value || stages.indexOf(stage) < 0 || !value.guides || !value.guides[stage]) return '';
    var currentView = typeof segmentIndex==='string'?segmentIndex:viewKey(stage,window.YTClassroomDemo?window.YTClassroomDemo.read():{});
    var item = value.screenGuides&&value.screenGuides[currentView] || value.guides[stage];
    var current = document.querySelector('.yt-teaching-guide[data-yt-teaching-stage="'+stage+'"]');
    if(current)expanded[stage]=current.open;
    if(item.questions||item.brief)return '<details class="yt-teaching-guide" data-yt-teaching-stage="'+stage+'" data-yt-teaching-view="'+escape(currentView)+'"'+(expanded[stage]===false?'':' open')+'><summary class="yt-teaching-guide-summary"><span class="yt-teaching-stage-label">教学提醒 · '+escape(item.label)+'</span><span class="yt-teaching-header-actions"><button type="button" class="yt-teaching-header-plan" data-yt-teaching-open="lesson-01" data-yt-teaching-source-stage="'+stage+'" aria-haspopup="dialog">查看教案</button><span class="yt-teaching-chevron" aria-hidden="true">⌄</span></span></summary><div class="yt-teaching-guide-content">'+(item.questions?questionSummaryContent(item):item.brief.map(function(x){return '<p class="yt-teaching-brief"><b>'+escape(x[0])+'</b>'+escape(x[1])+'</p>';}).join(''))+'</div></details>';
    // Sample the live element before a host innerHTML render, including the tiny
    // interval before the asynchronous native toggle event is dispatched.
    var live = document.querySelector('.yt-teaching-guide[data-yt-teaching-stage="' + stage + '"]');
    if (live) expanded[stage] = live.open;
    return '<details class="yt-teaching-guide" data-yt-teaching-stage="' + stage + '"' + (expanded[stage] === false ? '' : ' open') + '>' +
      '<summary class="yt-teaching-guide-summary"><span class="yt-teaching-guide-heading"><span class="yt-teaching-eyebrow">课堂教学指引</span><strong class="yt-teaching-stage-label">当前环节 · ' + escape(item.label) + '</strong></span>' +
      '<span class="yt-teaching-guide-meta"><span class="yt-teaching-duration">参考时长 ' + escape(item.time) + '</span><span class="yt-teaching-chevron" aria-hidden="true">⌄</span></span></summary>' +
      '<div class="yt-teaching-guide-content"><p class="yt-teaching-progress-note">自主探索模式下也可查看对应环节的教学指引；查看或折叠指引不影响学生进度。</p>' +
      (item.segments ? segmentSections(typeof segmentIndex==='number'&&item.segments[segmentIndex]?[item.segments[segmentIndex]]:item.segments) : '<div class="yt-teaching-activities"><section class="yt-teaching-activity"><h3 class="yt-teaching-activity-title">教师活动</h3>' + list(item.teacher) + '</section><section class="yt-teaching-activity"><h3 class="yt-teaching-activity-title">学生活动</h3>' + list(item.student) + '</section></div><section class="yt-teaching-summary"><h3 class="yt-teaching-activity-title">教师小结</h3><p class="yt-teaching-summary-text">' + escape(item.summary) + '</p></section>') +
      '<div class="yt-teaching-guide-footer"><button type="button" class="yt-teaching-text-button" data-yt-teaching-open="lesson-01" data-yt-teaching-source-stage="' + stage + '" aria-haspopup="dialog">查看完整教案 <span aria-hidden="true">→</span></button></div></div></details>';
  }
  function download(path, label, kind) {
    if (!path) return '';
    // Only same-origin document URLs; never insert executable or remote links.
    try {
      var url = new URL(path, document.baseURI);
      if (url.origin !== window.location.origin || !/\.docx$|\.pdf$/i.test(url.pathname) || !/^https?:$|^file:$/.test(url.protocol)) return '';
      return '<a class="yt-teaching-download" href="' + escape(url.href) + '" download="' + escape(url.pathname.split('/').pop()) + '"><span class="yt-teaching-file-kind">' + kind + '</span>' + label + '</a>';
    } catch (ignore) { return ''; }
  }
  function focusables() {
    return Array.prototype.filter.call(dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]'), function (el) {
      return el.getClientRects().length > 0;
    });
  }
  function restoreFocus() {
    var target = returnFocus && returnFocus.isConnected ? returnFocus : null;
    if (!target && returnLocator) target = document.querySelector(returnLocator);
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
    returnFocus = null;
    returnLocator = null;
  }
  function closePlan() {
    if (!dialog || !dialog.open) return;
    dialog.close();
  }
  function ensureDialog() {
    if (dialog && dialog.isConnected) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'yt-teaching-dialog';
    dialog.setAttribute('aria-labelledby', 'yt-teaching-plan-title');
    dialog.setAttribute('aria-describedby', 'yt-teaching-plan-description');
    dialog.addEventListener('click', function (event) {
      if (event.target.closest('[data-yt-teaching-close]')) { closePlan(); return; }
      if (event.target !== dialog) return;
      var rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closePlan();
    });
    dialog.addEventListener('cancel', function (event) { event.preventDefault(); closePlan(); });
    dialog.addEventListener('close', restoreFocus);
    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closePlan(); return; }
      if (event.key !== 'Tab') return;
      var items = focusables();
      if (!items.length) { event.preventDefault(); dialog.focus(); return; }
      var first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
    });
    // The host replaces its classroom sidebar, not this body-level singleton.
    document.body.appendChild(dialog);
    return dialog;
  }
  function openPlan() {
    var value = data();
    if (!value || !value.plan || !document.body) return;
    var modal = ensureDialog();
    if (modal.open) return;
    returnFocus = document.activeElement;
    var sourceStage = returnFocus && returnFocus.getAttribute('data-yt-teaching-source-stage');
    returnLocator = stages.indexOf(sourceStage) >= 0 ? '[data-yt-teaching-source-stage="' + sourceStage + '"]' : '[data-yt-teaching-open="lesson-01"]';
    modal.innerHTML = '<div class="yt-teaching-dialog-layout"><header class="yt-teaching-dialog-header"><div class="yt-teaching-dialog-heading"><span class="yt-teaching-eyebrow">第一课 · 教师教案</span><h2 class="yt-teaching-plan-title" id="yt-teaching-plan-title">' + escape(value.title) + '</h2><p class="yt-teaching-plan-description" id="yt-teaching-plan-description">全文在线预览 · 可下载 Word 或 PDF 备课使用</p></div><button type="button" class="yt-teaching-close" data-yt-teaching-close aria-label="关闭教案预览" autofocus>×</button></header>' +
      '<nav class="yt-teaching-downloads" aria-label="下载教师教案">' + download(value.plan.docx, '下载 Word', 'W') + download(value.plan.pdf, '下载 PDF', 'PDF') + '</nav>' +
      '<article class="yt-teaching-plan-body" tabindex="0" aria-label="教案全文">' + (Array.isArray(value.plan.sections) ? value.plan.sections : []).map(function (section) {
        return '<section class="yt-teaching-plan-section"><h3 class="yt-teaching-section-title">' + escape(section.heading) + '</h3>' + (Array.isArray(section.paragraphs) ? section.paragraphs : []).map(function (paragraph) {
          return '<p class="yt-teaching-plan-paragraph">' + escape(paragraph) + '</p>';
        }).join('') + '</section>';
      }).join('') + '</article></div>';
    modal.showModal();
    modal.querySelector('[data-yt-teaching-close]').focus({ preventScroll: true });
  }
  document.addEventListener('click', function (event) {
    var target = event.target.closest && event.target.closest('[data-yt-teaching-open="lesson-01"]');
    if (!target) return;
    event.preventDefault();
    // Explicitly retain the invoker even in browsers which do not focus clicked buttons.
    target.focus({ preventScroll: true });
    openPlan();
  });
  // toggle does not bubble. Capture it, and ignore events from replaced nodes.
  document.addEventListener('toggle', function (event) {
    var target = event.target;
    if (!target.matches || !target.matches('.yt-teaching-guide[data-yt-teaching-stage]') || !target.isConnected) return;
    var stage = target.getAttribute('data-yt-teaching-stage');
    if (stages.indexOf(stage) >= 0) remember(stage, target.open);
  }, true);
  window.YTTeacherSupport = { courseButton: courseButton, guide: guide, viewKey: viewKey, openPlan: openPlan };
})();
