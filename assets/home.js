/* 学生端：首页为固定单屏；老师开课后仍由既有课堂状态接管。 */
(function (global) {
  'use strict';

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function getRecords() {
    try { return JSON.parse(global.localStorage.getItem('yunting-class-records-v1')) || []; }
    catch (ignore) { return []; }
  }

  function setRecords(rows) {
    try { global.localStorage.setItem('yunting-class-records-v1', JSON.stringify(rows)); }
    catch (ignore) {}
  }

  function remember(state) {
    if (!state || !state.courseId || !state.sessionId) { return; }
    var rows = getRecords();
    var index = rows.findIndex(function (row) { return row && row.sessionId === state.sessionId; });
    var snapshot = {
      sessionId: state.sessionId,
      title: state.courseTitle,
      classId: state.classId,
      className: state.className,
      at: state.startedAt || state.createdAt || Date.now(),
      endedAt: state.endedAt || null,
      status: state.progressMode === 'student' && state.studentCourseCompleted ? '已完成' : (state.status === 'ended' ? '已结束' : (state.status === 'cancelled' ? '已取消' : (state.status === 'waiting' ? '等待开始' : '进行中'))),
      expectedStudents: state.expectedStudents,
      actualStudents: state.actualStudents == null ? null : state.actualStudents,
      presenceMode: state.presenceMode || 'not-connected',
      reachedStages: state.reachedStages || []
    };
    if (index >= 0) {
      rows[index] = Object.assign({}, rows[index], snapshot);
      rows.unshift(rows.splice(index, 1)[0]);
    } else {
      rows.unshift(snapshot);
    }
    setRecords(rows.slice(0, 20));
  }

  function dailyMessage() {
    var messages = [
      '今天，不用急着证明什么。',
      '你已经在往前走了，哪怕步子很小。',
      '慢一点，也是在照顾自己。',
      '把注意力放回这一刻，就很好。',
      '不确定也没关系，我们可以从一件小事开始。',
      '每一次愿意停下来听听自己，都很重要。',
      '今天的你，也值得被温柔对待。'
    ];
    var day = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);
    return messages[((day % messages.length) + messages.length) % messages.length];
  }

  function currentStudent() {
    var rows = [];
    try { rows = JSON.parse(localStorage.getItem('yunting-class-students-v1')) || []; }
    catch (ignore) {}
    var id = localStorage.getItem('yunting-current-student-v1');
    var student = rows.find(function (row) { return row.id === id; }) || rows[0] || {
      id: 'demo-class-7a-student-1',
      name: '林梓涵',
      classId: 'demo-class-7a'
    };
    localStorage.setItem('yunting-current-student-v1', student.id);
    return student;
  }

  function wearableContext() {
    var state = global.YTClassroomDemo ? global.YTClassroomDemo.read() : {};
    var inClass = state.active && !(state.progressMode === 'student' && state.studentCourseCompleted);
    return inClass ? {
      contextType: 'classroom',
      sessionId: state.sessionId,
      courseTitle: state.courseTitle,
      className: state.className
    } : {
      contextType: 'self-exploration',
      sessionId: '',
      courseTitle: '',
      className: ''
    };
  }

  function currentAssignment() {
    if (!global.YTWearables) { return null; }
    return global.YTWearables.syncContextForStudent(currentStudent().id, wearableContext());
  }

  function wearableStatusCopy(assignment) {
    var wear = global.YTWearables.wearStatus(assignment);
    var data = global.YTWearables.dataStatus(assignment);
    if (wear === 'worn' && data === 'collecting') { return '已佩戴 · 设备数据正在同步'; }
    if (wear === 'worn') { return '已佩戴 · 等待设备数据'; }
    if (wear === 'unworn') { return '暂未佩戴 · 连续 10 分钟后自动解除'; }
    return '已配对 · 等待佩戴检测';
  }

  function updateWearableTrigger(mount) {
    var trigger = mount.querySelector('[data-wearable-open]');
    if (!trigger) { return; }
    var assignment = currentAssignment();
    trigger.classList.toggle('is-connected', Boolean(assignment));
    trigger.setAttribute('aria-label', assignment ? '手环已连接，查看连接状态' : '连接手环');
    trigger.querySelector('span').textContent = assignment ? '手环已连接' : '连接手环';
  }

  function renderWearableBody(mount) {
    var body = mount.querySelector('[data-wearable-body]');
    if (!body || !global.YTWearables) { return; }
    var assignment = currentAssignment();
    if (!assignment) {
      body.innerHTML =
        '<div class="connection-state" data-connection-state="disconnected"><i></i><span>当前未连接</span></div>' +
        '<form class="pair-form" data-pair-form>' +
          '<label for="wearable-code">输入手环上的六位配对码</label>' +
          '<div class="pair-row"><input id="wearable-code" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required aria-label="六位手环配对码" placeholder="000000"><button type="submit">连接</button></div>' +
          '<p class="band-message" data-band-message role="status"></p>' +
        '</form>' +
        '<p class="truth-note">这里复用本机配对状态；没有接入远端设备时，不会显示实时数据。</p>';
      var form = body.querySelector('[data-pair-form]');
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = form.querySelector('input');
        var code = input.value.trim();
        if (!/^\d{6}$/.test(code)) {
          body.querySelector('[data-band-message]').textContent = '请输入六位数字配对码。';
          input.focus();
          return;
        }
        var student = currentStudent();
        var context = wearableContext();
        var result = global.YTWearables.claim({
          code: code,
          studentId: student.id,
          studentName: student.name,
          classId: student.classId,
          className: context.className,
          sessionId: context.sessionId,
          courseTitle: context.courseTitle,
          contextType: context.contextType,
          pairingMethod: 'student'
        });
        if (!result.ok) {
          body.querySelector('[data-band-message]').textContent = result.error;
          return;
        }
        updateWearableTrigger(mount);
        renderWearableBody(mount);
      });
      return;
    }

    body.innerHTML =
      '<div class="connection-state connected" data-connection-state="connected"><i></i><span>当前已连接</span></div>' +
      '<div class="device-panel"><span>手环编号</span><strong>' + esc(assignment.deviceLabel) + '</strong><span>连接状态</span><p>' + esc(wearableStatusCopy(assignment)) + '</p></div>' +
      '<div class="wearable-actions"><button type="button" data-band-change>更换手环</button><button class="danger" type="button" data-band-disconnect>解除连接</button></div>' +
      '<p class="truth-note">状态来自当前浏览器的本机记录，不代表远端实时连接。</p>';

    body.querySelector('[data-band-change]').addEventListener('click', function () {
      global.YTWearables.endAssignment(assignment.id, 'student-change');
      updateWearableTrigger(mount);
      renderWearableBody(mount);
      var input = body.querySelector('input');
      if (input) { input.focus(); }
    });
    body.querySelector('[data-band-disconnect]').addEventListener('click', function () {
      global.YTWearables.endAssignment(assignment.id, 'student-ended');
      updateWearableTrigger(mount);
      renderWearableBody(mount);
    });
  }

  function closeWearableModal(mount) {
    var modal = mount.querySelector('[data-wearable-modal]');
    if (!modal) { return; }
    modal.hidden = true;
    document.body.classList.remove('has-modal');
    var trigger = mount.querySelector('[data-wearable-open]');
    if (trigger) { trigger.focus(); }
  }

  function bindHome(mount) {
    var modal = mount.querySelector('[data-wearable-modal]');
    var trigger = mount.querySelector('[data-wearable-open]');
    trigger.addEventListener('click', function () {
      renderWearableBody(mount);
      modal.hidden = false;
      document.body.classList.add('has-modal');
      var focusTarget = modal.querySelector('input, [data-band-change]');
      if (focusTarget) { focusTarget.focus(); }
    });
    modal.querySelectorAll('[data-wearable-close]').forEach(function (button) {
      button.addEventListener('click', function () { closeWearableModal(mount); });
    });

    var moreTrigger = mount.querySelector('[data-more-trigger]');
    var moreMenu = mount.querySelector('[data-more-menu]');
    moreTrigger.addEventListener('click', function () {
      var willOpen = moreMenu.hidden;
      moreMenu.hidden = !willOpen;
      moreTrigger.setAttribute('aria-expanded', String(willOpen));
    });
    document.addEventListener('click', function (event) {
      if (!event.target.closest('.more-wrap')) {
        moreMenu.hidden = true;
        moreTrigger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') { return; }
      if (!modal.hidden) { closeWearableModal(mount); }
      moreMenu.hidden = true;
      moreTrigger.setAttribute('aria-expanded', 'false');
    });
  }

  function render(mount) {
    mount.innerHTML =
      '<main class="student-home" data-student-home>' +
        '<header class="home-top">' +
          '<a href="student.html" class="brand">云听 <span>AI 智慧心理教室</span></a>' +
          '<nav class="home-actions" aria-label="学生首页导航">' +
            '<a class="top-link desktop-secondary" data-top-entry="training" href="training.html">成长训练场</a>' +
            '<a class="top-link desktop-secondary" data-top-entry="wall" href="student-space.html?view=wall">留言墙</a>' +
            '<a class="top-link desktop-secondary" data-top-entry="records" href="student-space.html?view=records">课堂记录</a>' +
            '<div class="more-wrap"><button class="more-trigger" type="button" data-more-trigger aria-expanded="false" aria-haspopup="menu">更多</button><div class="more-menu" data-more-menu role="menu" hidden><a href="training.html" role="menuitem">成长训练场</a><a href="student-space.html?view=wall" role="menuitem">留言墙</a><a href="student-space.html?view=records" role="menuitem">课堂记录</a></div></div>' +
            '<button class="wearable-trigger" type="button" data-wearable-open><span>连接手环</span></button>' +
            '<div data-account-host></div>' +
          '</nav>' +
        '</header>' +
        '<section class="home-stage" aria-labelledby="home-question">' +
          '<div class="companion-intro">' +
            '<div class="companion-portrait"><img class="home-character" src="assets/xiaoyueyue-home.jpg" alt="小悦悦"></div>' +
            '<div class="companion-bubble">' +
              '<strong>小悦悦</strong>' +
              '<h1 id="home-question">今天想从哪里开始？</h1>' +
            '</div>' +
          '</div>' +
          '<div class="feature-panels">' +
            '<article class="feature-panel chat-panel" data-feature-panel="chat">' +
              '<div class="feature-visual dialogue-visual"><img src="assets/xiaoyueyue-dialogue.jpg" alt="小悦悦陪你聊聊"></div>' +
              '<div class="feature-content">' +
                '<h2>和小悦悦聊聊</h2>' +
                '<p>从今天的一件小事开始说起</p>' +
                '<a class="feature-button chat-button" data-core-action="chat" href="student-space.html?view=chat">开始聊聊 <span aria-hidden="true">›</span></a>' +
              '</div>' +
            '</article>' +
            '<article class="feature-panel audio-panel" data-feature-panel="audio">' +
              '<div class="feature-visual sound-visual" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>' +
              '<div class="feature-content">' +
                '<h2>心理成长方案</h2>' +
                '<p>听一段声音，让这一刻慢下来</p>' +
                '<div class="waveform" aria-label="音频时长 3 分 24 秒"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><time>03:24</time></div>' +
                '<a class="feature-button audio-button" data-core-action="audio" href="student-space.html?view=audio">开始聆听 <span aria-hidden="true">›</span></a>' +
              '</div>' +
            '</article>' +
          '</div>' +
        '</section>' +
        '<div class="wearable-modal" data-wearable-modal hidden>' +
          '<div class="modal-backdrop" data-wearable-close></div>' +
          '<section class="wearable-dialog" role="dialog" aria-modal="true" aria-labelledby="wearable-title">' +
            '<button class="modal-close" type="button" data-wearable-close aria-label="关闭">×</button>' +
            '<h2 id="wearable-title">连接手环</h2>' +
            '<p class="modal-intro">输入正在使用的手环配对码。没有手环也不影响使用其他功能。</p>' +
            '<div data-wearable-body></div>' +
          '</section>' +
        '</div>' +
      '</main>';

    if (global.YTAuthDemo && global.YTAuthDemo.installSessionControl) {
      global.YTAuthDemo.installSessionControl();
    }
    var account = document.querySelector('.auth-session-control');
    var accountHost = mount.querySelector('[data-account-host]');
    if (account && accountHost) { accountHost.replaceWith(account); }
    bindHome(mount);
    updateWearableTrigger(mount);
  }

  function classroomOverlay(mount, state) {
    var old = mount.querySelector('.classroom-overlay');
    if (old) { old.remove(); }
    if (!state.active || (state.progressMode === 'student' && state.studentCourseCompleted)) { return; }
    var currentStage = state.progressMode === 'student' ? (state.studentStage || state.stage) : state.stage;
    var student = currentStudent();
    var assignment = global.YTWearables ? global.YTWearables.syncContextForStudent(student.id, {
      contextType: 'classroom', sessionId: state.sessionId, courseTitle: state.courseTitle, className: state.className
    }) : null;
    var band;
    if (assignment) {
      band = '<div class="classroom-band connected"><b>已连接 ' + esc(assignment.deviceLabel) + '</b><span>' + esc(wearableStatusCopy(assignment)) + '，老师端可见</span></div>';
    } else {
      band = '<form class="classroom-band"><b>连接手环（可选）</b><div><input inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="六位配对码"><button type="submit">连接</button></div><span data-band-message>可以直接配对，遇到问题可请老师帮助</span></form>';
    }
    var stageNames = { enter: '进入课堂', story: '故事导入', talk: '和小悦悦聊聊', energy: '心理能量补给', playground: '成长训练场', closing: '收束与尾声' };
    var element = document.createElement('section');
    element.className = 'classroom-overlay';
    element.innerHTML = '<div class="classroom-glow"></div><div class="classroom-call"><p class="eyebrow">' + esc(state.className) + ' · 心理成长课进行中</p><h2>' + esc(state.courseTitle) + '</h2><p>' + (state.progressMode === 'student' ? '继续你的自主探索' : '老师正在带领大家进入') + '「' + esc(stageNames[currentStage] || '课堂') + '」。</p>' + band + '<button class="cta" data-join>进入课堂</button><small>没有手环也可以正常进入课堂。</small></div>';
    mount.appendChild(element);
    var form = element.querySelector('form.classroom-band');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var result = global.YTWearables.claim({
          code: form.querySelector('input').value,
          studentId: student.id,
          studentName: student.name,
          classId: student.classId,
          className: state.className,
          sessionId: state.sessionId,
          courseTitle: state.courseTitle,
          contextType: 'classroom',
          pairingMethod: 'student'
        });
        if (!result.ok) { form.querySelector('[data-band-message]').textContent = result.error; return; }
        classroomOverlay(mount, state);
      });
    }
    element.querySelector('[data-join]').addEventListener('click', function () {
      global.location.href = 'course.html?id=' + encodeURIComponent(state.courseId) + '&mode=classroom&session=' + encodeURIComponent(state.sessionId);
    });
  }

  function boot() {
    var mount = document.getElementById('app');
    if (!mount) { return; }
    render(mount);
    var homePreview = new URLSearchParams(global.location.search).get('preview') === 'home';
    if (homePreview) { return; }
    var apply = function (state) { remember(state); classroomOverlay(mount, state); };
    apply(global.YTClassroomDemo ? global.YTClassroomDemo.read() : {});
    if (global.YTClassroomDemo) { global.YTClassroomDemo.subscribe(apply); }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); }
  else { boot(); }
})(window);
