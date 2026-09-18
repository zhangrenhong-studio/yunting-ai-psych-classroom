(function (global) {
  'use strict';
  var q = new URLSearchParams(global.location.search);
  var view = q.get('view') || 'chat';
  var recordId = q.get('record');
  var app = document.getElementById('app');
  var label = document.getElementById('page-label');
  var CHAT_KEY = 'yunting-chat-local-v1';
  var AUDIO_KEY = 'yunting-audio-state-v1';

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function read(key) {
    try { var rows = JSON.parse(localStorage.getItem(key)); return rows || []; }
    catch (ignore) { return []; }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function dailyRecords() { var rows = read('yunting-daily-records-v1'); return Array.isArray(rows) ? rows.filter(function (x) { return !x.deletedAt; }) : []; }
  function classRecords() { var rows = read('yunting-class-records-v1'); return Array.isArray(rows) ? rows : []; }
  function setLabel(text) { if (label) label.textContent = text; document.title = '云听｜' + text; }
  function header(kicker, title, lead, meta) {
    return '<header class="workspace-head"><div><p class="eyebrow">' + kicker + '</p><h1>' + title + '</h1><p>' + lead + '</p></div>' + (meta ? '<span class="page-meta">' + meta + '</span>' : '') + '</header>';
  }

  function renderChat() {
    document.body.className = 'student-chat';
    setLabel('和小悦悦聊聊');
    app.className = 'space-workspace chat-page';
    var selected = dailyRecords().filter(function (x) { return x.id === recordId; })[0];
    var messages = read(CHAT_KEY); if (!Array.isArray(messages)) messages = [];
    var context = selected ? '<aside class="chat-context"><b>已带入一条每日记录</b><p>“' + esc(selected.content.length > 120 ? selected.content.slice(0,120) + '…' : selected.content) + '”</p><button type="button" data-remove-context>移除</button></aside>' : '';
    var rows = messages.map(function (m) {
      return '<div class="chat-message mine"><div class="message-bubble">' + esc(m.text) + '</div><time>' + new Date(m.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}) + '</time></div>';
    }).join('');
    app.innerHTML = '<section class="chat-product">' +
      '<header class="chat-bar"><div class="yue-avatar"><img src="assets/xiaoyueyue-dialogue.jpg" alt="小悦悦"></div><div><b>小悦悦</b><span><i></i> AI 服务暂未接入</span></div><button type="button" class="clear-chat" data-clear>清空本机消息</button></header>' +
      '<div class="chat-feed" data-feed>' + context +
        '<div class="chat-message yue"><div class="message-bubble"><b>这里是你和小悦悦的对话空间。</b><br>AI 服务接入前，你发出的内容只会保存在当前设备，不会生成自动回复。</div></div>' + rows +
      '</div>' +
      '<form class="chat-composer" data-chat-form><textarea maxlength="1000" rows="1" placeholder="输入你想说的话……" aria-label="输入消息"></textarea><div class="composer-row"><span data-status>内容仅保存在当前设备</span><button type="submit" disabled>发送</button></div></form>' +
    '</section>';
    var feed = app.querySelector('[data-feed]'), form = app.querySelector('[data-chat-form]'), input = form.querySelector('textarea'), send = form.querySelector('button'), status = form.querySelector('[data-status]');
    feed.scrollTop = feed.scrollHeight;
    input.addEventListener('input', function () { send.disabled = !input.value.trim(); input.style.height='auto'; input.style.height=Math.min(input.scrollHeight,140)+'px'; });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var text = input.value.trim(); if (!text) return;
      var all = read(CHAT_KEY); if (!Array.isArray(all)) all = [];
      var row = {id:'msg-'+Date.now(),text:text,at:new Date().toISOString()}; all.push(row); write(CHAT_KEY,all);
      var item=document.createElement('div'); item.className='chat-message mine'; item.innerHTML='<div class="message-bubble">'+esc(text)+'</div><time>'+new Date(row.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})+'</time>'; feed.appendChild(item);
      input.value=''; input.style.height='auto'; send.disabled=true; status.textContent='已保存到当前设备，AI 接入后才能回复'; feed.scrollTop=feed.scrollHeight;
    });
    var clear=app.querySelector('[data-clear]'); clear.addEventListener('click',function(){ if(!confirm('清空当前设备上的聊天内容吗？'))return; localStorage.removeItem(CHAT_KEY); renderChat(); });
    var remove=app.querySelector('[data-remove-context]'); if(remove) remove.addEventListener('click',function(){ location.href='student-space.html?view=chat'; });
  }

  var tracks = [
    {id:'slow',tag:'慢下来',title:'给自己一小段时间',desc:'跟着声音，把注意力慢慢带回此刻。',duration:'00:12',src:'assets/audio/05-breath.mp3',tone:'mint'},
    {id:'space',tag:'给自己空间',title:'先停一停，再想办法',desc:'当事情有点多时，先把下一步放小一点。',duration:'00:18',src:'assets/audio/04-method.mp3',tone:'sky'},
    {id:'support',tag:'温柔陪伴',title:'今天的话，轻轻收好',desc:'听一段简短的话，不要求自己马上变好。',duration:'00:12',src:'assets/audio/06-message.mp3',tone:'lilac'},
    {id:'begin',tag:'重新开始',title:'把今天当作新的起点',desc:'适合一天开始前，安静听一小段。',duration:'00:14',src:'assets/audio/01-opening.mp3',tone:'blue'}
  ];
  function renderAudio() {
    document.body.className = 'student-audio';
    setLabel('心理成长方案');
    app.className = 'space-workspace audio-page';
    var saved = read(AUDIO_KEY); var current = tracks.filter(function(t){return t.id===saved.trackId;})[0] || tracks[0];
    var list = tracks.map(function(t){return '<button type="button" class="track-card '+(t.id===current.id?'is-active ':'')+t.tone+'" data-track="'+t.id+'"><span class="track-icon">▶</span><span><small>'+t.tag+'</small><b>'+t.title+'</b><em>'+t.desc+'</em></span><time>'+t.duration+'</time></button>';}).join('');
    app.innerHTML = header('声音陪伴','心理成长方案','选择一段更适合此刻的音频。可以暂停、切换，也可以反复听。','4 段音频') +
      '<div class="audio-product"><section class="track-library"><h2>选择想听的音频</h2><div class="track-list">'+list+'</div></section>'+
      '<section class="now-player"><div class="player-cover '+current.tone+'"><span>正在播放</span><b data-player-tag>'+current.tag+'</b><i></i></div><div class="player-copy"><p class="eyebrow" data-player-kicker>'+current.tag+'</p><h2 data-player-title>'+current.title+'</h2><p data-player-desc>'+current.desc+'</p></div><audio controls preload="metadata" data-audio src="'+current.src+'"></audio><p class="player-note">这些内容用于放松与自我照顾，不替代专业帮助，也不做效果评分。</p></section></div>';
    var audio=app.querySelector('[data-audio]');
    function choose(id){
      var t=tracks.filter(function(x){return x.id===id;})[0]; if(!t)return;
      audio.pause(); audio.src=t.src; app.querySelector('[data-player-kicker]').textContent=t.tag; app.querySelector('[data-player-title]').textContent=t.title; app.querySelector('[data-player-desc]').textContent=t.desc; app.querySelector('[data-player-tag]').textContent=t.tag;
      var cover=app.querySelector('.player-cover'); cover.className='player-cover '+t.tone;
      Array.prototype.forEach.call(app.querySelectorAll('[data-track]'),function(b){b.classList.toggle('is-active',b.getAttribute('data-track')===id);});
      write(AUDIO_KEY,{trackId:id,updatedAt:new Date().toISOString()}); audio.play().catch(function(){});
    }
    Array.prototype.forEach.call(app.querySelectorAll('[data-track]'),function(b){b.addEventListener('click',function(){choose(b.getAttribute('data-track'));});});
    audio.addEventListener('play',function(){write(AUDIO_KEY,{trackId:(app.querySelector('[data-track].is-active')||{}).getAttribute ? app.querySelector('[data-track].is-active').getAttribute('data-track') : current.id,updatedAt:new Date().toISOString()});});
  }

  function renderRecords() {
    document.body.className = 'student-records';
    setLabel('课堂记录'); app.className='space-workspace records-page';
    var rows=classRecords();
    var html=rows.map(function(r){return '<article class="class-record"><time>'+new Date(r.at).toLocaleDateString('zh-CN')+'</time><div><b>'+esc(r.title)+'</b><p>'+esc(r.className)+' · '+esc(r.status)+'</p></div><span>课堂记录</span></article>';}).join('');
    app.innerHTML=header('课堂足迹','课堂记录','这里只保存课堂名称、班级、时间与完成状态，不展示私密对话内容。',rows.length+' 条')+'<div class="record-list">'+(html||'<div class="empty-state"><b>还没有课堂记录</b><p>老师开启第一堂课后，课堂足迹会出现在这里。</p></div>')+'</div>';
  }
  function followClassroom(){if(!global.YTClassroomDemo)return;var state=global.YTClassroomDemo.read();if(state&&state.active&&state.courseId){global.location.href='course.html?id='+encodeURIComponent(state.courseId)+'&mode=classroom&session='+encodeURIComponent(state.sessionId);}}
  if(view==='audio')renderAudio(); else if(view==='records')renderRecords(); else if(view!=='wall')renderChat();
  followClassroom();
}(window));
