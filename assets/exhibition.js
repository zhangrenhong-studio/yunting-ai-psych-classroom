'use strict';
(() => {
  const $ = id => document.getElementById(id), audio = $('audio');
  const FONT = '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
  const DISCLAIMER = '模拟数据 · 非手环实测';
  let state = 'prepare', baselineTimer = null, session, buffering = true, lastPosition = 0, playedSeconds = 0, sampleMark = 0;
  const time = value => { const n = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)); return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`; };
  const avg = (rows, key) => rows.length ? rows.reduce((s, r) => s + r[key], 0) / rows.length : null;
  const number = n => n === null ? '—' : n.toFixed(1);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  function fresh() {
    clearInterval(baselineTimer); baselineTimer = null; audio.pause(); audio.currentTime = 0;
    session = { started: null, baseline: [], listening: [], ready: false, finished: false, partial: true, feeling: '', phase: Math.random() * 6.28, center: 48 + Math.random() * 15, heartCenter: 69 + Math.random() * 10 };
    playedSeconds = 0; sampleMark = 0; lastPosition = 0; buffering = true;
    $('pressure').textContent = '—'; $('heart').innerHTML = '— <small>bpm</small>'; $('mini-chart').replaceChildren();
    $('play').disabled = true; $('play').textContent = '基线采样中…'; $('audio-error').hidden = true;
    $('listen-title').textContent = '先留一小段安静。'; $('listen-message').textContent = '正在建立模拟基线，不是身体测量。';
    $('export-status').textContent = '仅在你的设备上生成，无需上传。';
    document.querySelectorAll('[data-feeling]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    $('feeling-status').textContent = '尚未选择'; renderProgress(); show('prepare');
  }
  function show(name) {
    state = name;
    ['prepare', 'listen', 'report'].forEach(id => $(id).hidden = id !== name);
    document.querySelectorAll('[data-step]').forEach(el => { el.classList.toggle('active', el.dataset.step === name); if (el.dataset.step === name) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current'); });
    document.body.classList.toggle('playing', name === 'listen' && !audio.paused && !buffering);
  }
  function makeSample(stage) {
    const i = session.baseline.length + session.listening.length;
    // Bounded oscillation plus fresh noise; no target improvement or downward trend.
    return { phase: stage, t: stage === 'baseline' ? session.baseline.length : playedSeconds, position: stage === 'baseline' ? null : audio.currentTime,
      pressure: Math.round(clamp(session.center + 5 * Math.sin(i * .85 + session.phase) + (Math.random() - .5) * 7, 20, 85)),
      heart: Math.round(clamp(session.heartCenter + 4 * Math.sin(i * .63 + session.phase + 1) + (Math.random() - .5) * 5, 55, 105)) };
  }
  function live(sample) {
    $('pressure').textContent = sample.pressure;
    $('heart').innerHTML = `${sample.heart} <small>bpm</small>`;
    const list = [...session.baseline, ...session.listening].slice(-24);
    const points = list.map((r, i) => `${6 + i * 168 / Math.max(1, list.length - 1)},${32 - r.pressure / 100 * 29}`).join(' ');
    $('mini-chart').innerHTML = `<polyline points="${points}" fill="none" stroke="#17816d" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  $('start').addEventListener('click', () => {
    if (state !== 'prepare') return;
    session.started = new Date(); show('listen'); $('listen-title').focus();
    let count = 0;
    const sampleBaseline = () => {
      if (state !== 'listen') return;
      const row = makeSample('baseline'); session.baseline.push(row); live(row); count++;
      $('listen-message').textContent = `模拟基线采样 ${count} / 6 秒 · 非手环实测`;
      if (count === 6) {
        clearInterval(baselineTimer); baselineTimer = null; session.ready = true;
        $('listen-title').textContent = '让声音，陪你一会儿。';
        $('listen-message').textContent = '模拟基线已记录。准备好后，点击开始聆听。';
        $('play').disabled = false; $('play').textContent = '开始聆听';
      }
    };
    baselineTimer = setInterval(sampleBaseline, 1000);
  });
  async function play() {
    if (!session.ready || state !== 'listen') return;
    if (!audio.paused) { audio.pause(); return; }
    $('audio-error').hidden = true;
    if (audio.error) { audio.load(); lastPosition = audio.currentTime; }
    try { await audio.play(); } catch (error) { showAudioError(error); }
  }
  function showAudioError() {
    if (state !== 'listen') return;
    buffering = true; document.body.classList.remove('playing');
    $('audio-error').textContent = '声音暂时无法播放。请检查网络或设备音量，点击“重试播放”；也可以提前结束。未播放时不会累计聆听数据。';
    $('audio-error').hidden = false; $('play').textContent = '重试播放'; $('play').disabled = !session.ready;
    $('listen-message').textContent = '播放遇到问题，模拟聆听采样已暂停。';
  }
  $('play').addEventListener('click', play);
  audio.volume = .7;
  $('volume').addEventListener('input', e => audio.volume = Number(e.target.value));
  audio.addEventListener('playing', () => {
    if (state !== 'listen') { audio.pause(); return; }
    buffering = false; lastPosition = audio.currentTime;
    $('play').textContent = '暂停声音'; $('audio-error').hidden = true;
    $('listen-message').textContent = '自然呼吸就好，不需要追逐任何数值。'; document.body.classList.add('playing');
  });
  function tick() {
    if (state !== 'listen' || !session.ready || audio.paused || buffering || audio.seeking) return;
    const now = audio.currentTime, delta = now - lastPosition; lastPosition = now;
    if (delta <= 0 || delta > 3) return;
    playedSeconds += delta;
    if (playedSeconds - sampleMark >= 1) { sampleMark = playedSeconds; const row = makeSample('listening'); session.listening.push(row); live(row); }
  }
  audio.addEventListener('timeupdate', () => { tick(); renderProgress(); });
  audio.addEventListener('pause', () => {
    document.body.classList.remove('playing');
    if (state === 'listen' && session.ready && !session.finished && !audio.ended) {
      $('play').textContent = '继续聆听'; $('listen-message').textContent = '已暂停。聆听计时与模拟采样也已暂停。';
    }
  });
  audio.addEventListener('waiting', () => { buffering = true; document.body.classList.remove('playing'); if (state === 'listen') $('listen-message').textContent = '声音缓冲中，聆听采样暂时停止。'; });
  audio.addEventListener('seeking', () => { lastPosition = audio.currentTime; });
  audio.addEventListener('seeked', () => { lastPosition = audio.currentTime; });
  audio.addEventListener('error', showAudioError);
  audio.addEventListener('loadedmetadata', renderProgress);
  audio.addEventListener('ended', () => { if (state === 'listen') finish(false); });
  function renderProgress() {
    const duration = audio.duration, ratio = Number.isFinite(duration) && duration > 0 ? audio.currentTime / duration * 100 : 0;
    $('elapsed').textContent = `${time(audio.currentTime)} / ${Number.isFinite(duration) ? time(duration) : '—'}`;
    $('progress-fill').style.width = `${ratio}%`;
    document.querySelector('.progress').setAttribute('aria-valuenow', Math.round(ratio));
  }
  $('finish').addEventListener('click', () => { if (state === 'listen' && confirm('确定提前结束吗？报告将标注“提前结束 · 部分体验”，不会标为完整完成。')) finish(true); });
  function finish(partial) {
    tick(); clearInterval(baselineTimer); baselineTimer = null;
    session.finished = true; session.partial = partial; session.ended = new Date(); audio.pause();
    show('report'); renderReport(); $('report-heading').focus();
  }
  function stats() {
    const tail = session.listening.slice(-10), before = avg(session.baseline, 'pressure'), after = avg(tail, 'pressure');
    const delta = before === null || after === null ? null : after - before;
    const baselineText = `前窗：开始前 ${session.baseline.length} 秒模拟基线（${session.baseline.length} 点）`;
    const tailSpan = tail.length ? Math.max(1, Math.round(tail.at(-1).t - tail[0].t + 1)) : 0;
    return { before, after, delta, tail, baselineText, windowText: `${baselineText}；后窗：末段约 ${tailSpan} 秒实际播放期间的模拟样本（${tail.length} 点，最多 10 点）。`, completion: session.partial ? '提前结束 · 部分体验' : '音频播放结束 · 完整体验', date: session.started ? session.started.toLocaleString('zh-CN', { hour12: false }) : '—', heartBefore: avg(session.baseline, 'heart'), heartAfter: avg(tail, 'heart') };
  }
  function deltaText(delta) { return delta === null ? '数据不足' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`; }
  function summary(s) {
    if (s.after === null) return '尚无有效聆听样本，无法进行前后窗口比较。基线采样不是聆听时长。';
    if (session.baseline.length < 6 || s.tail.length < 10) return '本次采样窗口较短，展示已有样本的均值，仅供流程演示，不作效果判断。';
    return '以上为两个模拟窗口的均值对照，不代表真实生理变化，也不能证明声音的放松效果。';
  }
  function renderReport() {
    const s = stats(); $('completion').textContent = s.completion;
    $('report-meta').textContent = `${s.date}　·　实际播放累计 ${time(playedSeconds)}　·　未接入真实手环`;
    $('before').textContent = number(s.before); $('after').textContent = number(s.after); $('delta').textContent = deltaText(s.delta);
    $('windows').textContent = s.windowText; $('report-summary').textContent = summary(s);
    chart($('report-chart').getContext('2d'), 0, 0, 1000, 300);
  }
  function chart(ctx, x, y, w, h) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    const left = 55, right = w - 20, top = 35, bottom = h - 45;
    const rows = [...session.baseline, ...session.listening], maxX = session.baseline.length + playedSeconds || 1;
    const xAt = r => left + (r.phase === 'baseline' ? r.t : session.baseline.length + r.t) / maxX * (right - left);
    const yAt = n => bottom - n / 120 * (bottom - top);
    ctx.font = `16px ${FONT}`; ctx.textAlign = 'right';
    [0, 40, 80, 120].forEach(n => { const py = yAt(n); ctx.strokeStyle = '#e6efeb'; ctx.beginPath(); ctx.moveTo(left, py); ctx.lineTo(right, py); ctx.stroke(); ctx.fillStyle = '#648078'; ctx.fillText(String(n), left - 10, py + 5); });
    const divider = left + session.baseline.length / maxX * (right - left);
    ctx.fillStyle = '#e9f3ed88'; ctx.fillRect(left, top, divider - left, bottom - top);
    ctx.strokeStyle = '#b3c9be'; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(divider, top); ctx.lineTo(divider, bottom); ctx.stroke(); ctx.setLineDash([]);
    [['pressure', '#17816d'], ['heart', '#8c9bb5']].forEach(([key, color]) => {
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); rows.forEach((r, i) => { const px = xAt(r), py = yAt(r[key]); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }); ctx.stroke();
      if (rows.length === 1) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(xAt(rows[0]), yAt(rows[0][key]), 4, 0, Math.PI * 2); ctx.fill(); }
    });
    ctx.fillStyle = '#648078'; ctx.font = `15px ${FONT}`; ctx.textAlign = 'left'; ctx.fillText('模拟基线', left, 23); ctx.textAlign = 'right'; ctx.fillText('聆听中模拟采样（播放累计时间）', right, 23);
    ctx.textAlign = 'left'; ctx.fillText('开始前', left, h - 12); ctx.textAlign = 'right'; ctx.fillText(`播放累计 ${time(playedSeconds)}`, right, h - 12);
    if (!session.listening.length) { ctx.textAlign = 'center'; ctx.fillText('暂无聆听样本', w / 2, h / 2); }
    ctx.restore();
  }
  document.querySelectorAll('[data-feeling]').forEach(b => b.addEventListener('click', () => {
    session.feeling = session.feeling === b.dataset.feeling ? '' : b.dataset.feeling;
    document.querySelectorAll('[data-feeling]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.feeling === session.feeling)));
    $('feeling-status').textContent = session.feeling ? `已记录：${session.feeling}（再次点击可取消）` : '尚未选择';
  }));
  function resetConfirm(event) {
    if (state === 'listen' && !session.finished && !confirm('本次体验尚未结束。离开将清除本次数据，确定继续吗？')) { if (event) event.preventDefault(); return false; }
    return true;
  }
  $('reset').addEventListener('click', () => { if (resetConfirm()) { fresh(); window.scrollTo({ top: 0, behavior: 'smooth' }); $('start').focus(); } });
  $('back').addEventListener('click', event => { if (resetConfirm(event)) { clearInterval(baselineTimer); audio.pause(); } });
  window.addEventListener('beforeunload', e => { if (state === 'listen' && !session.finished) { e.preventDefault(); e.returnValue = ''; } });
  function wrap(ctx, text, x, y, maxWidth, lineHeight) {
    let line = ''; for (const c of text) { if (ctx.measureText(line + c).width > maxWidth && line) { ctx.fillText(line, x, y); y += lineHeight; line = c; } else line += c; }
    if (line) ctx.fillText(line, x, y); return y + lineHeight;
  }
  async function reportCanvas() {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const c = document.createElement('canvas'); c.width = 1240; c.height = 1754;
    const ctx = c.getContext('2d'), s = stats(); ctx.fillStyle = '#f2f8f4'; ctx.fillRect(0, 0, c.width, c.height);
    const txt = (text, x, y, size = 24, color = '#244f47', weight = 400) => { ctx.font = `${weight} ${size}px ${FONT}`; ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.fillText(text, x, y); };
    txt('云听 / 声音体验记录', 80, 112, 40, '#17483e', 600);
    txt(DISCLAIMER, 80, 175, 29, '#16796d', 600);
    txt('未接入真实手环 · 非医疗用途', 80, 221, 24);
    txt(s.completion, 80, 300, 30, '#17483e', 600);
    txt(`体验时间：${s.date}`, 80, 350, 23);
    txt(`实际播放累计：${time(playedSeconds)}（暂停 / 缓冲不累计）`, 80, 394, 23);
    ctx.fillStyle = '#fff'; ctx.fillRect(65, 440, 1110, 330);
    txt('模拟压力指数（0–100，非临床量表）', 95, 488, 24);
    txt('开始前均值', 95, 550, 23); txt('结束窗口均值', 485, 550, 23); txt('变化', 895, 550, 23);
    txt(number(s.before), 95, 622, 52); txt(number(s.after), 485, 622, 52); txt(deltaText(s.delta), 895, 622, 40);
    txt(`模拟心率（辅助）：${number(s.heartBefore)} → ${number(s.heartAfter)} bpm`, 95, 690, 24);
    ctx.font = `20px ${FONT}`; ctx.fillStyle = '#5c7778'; wrap(ctx, s.windowText, 95, 735, 1045, 30);
    chart(ctx, 80, 810, 1080, 340);
    txt('绿色：模拟压力指数    灰蓝：模拟心率 bpm（辅助）', 130, 1195, 22);
    txt(`主观感受（可选自评）：${session.feeling || '未填写'}`, 80, 1275, 27);
    ctx.font = `24px ${FONT}`; ctx.fillStyle = '#244f47'; let y = wrap(ctx, summary(s), 80, 1340, 1080, 42);
    ctx.font = `22px ${FONT}`; ctx.fillStyle = '#5c7778'; y = wrap(ctx, '所有压力和心率数值均为本页生成的模拟数据，可能升高、降低或基本不变。不代表实际身体状态，不构成健康建议，也不能证明声音的疗效。', 80, y + 25, 1080, 36);
    txt(DISCLAIMER, 80, 1640, 25, '#16796d', 600); txt('仅用于展会流程演示 · 数据未上传 · 云听', 80, 1690, 20);
    return c;
  }
  function save(blob, extension) {
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `云听-模拟体验报告-${session.started.getTime()}.${extension}`;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function canvasBlob(canvas, type) { return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('无法编码图片')), type, .94)); }
  // Standalone PDF 1.4: embed our rasterized Chinese report as a JPEG XObject.
  async function pdfBlob(canvas) {
    const jpg = new Uint8Array(await (await canvasBlob(canvas, 'image/jpeg')).arrayBuffer()), enc = new TextEncoder();
    const chunks = [], offsets = [0]; let size = 0;
    const append = v => { const b = typeof v === 'string' ? enc.encode(v) : v; chunks.push(b); size += b.length; };
    const obj = (n, body) => { offsets[n] = size; append(`${n} 0 obj\n${body}\nendobj\n`); };
    append('%PDF-1.4\n%Yunting report\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>'); obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    offsets[4] = size; append(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`); append(jpg); append('\nendstream\nendobj\n');
    const command = 'q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n'; obj(5, `<< /Length ${enc.encode(command).length} >>\nstream\n${command}endstream`);
    const xref = size; append('xref\n0 6\n0000000000 65535 f \n'); for (let i = 1; i <= 5; i++) append(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    append(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`); return new Blob(chunks, { type: 'application/pdf' });
  }
  ['png', 'pdf'].forEach(type => $(type).addEventListener('click', async () => {
    $('png').disabled = true; $('pdf').disabled = true; $('export-status').textContent = '正在生成报告…';
    try { const canvas = await reportCanvas(); const blob = type === 'png' ? await canvasBlob(canvas, 'image/png') : await pdfBlob(canvas); save(blob, type); $('export-status').textContent = `${type.toUpperCase()} 报告已生成，下载由浏览器处理。`; }
    catch (error) { console.error(error); $('export-status').textContent = '生成失败，请重试或更换浏览器。'; }
    finally { $('png').disabled = false; $('pdf').disabled = false; }
  }));
  // Read-only, detached diagnostics: inspection never mutates the running experience.
  Object.defineProperty(window, 'YTExhibition', { value: Object.freeze({
    get snapshot() {
      return Object.freeze(JSON.parse(JSON.stringify({ stage: state, baselineReady: session.ready,
        finished: session.finished, partial: session.partial, feeling: session.feeling,
        listeningSeconds: playedSeconds, audioTime: audio.currentTime, audioPaused: audio.paused,
        buffering, baseline: session.baseline, listening: session.listening,
        comparison: session.finished ? stats() : null, simulated: true, wearableConnected: false })));
    }
  }), writable: false, configurable: false });
  fresh();
})();
