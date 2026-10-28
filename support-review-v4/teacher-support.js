(function () {
  'use strict';
  var preview = '/yunting-ai-psych-classroom/support-review-v4/teacher.html';
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function normalize(value) {
    try { var u = new URL(value, location.href); if (u.origin === location.origin && /\/teacher\.html$/.test(u.pathname)) u.pathname = preview; return u.href; } catch (_) { return value; }
  }
  ['pushState', 'replaceState'].forEach(function (method) {
    var original = history[method];
    history[method] = function (state, title, url) { return original.call(history, state, title, url == null ? url : normalize(url)); };
  });
  function model() { return window.YTSupportReports; }
  function safeURL(value) {
    try { var u = new URL(value, document.baseURI); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch (_) { return ''; }
  }
  function observation(id) {
    var value = model() && model().getObservation(id) || '';
    return '<details class="yt-observation"><summary>补充观察（选填）</summary><p>只在此浏览器保存，不会自动发送给学生或家长。不需要填报或安排回访。</p><label>近期看到或听到的情况<textarea data-yt-observation maxlength="1000" rows="3" placeholder="有需要时再补充，可随时修改或删除">' + esc(value) + '</textarea></label><div class="yt-support-actions"><button type="button" data-yt-action="save-observation">保存观察</button><button type="button" data-yt-action="delete-observation">删除观察</button><span data-yt-status role="status" aria-live="polite"></span></div></details>';
  }
  function resource(item, kind) {
    if (!item || !item.url) return '<article class="yt-resource"><h4>' + (kind === 'audio' ? '声音支持' : '轻量训练') + '</h4><p>暂未匹配可用资源。</p></article>';
    var url = safeURL(item.url);
    return '<article class="yt-resource"><span class="yt-support-eyebrow">' + (kind === 'audio' ? '听一听' : '试一试') + '</span><h4>' + esc(item.title) + '</h4><p>' + esc(item.reason) + '</p>' + (url ? (kind === 'audio' ? '<audio data-yt-audio data-resource-id="' + esc(item.id) + '" controls preload="metadata" src="' + esc(url) + '">当前浏览器不支持音频播放。</audio><small>可随时暂停或停止，不要求听完。</small><button type="button" data-yt-action="stop-audio">停止试听</button>' : '<button type="button" data-yt-action="open-training" data-resource-id="' + esc(item.id) + '" data-url="' + esc(url) + '" data-title="' + esc(item.title) + '">老师体验训练</button><small>仅供老师体验，不向学生派发作业；随时可关闭，无完成要求。</small>') : '<p>资源地址暂不可用。</p>') + '</article>';
  }
  function render(id) {
    var api = model(), data = api && api.supportFor(id);
    var start = '<section class="content-card yt-light-support" data-yt-student="' + esc(id) + '"><div class="panel-title"><span>成长支持</span><small>演示报告建议 · 不需填报</small></div>';
    if (!data || !data.hasReport) return start + '<p class="yt-support-muted">尚无明确生成的报告，暂不整理个性化建议。无需额外填报；有报告后在这里查看支持线索。</p>' + observation(id) + '</section>';
    return start + (data.needsHumanReview ? '<aside class="yt-human-review"><b>建议优先人工了解</b><p>先结合学生本人情境，与班主任或心理老师了解情况，不仅依赖音频或训练。</p><details class="yt-safety-note"><summary>安全边界</summary><p>' + esc(data.safetyNote) + '</p></details></aside>' : '') + '<h3>先关注什么</h3><ul class="yt-focus-list">' + (data.focus || []).slice(0, 2).map(function (f) { return '<li><b>' + esc(f.name) + '</b><p>' + esc(f.reason) + '</p></li>'; }).join('') + '</ul><h3>怎么支持</h3><div class="yt-communication"><b>可以这样聊一句</b><p>' + esc(data.communication) + '</p></div><div class="yt-resource-grid">' + resource(data.audio, 'audio') + resource(data.training, 'training') + '</div><div class="yt-change"><h3>后来有什么变化</h3><p>' + esc(data.change && data.change.text || '当前信息不足，暂不能判断变化。') + '</p><small>资源使用不等于心理改善，不根据播放或训练体验推断效果。</small></div>' + (!data.needsHumanReview && data.safetyNote ? '<p class="yt-support-muted">' + esc(data.safetyNote) + '</p>' : '') + observation(id) + '</section>';
  }
  window.YTLightSupport = {render: render, normalizeTeacherURL: normalize};
  function status(root, text) { var target = root.querySelector('[data-yt-status]'); if (target) target.textContent = text; }
  function usage(root, resourceId, event) {
    try { if (model()) model().recordUsage(root.dataset.ytStudent, resourceId, event); } catch (_) { status(root, '使用记录未能保存；资源仍可体验。'); }
  }
  ['play', 'pause', 'ended'].forEach(function (event) {
    document.addEventListener(event, function (e) { var audio = e.target; if (!audio.matches || !audio.matches('[data-yt-audio]')) return; var root = audio.closest('[data-yt-student]'); if (root) usage(root, audio.dataset.resourceId, event); }, true);
  });
  function closeTraining(dialog) { if (document.fullscreenElement && dialog.contains(document.fullscreenElement) && document.exitFullscreen) document.exitFullscreen().catch(function () {}); dialog.close(); }
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href]');
    if (link) {
      var before = link.href, normalized = normalize(before);
      if (normalized !== before) link.href = normalized;
      if (/\/support-review-v4\/teacher\.html(?:[?#]|$)/.test(normalized) && new URL(normalized).origin === location.origin && !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !link.target && !link.hasAttribute('download') && !link.hasAttribute('data-hard-nav') && window.YTPreviewNavigateTeacher) {
        e.preventDefault(); e.stopImmediatePropagation(); window.YTPreviewNavigateTeacher(normalized); return;
      }
    }
    var button = e.target.closest && e.target.closest('[data-yt-action]'); if (!button) return;
    var action = button.dataset.ytAction, dialog = button.closest('.yt-training-dialog');
    if (action === 'close-training') { closeTraining(dialog); return; }
    if (action === 'fullscreen-training') { var surface = dialog.querySelector('.yt-training-surface'); if (surface && surface.requestFullscreen) surface.requestFullscreen().catch(function () { var note = dialog.querySelector('[data-yt-dialog-status]'); note.textContent = '当前浏览器暂不支持全屏，仍可在窗口中体验。'; }); return; }
    var root = button.closest('[data-yt-student]'); if (!root) return;
    if (action === 'stop-audio') { var audio = root.querySelector('[data-yt-audio]'); audio.pause(); audio.currentTime = 0; return; }
    if (action === 'save-observation' || action === 'delete-observation') {
      var input = root.querySelector('[data-yt-observation]');
      try { if (!model()) throw new Error('Model unavailable'); var result = model().saveObservation(root.dataset.ytStudent, action === 'delete-observation' ? '' : input.value); input.value = result.text; status(root, action === 'delete-observation' ? '观察已删除，仅影响此浏览器。' : '已保存至此浏览器，可继续编辑。'); } catch (_) { status(root, '未能保存，请检查浏览器存储设置后重试。'); }
      return;
    }
    if (action === 'open-training') {
      var url = safeURL(button.dataset.url); if (!url) return;
      var existing = document.querySelector('.yt-training-dialog'); if (existing) existing.remove();
      dialog = document.createElement('dialog'); dialog.className = 'yt-training-dialog';
      dialog.setAttribute('aria-label', '老师体验训练');
      dialog.innerHTML = '<section class="yt-training-surface"><header><div><b>' + esc(button.dataset.title) + '</b><p>教师体验，不派作业；随时可关闭，无需完成。</p></div><div class="yt-support-actions"><button type="button" data-yt-action="fullscreen-training">浏览器全屏</button><button type="button" data-yt-action="close-training">关闭并返回</button></div></header><p data-yt-dialog-status role="status"></p><iframe title="' + esc(button.dataset.title) + ' · 教师体验" src="' + esc(url) + '" allow="fullscreen" allowfullscreen></iframe></section>';
      document.body.appendChild(dialog);
      dialog.addEventListener('cancel', function (event) { event.preventDefault(); closeTraining(dialog); });
      dialog.addEventListener('close', function () { dialog.remove(); if (button.isConnected) button.focus(); });
      dialog.showModal(); usage(root, button.dataset.resourceId, 'opened');
    }
  }, true);
}());
