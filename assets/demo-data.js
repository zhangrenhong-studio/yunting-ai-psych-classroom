/* 云听平台演示数据：仅用于静态预览，绝不表示真实学校、班级或学生。 */
(function (global) {
  'use strict';
  var CLASS_KEY = 'yunting-class-groups-v1';
  var STUDENT_KEY = 'yunting-class-students-v1';
  var RECORD_KEY = 'yunting-class-records-v1';
  var MARKER = 'yunting-demo-seed-v1';
  function read(key) { try { var x = JSON.parse(global.localStorage.getItem(key)); return Array.isArray(x) ? x : []; } catch (e) { return []; } }
  function write(key, rows) { global.localStorage.setItem(key, JSON.stringify(rows)); }
  function addMissing(rows, additions, key) { var ids = new Set(rows.map(function (x) { return x.id || x.sessionId; })); additions.forEach(function (x) { var id = x.id || x.sessionId; if (!ids.has(id)) { rows.push(x); ids.add(id); } }); write(key, rows); }
  function ensure() {
    try {
      if (global.localStorage.getItem(MARKER)) return;
      var now = Date.now();
      var groups = [
        { id: 'demo-class-7a', grade: '七年级', name: '向阳班（演示）', createdAt: new Date(now - 86400000 * 30).toISOString(), demo: true },
        { id: 'demo-class-7b', grade: '七年级', name: '青禾班（演示）', createdAt: new Date(now - 86400000 * 26).toISOString(), demo: true },
        { id: 'demo-class-8a', grade: '八年级', name: '星河班（演示）', createdAt: new Date(now - 86400000 * 18).toISOString(), demo: true }
      ];
      var students = [];
      [['demo-class-7a', 12], ['demo-class-7b', 10], ['demo-class-8a', 11]].forEach(function (pair) {
        for (var i = 1; i <= pair[1]; i++) students.push({ id: pair[0] + '-student-' + i, classId: pair[0], name: '学生' + String(i).padStart(2, '0'), studentNo: pair[0].slice(-2).toUpperCase() + String(i).padStart(3, '0'), demo: true });
      });
      var records = [
        { sessionId: 'demo-session-01', title: '走进初中，拥抱新起点', className: '七年级 · 向阳班（演示）', at: now - 86400000 * 2, status: '已结束', expectedStudents: 12, actualStudents: 11, stageProgress: { enter: 100, story: 100, talk: 91, practice: 91, closing: 87 }, observations: { participation: '大多数学生按时进入课堂并完成课堂环节；该汇总仅用于复盘组织情况。', expression: '班级表达以匿名汇总呈现；个人表达仍保留在学生私密范围内。', support: '有学生在收束环节主动选择“想让老师知道”，需由老师按校内流程人工跟进。' }, demo: true },
        { sessionId: 'demo-session-02', title: '独一无二的我', className: '七年级 · 青禾班（演示）', at: now - 86400000 * 6, status: '已结束', expectedStudents: 10, actualStudents: 10, stageProgress: { enter: 100, story: 100, talk: 90, practice: 100, closing: 90 }, observations: { participation: '课堂节奏平稳，学生完成了体验训练。', expression: '课堂记录不展示私密对话全文，只保留合规的班级层面汇总。', support: '本次无新增学生主动求助记录。' }, demo: true }
      ];
      addMissing(read(CLASS_KEY), groups, CLASS_KEY);
      addMissing(read(STUDENT_KEY), students, STUDENT_KEY);
      addMissing(read(RECORD_KEY), records, RECORD_KEY);
      global.localStorage.setItem(MARKER, '1');
    } catch (e) { /* local preview remains usable without seed data */ }
  }
  global.YTSeedDemo = { ensure: ensure };
})(window);
