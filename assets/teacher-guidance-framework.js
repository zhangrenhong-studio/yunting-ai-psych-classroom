/* Teacher-only guide framework, schemaVersion: 1.
 * Load teacher-guidance-content.js first. Contract:
 * window.YTTeacherGuideContent = {schemaVersion:1,courses:{[courseId]:{
 *   title, status:'sample'|'pending', views:{[view]:{focus:[],explain:[],close:[]}}
 * }}}. Values are plain text; never HTML. Missing views/fields remain explicitly pending.
 * Views: enter/story/knowledge/discussion/methods/energy/playground/goal/summary;
 * legacy closing also exposes mood/message. No classroom writes, message reads or polling.
 * Public read-only API: state() returns a frozen diagnostic snapshot; refresh() rechecks
 * current state/visible structural view, but never rebuilds an unchanged render key.
 */
(function (g) {
  'use strict';
  if (g.YTTeacherGuideFramework) return;
  var pane, frame, body, observer, pending = null, current = null, content, toggle, plan, label, notice;
  var memory = Object.create(null), storageKey = 'yt-teacher-guide-ui-v1';
  var names = {enter:'课堂导入',story:'故事与问题',knowledge:'心理知识',discussion:'交流讨论',methods:'方法小结',energy:'音频干预',playground:'成长训练场',goal:'我的小目标',summary:'课堂总结',mood:'心情选择',message:'心语留言'};
  try { memory = JSON.parse(g.sessionStorage.getItem(storageKey) || '{}') || Object.create(null); } catch (ignore) {}
  function persist() { try { g.sessionStorage.setItem(storageKey, JSON.stringify(memory)); } catch (ignore) {} }
  function position() {
    if (!current || !content) return;
    var saved = memory[current.key];
    memory[current.key] = {scroll:content.hidden && saved ? saved.scroll : content.scrollTop, collapsed:toggle.getAttribute('aria-expanded') === 'false'};
    persist();
  }
  function visible(el) {
    if (!el || !el.isConnected) return false;
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (n.hidden || n.classList.contains('is-hidden') || n.getAttribute('aria-hidden') === 'true') return false;
      var style = n.ownerDocument.defaultView.getComputedStyle(n);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
    }
    return el.getClientRects().length > 0;
  }
  function anyVisible(root, selector) {
    return Array.prototype.some.call(root.querySelectorAll(selector), visible);
  }
  function viewOf(s, stage) {
    if (s.courseId === 'lesson-01') {
      if (stage === 'story') return s.lesson1StoryPhase === 'knowledge' ? 'knowledge' : 'story';
      if (stage === 'talk') return s.lesson1Presentation && s.lesson1Presentation.mode === 'summary' ? 'methods' : 'discussion';
      if (stage === 'closing') return s.lesson1ClosingPhase === 'summary' ? 'summary' : 'goal';
      return stage;
    }
    var base = stage === 'talk' ? 'discussion' : stage === 'closing' ? 'mood' : stage;
    try {
      var d = frame && frame.contentDocument;
      if (!d) return base;
      var roots = d.querySelectorAll('[data-stage="' + stage + '"]');
      var root = Array.prototype.find.call(roots, visible);
      if (!root) return base;
      if (stage === 'story' && (root.dataset.view === 'learn' || anyVisible(root, '.r99-explanation,.r104-knowledge-panel,.story-reveal,.classroom-knowledge'))) return 'knowledge';
      if (stage === 'closing') {
        if (anyVisible(root, '[data-step="end"]')) return 'summary';
        if (anyVisible(root, '[data-step="leave"]')) return 'message';
        return 'mood';
      }
    } catch (ignore) { /* Cross-origin previews do not expose structural view state. */ }
    return base;
  }
  function el(tag, cls, text) {
    var node = document.createElement(tag); if (cls) node.className = cls;
    if (text != null) node.textContent = text; return node;
  }
  function collapse(value) {
    position();
    var scroll = current && memory[current.key] ? memory[current.key].scroll : content.scrollTop;
    toggle.setAttribute('aria-expanded', String(!value));
    toggle.textContent = value ? '展开提示' : '收起提示';
    content.hidden = value;
    if (!value) content.scrollTop = scroll || 0;
    pane.classList.toggle('yt-guide-folded', value);
    syncLegacyButton(); position();
  }
  function syncLegacyButton() {
    document.body.classList.remove('l1-guide-hidden');
    var old = document.querySelector('.l1-guide-toggle');
    if (!old || !toggle) return;
    old.textContent = content.hidden ? '展开教学提示' : '收起教学提示';
    old.setAttribute('aria-expanded', String(!content.hidden));
    old.onclick = function (e) { e.preventDefault(); e.stopPropagation(); collapse(!content.hidden); };
  }
  function mount() {
    if (pane) return true;
    pane = document.getElementById('lesson1TeachingPane') || document.getElementById('teacherGuidancePane');
    if (!pane) return false;
    frame = document.getElementById('studentView'); body = document.body;
    body.classList.add('yt-teacher-guide-enabled');
    pane.classList.add('yt-guide-pane'); pane.hidden = false; pane.setAttribute('data-teacher-guidance','');
    pane.setAttribute('aria-label', '当前画面教学提示');
    pane.replaceChildren();
    var head = el('header', 'yt-guide-head'), heading = el('div', 'yt-guide-heading');
    heading.appendChild(el('h2', '', '教学提示')); label = el('p', 'yt-guide-label'); heading.appendChild(label);
    var actions = el('div', 'yt-guide-actions');
    plan = el('button', 'yt-guide-plan', '查看完整教案'); plan.type = 'button';
    plan.onclick = function (event) {
      event.preventDefault(); event.stopPropagation();
      if (!plan.disabled && g.YTTeacherSupport && typeof g.YTTeacherSupport.openPlan === 'function') {
        plan.focus({preventScroll:true}); g.YTTeacherSupport.openPlan();
      }
    };
    toggle = el('button', 'yt-guide-toggle', '收起提示'); toggle.type = 'button'; toggle.setAttribute('data-guide-toggle','');
    toggle.setAttribute('aria-controls', 'ytTeacherGuideContent'); toggle.setAttribute('aria-expanded', 'true');
    toggle.onclick = function (event) { event.preventDefault(); event.stopPropagation(); collapse(!content.hidden); };
    actions.append(plan, toggle); head.append(heading, actions);
    content = el('div', 'yt-guide-scroll'); content.id = 'ytTeacherGuideContent'; content.tabIndex = 0; content.setAttribute('data-guide-scroll','');
    content.setAttribute('role', 'region'); content.setAttribute('aria-label', '本页三块教学提示，可独立滚动');
    content.addEventListener('scroll', position, {passive:true});
    notice = el('p', 'yt-guide-notice'); notice.id = 'ytTeacherGuideNotice';
    plan.setAttribute('aria-describedby', notice.id);
    pane.append(head, content);
    if (frame) { frame.addEventListener('load', function () { observeFrame(); schedule(); }); observeFrame(); }
    return true;
  }
  function pendingCopy(field) {
    return {focus:'本页理解重点待接本课 PPT 与教案；当前为教学提示框架，尚无已确认的本页内容。',explain:'本页讲解、例子与提问待接本课 PPT 后补充，不将通用话术作为本课已定稿教案。',close:'本页小结与下一步衔接待接本课 PPT 后确认。请以已有课程画面与实际教学安排为准。'}[field];
  }
  function refresh() {
    if (!g.YTClassroomDemo || !mount()) return null;
    var s = g.YTClassroomDemo.read() || {};
    // Keep original first-lesson controls/workspace available, without its old guide renderer.
    body.classList.toggle('lesson1-teaching-live', s.courseId === 'lesson-01' && s.status === 'live');
    syncLegacyButton();
    var stage = s.progressMode === 'student' ? (s.teacherPreviewStage || s.stage || 'enter') : (s.stage || 'enter');
    var view = viewOf(s, stage), mode = s.progressMode === 'student' ? 'student' : 'teacher';
    var key = JSON.stringify([s.sessionId || '',s.courseId || '',view,mode]);
    if (current && current.key === key) return snapshot();
    position();
    var data = g.YTTeacherGuideContent, course = data && data.schemaVersion === 1 && data.courses && data.courses[s.courseId];
    var item = course && course.views && course.views[view];
    var missing = !item || ['focus','explain','close'].some(function (field) { return !Array.isArray(item[field]) || !item[field].length; });
    current = {key:key,sessionId:s.sessionId || '',courseId:s.courseId || '',stage:stage,view:view,mode:mode,status:course && course.status || 'pending',pending:missing};
    pane.dataset.guideKey = key; pane.dataset.guideView = view; pane.dataset.guideStage = stage; pane.dataset.contentStatus = current.status;
    label.textContent = (names[view] || '当前画面') + ' · ' + (mode === 'student' ? '自主探索' : '统一授课');
    var available = s.courseId === 'lesson-01' && g.YTTeacherSupport && typeof g.YTTeacherSupport.openPlan === 'function' && g.YTLesson1Support && g.YTLesson1Support.plan;
    plan.disabled = !available;
    plan.title = available ? '打开第一课完整教案，不影响课堂进度' : '本课完整教案尚未上传';
    if (available) { plan.setAttribute('aria-haspopup','dialog'); plan.setAttribute('data-yt-teaching-source-stage',stage); }
    else { plan.removeAttribute('aria-haspopup'); plan.removeAttribute('data-yt-teaching-source-stage'); }
    content.replaceChildren();
    notice.textContent = missing ? '内容待接 PPT · 本页尚未完成教学内容确认' : current.status === 'sample' ? '第一课示例内容 · 随当前课堂画面切换' : '随当前课堂画面切换';
    if (!available) notice.textContent += '；完整教案尚未上传。';
    content.appendChild(notice);
    [['focus','本页理解重点'],['explain','可以怎么讲／怎么问'],['close','小结与下一步']].forEach(function (entry) {
      var field = entry[0], section = el('section', 'yt-guide-block yt-guide-' + field); section.setAttribute('data-guide-section',field);
      section.appendChild(el('h3','',entry[1]));
      if (field === 'explain' && mode === 'student') section.appendChild(el('p','yt-guide-mode-note','自主探索时，先简短布置本页任务，再巡视与提供个别支持；不必持续讲解，也不要求公开个人对话或目标。'));
      var lines = item && Array.isArray(item[field]) && item[field].length ? item[field] : [pendingCopy(field)];
      lines.forEach(function (text) { section.appendChild(el('p','',String(text))); });
      content.appendChild(section);
    });
    var saved = memory[key] || {scroll:0,collapsed:false};
    content.hidden = !!saved.collapsed;
    toggle.setAttribute('aria-expanded',String(!saved.collapsed)); toggle.textContent = saved.collapsed ? '展开提示' : '收起提示';
    pane.classList.toggle('yt-guide-folded',!!saved.collapsed);
    content.scrollTop = saved.scroll || 0;
    syncLegacyButton();
    return snapshot();
  }
  function snapshot() {
    return Object.freeze(Object.assign({}, current || {}, {collapsed:!!(content && content.hidden),scrollTop:content ? content.scrollTop : 0,schemaVersion:1}));
  }
  function schedule() {
    if (pending !== null) return;
    pending = g.setTimeout(function () { pending = null; refresh(); }, 45);
  }
  function observeFrame() {
    if (observer) observer.disconnect();
    try {
      var d = frame && frame.contentDocument;
      if (!d || !d.body) return;
      observer = new MutationObserver(function (mutations) {
        // Structural selectors only. Never read textContent, inputs, chat records or private goals.
        var relevant = mutations.some(function (m) {
          var n = m.target.nodeType === 1 ? m.target : m.target.parentElement;
          if (!n) return false;
          if (m.type === 'attributes') return n.matches('[data-stage],[data-step],.r99-explanation,.story-reveal,.classroom-knowledge') || n.id === 'app' || n.classList.contains('stage-host');
          return n.id === 'app' || n.classList.contains('stage-host') || n.matches('[data-stage="story"],[data-stage="closing"],.r101-paper') || Array.prototype.some.call(m.addedNodes, function (added) { return added.nodeType === 1 && added.matches('[data-stage],.r99-explanation,.classroom-knowledge'); });
        });
        if (relevant) schedule();
      });
      observer.observe(d.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','data-view','aria-hidden']});
    } catch (ignore) {}
  }
  g.YTTeacherGuideFramework = Object.freeze({state:snapshot,refresh:refresh});
  // Existing workspace owns its top-bar controls. Retain them, replacing only its old
  // whole-pane hide action with this framework's per-view collapse action.
  if (g.YTInteractiveWorkspace && typeof g.YTInteractiveWorkspace.update === 'function') {
    var oldUpdate = g.YTInteractiveWorkspace.update;
    g.YTInteractiveWorkspace.update = function () { var result = oldUpdate.apply(this,arguments); syncLegacyButton(); return result; };
  }
  if (g.YTClassroomDemo) g.YTClassroomDemo.subscribe(schedule);
  g.addEventListener('pagehide',position);
  refresh();
})(window);
