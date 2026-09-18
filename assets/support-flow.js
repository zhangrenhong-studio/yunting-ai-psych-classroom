/* 云听主动求助流程：当前为同一浏览器原型数据，真实上线需替换为服务端权限、通知与审计。 */
(function (global) {
  'use strict';
  var KEY = 'yunting-support-requests-v1';
  var STATUS = { pending: '待确认', acknowledged: '已确认收到', following: '跟进中', closed: '已完成' };

  function parse(text, fallback) { try { return JSON.parse(text); } catch (ignore) { return fallback; } }
  function all() {
    var rows = parse(global.localStorage.getItem(KEY), []);
    return Array.isArray(rows) ? rows : [];
  }
  function save(rows) { global.localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 100))); }
  function currentContext() {
    var s = global.YTClassroomDemo && global.YTClassroomDemo.read ? global.YTClassroomDemo.read() : {};
    return {
      sessionId: s.sessionId || null,
      courseId: s.courseId || null,
      courseTitle: s.courseTitle || '学生主动求助',
      classId: s.classId || null,
      className: s.className || '演示班级'
    };
  }
  function create(input) {
    input = input || {};
    var text = String(input.text || '').trim();
    if (!text) { return null; }
    var ctx = currentContext();
    var now = Date.now();
    var row = {
      id: 'support-' + now + '-' + Math.random().toString(36).slice(2, 7),
      studentId: input.studentId || 'demo-student-g7-3',
      studentName: input.studentName || '演示学生',
      source: input.source || '学生主动求助',
      text: text,
      consentAt: now,
      createdAt: now,
      status: 'pending',
      owner: '',
      acknowledgementAt: null,
      followUpAt: null,
      closedAt: null,
      note: '',
      sessionId: input.sessionId || ctx.sessionId,
      courseId: input.courseId || ctx.courseId,
      courseTitle: input.courseTitle || ctx.courseTitle,
      classId: input.classId || ctx.classId,
      className: input.className || ctx.className,
      demo: true
    };
    var rows = all(); rows.unshift(row); save(rows);
    try { global.dispatchEvent(new CustomEvent('yunting:support-created', { detail: row })); } catch (ignore) {}
    return row;
  }
  function update(id, patch) {
    var rows = all(), found = null;
    rows = rows.map(function (row) {
      if (row.id !== id) { return row; }
      found = Object.assign({}, row, patch || {}, { updatedAt: Date.now() });
      return found;
    });
    save(rows); return found;
  }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function renderInbox() {
    var rows = all();
    if (!rows.length) {
      return '<div class="support-empty"><b>目前没有待回应请求</b><p>学生明确选择“想让老师知道”或使用“现在需要大人帮助”后，请求会进入这里。</p></div>';
    }
    return '<div class="support-list">' + rows.map(function (row) {
      var time = new Date(row.createdAt).toLocaleString('zh-CN');
      return '<article class="support-card" data-support-id="' + escapeHtml(row.id) + '">' +
        '<div class="support-card-head"><div><span class="support-source">' + escapeHtml(row.source) + '</span><h3>' + escapeHtml(row.studentName) + ' · ' + escapeHtml(row.className) + '</h3></div><span class="support-status status-' + escapeHtml(row.status) + '">' + (STATUS[row.status] || '待确认') + '</span></div>' +
        '<blockquote>' + escapeHtml(row.text) + '</blockquote>' +
        '<p class="support-meta">' + escapeHtml(time) + ' · ' + escapeHtml(row.courseTitle || '非课堂求助') + '</p>' +
        (row.note ? '<p class="support-note"><b>跟进记录：</b>' + escapeHtml(row.note) + '</p>' : '') +
        '<div class="support-actions">' +
          (row.status === 'pending' ? '<button data-support-action="ack">确认收到</button>' : '') +
          (row.status !== 'closed' ? '<button data-support-action="follow">记录跟进</button><button data-support-action="close">完成处理</button>' : '<button data-support-action="reopen">重新打开</button>') +
        '</div></article>';
    }).join('') + '</div>';
  }
  function bindInbox(root, rerender) {
    if (!root) { return; }
    root.querySelectorAll('[data-support-action]').forEach(function (button) {
      button.onclick = function () {
        var card = button.closest('[data-support-id]'), id = card && card.getAttribute('data-support-id');
        if (!id) { return; }
        var action = button.getAttribute('data-support-action'), now = Date.now();
        if (action === 'ack') { update(id, { status: 'acknowledged', acknowledgementAt: now, owner: '当前老师' }); }
        if (action === 'follow') {
          var note = global.prompt('记录本次人工跟进（不会自动分析学生状态）：', '已与学生约定课后沟通');
          if (note == null) { return; }
          update(id, { status: 'following', followUpAt: now, owner: '当前老师', note: String(note).trim() });
        }
        if (action === 'close') {
          if (!global.confirm('确认这条请求已完成必要的人工回应？')) { return; }
          update(id, { status: 'closed', closedAt: now, owner: '当前老师' });
        }
        if (action === 'reopen') { update(id, { status: 'following', closedAt: null }); }
        if (rerender) { rerender(); }
      };
    });
  }

  function shouldInjectHelp() {
    var path = global.location.pathname.split('/').pop() || 'index.html';
    return ['index.html', 'student-space.html', 'daily-record.html', 'course.html'].indexOf(path) >= 0;
  }
  function injectHelp() {
    if (!shouldInjectHelp() || document.getElementById('urgent-help-button')) { return; }
    var button = document.createElement('button');
    button.id = 'urgent-help-button'; button.className = 'urgent-help-button';
    button.textContent = '现在需要大人帮助';
    button.onclick = openHelp;
    document.body.appendChild(button);
  }
  function openHelp() {
    if (document.getElementById('urgent-help-modal')) { return; }
    var modal = document.createElement('div'); modal.id = 'urgent-help-modal'; modal.className = 'urgent-help-modal';
    modal.innerHTML = '<div class="urgent-help-backdrop" data-close-help></div><section class="urgent-help-sheet" role="dialog" aria-modal="true" aria-labelledby="urgent-help-title"><button class="urgent-help-close" data-close-help aria-label="关闭">×</button><p class="urgent-help-kicker">主动求助</p><h2 id="urgent-help-title">你不需要一个人扛着</h2><p>如果你此刻可能伤害自己或别人，请先放下设备，立刻去找身边可信任的大人、老师或家长；遇到紧急危险请联系当地紧急服务。</p><label>我希望老师知道<textarea id="urgent-help-text" maxlength="300" placeholder="可以简单写发生了什么，或只写“我现在需要老师来找我”"></textarea></label><label class="urgent-consent"><input id="urgent-help-consent" type="checkbox"> 我确认把上面这段话交给老师人工查看</label><button class="urgent-help-submit" id="urgent-help-submit">提交给老师</button><p class="urgent-help-demo">当前是同一浏览器流程演示；提交后可在老师端“私密关注”看到。真实上线必须接入学校通知与人工响应机制。</p></section>';
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-close-help]').forEach(function (x) { x.onclick = function () { modal.remove(); }; });
    var ta = modal.querySelector('#urgent-help-text'); ta.focus();
    modal.querySelector('#urgent-help-submit').onclick = function () {
      var text = ta.value.trim(), consent = modal.querySelector('#urgent-help-consent').checked;
      if (!text) { ta.focus(); return; }
      if (!consent) { modal.querySelector('.urgent-consent').classList.add('needs-attention'); return; }
      var row = create({ text: text, source: '现在需要大人帮助' });
      modal.querySelector('.urgent-help-sheet').innerHTML = '<p class="urgent-help-kicker">已记录</p><h2>这条演示请求已进入老师端</h2><p>请求编号：' + escapeHtml(row && row.id) + '</p><p>真实使用中，系统还需要显示负责老师、预计回应时间和送达状态。若你此刻有危险，不要等待页面回应，请立即去找身边可信任的大人。</p><button class="urgent-help-submit" data-close-final>知道了</button>';
      modal.querySelector('[data-close-final]').onclick = function () { modal.remove(); };
    };
  }

  global.YTSupportFlow = { key: KEY, all: all, create: create, update: update, renderInbox: renderInbox, bindInbox: bindInbox, injectHelp: injectHelp };
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', injectHelp); } else { injectHelp(); }
})(window);
