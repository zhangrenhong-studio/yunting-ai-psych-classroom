/* 云听平台演示数据：仅用于静态预览，绝不表示真实学校、班级或学生。 */
(function (global) {
  'use strict';
  var CLASS_KEY = 'yunting-class-groups-v1';
  var STUDENT_KEY = 'yunting-class-students-v1';
  var RECORD_KEY = 'yunting-class-records-v1';
  var MARKER = 'yunting-demo-seed-v1';
  var DEMO_NAMES = ["林梓涵", "陈予安", "周语桐", "许嘉树", "沈清禾", "苏念安", "江书宁", "顾明轩", "叶知夏", "陆星遥", "唐可欣", "程亦然", "宋雨桐", "韩嘉宁", "夏沐辰", "赵清妍", "方景行", "蒋思悦", "罗予辰", "白若溪", "梁知远", "秦安然", "谢语乔", "邵明宇", "何嘉禾", "吴念初", "郑舒然", "冯奕帆", "高语晴", "徐慕言", "曹星冉", "袁书航", "戴清越"];
  function read(key) { try { var x = JSON.parse(global.localStorage.getItem(key)); return Array.isArray(x) ? x : []; } catch (e) { return []; } }
  function write(key, rows) { global.localStorage.setItem(key, JSON.stringify(rows)); }
  function addMissing(rows, additions, key) { var ids = new Set(rows.map(function (x) { return x.id || x.sessionId; })); additions.forEach(function (x) { var id = x.id || x.sessionId; if (!ids.has(id)) { rows.push(x); ids.add(id); } }); write(key, rows); }
  function demoName(classId, index) { var offsets = {'demo-class-7a':0,'demo-class-7b':12,'demo-class-8a':22}; return DEMO_NAMES[(offsets[classId] || 0) + index - 1] || ('演示学生' + index); }
  function migrateDemoNames() { var rows=read(STUDENT_KEY),changed=false; rows.forEach(function(x){ if(!x.demo)return; var m=String(x.id||'').match(/-student-(\d+)$/); if(!m)return; var next=demoName(x.classId,Number(m[1])); if(x.name!==next){x.name=next;changed=true;} }); if(changed)write(STUDENT_KEY,rows); }
  function demoActivity(classId, count, absentIndexes, supportIndexes) {
    absentIndexes = absentIndexes || []; supportIndexes = supportIndexes || [];
    var rows=[];
    for(var i=1;i<=count;i++){
      var absent=absentIndexes.indexOf(i)>=0, full=!absent && i%4!==0, partial=!absent && !full;
      rows.push({
        studentId:classId+'-student-'+i,
        present:!absent,
        connection:absent?'未进入':(i%5===0?'曾重连':'在线稳定'),
        completedStages:absent?[]:(full?['enter','story','talk','energy','playground','closing']:['enter','story','talk','energy']),
        participation:absent?'未进入课堂':(full?'完成全部课堂环节':'完成主要环节，后两个环节未提交完成'),
        observation:absent?'本堂课无课堂参与数据':(i%3===0?'按提示完成互动与训练，课堂过程记录完整':'已完成课堂任务，未产生需要单独处理的课堂事项'),
        supportRequest:supportIndexes.indexOf(i)>=0
      });
    }
    return rows;
  }
  function migrateDemoRecords() {
    var rows=read(RECORD_KEY),changed=false;
    rows.forEach(function(x){
      if(!x.demo || Array.isArray(x.studentActivity))return;
      if(x.sessionId==='demo-session-01'){x.studentActivity=demoActivity('demo-class-7a',12,[8],[4]);x.absentStudentIds=['demo-class-7a-student-8'];changed=true;}
      if(x.sessionId==='demo-session-02'){x.studentActivity=demoActivity('demo-class-7b',10,[],[]);x.absentStudentIds=[];changed=true;}
    });
    if(changed)write(RECORD_KEY,rows);
  }
  function ensure() {
    try {
      migrateDemoNames();
      migrateDemoRecords();
      var now = Date.now();
      var groups = [
        { id: 'demo-class-7a', grade: '七年级', name: '向阳班（演示）', createdAt: new Date(now - 86400000 * 30).toISOString(), demo: true },
        { id: 'demo-class-7b', grade: '七年级', name: '青禾班（演示）', createdAt: new Date(now - 86400000 * 26).toISOString(), demo: true },
        { id: 'demo-class-8a', grade: '八年级', name: '星河班（演示）', createdAt: new Date(now - 86400000 * 18).toISOString(), demo: true }
      ];
      var students = [];
      [['demo-class-7a', 12], ['demo-class-7b', 10], ['demo-class-8a', 11]].forEach(function (pair) {
        for (var i = 1; i <= pair[1]; i++) students.push({ id: pair[0] + '-student-' + i, classId: pair[0], name: demoName(pair[0], i), studentNo: pair[0].slice(-2).toUpperCase() + String(i).padStart(3, '0'), gender: i % 2 ? '女' : '男', demo: true });
      });
      var records = [
        { sessionId: 'demo-session-01', classId: 'demo-class-7a', title: '走进初中，拥抱新起点', className: '七年级 · 向阳班（演示）', at: now - 86400000 * 2, endedAt: now - 86400000 * 2 + 2700000, status: '已结束', expectedStudents: 12, actualStudents: 11, presenceMode: 'simulated', reachedStages: ['enter','story','talk','energy','playground','closing'], observations: { participation: '课堂节奏按计划完成，故事导入和成长训练场的参与较集中。', expression: '公开课堂互动完成情况已汇总；不展示学生私密对话全文。', support: '有1名学生主动提交了希望老师了解的事项，需按校内流程回应。' }, studentActivity: demoActivity('demo-class-7a',12,[8],[4]), absentStudentIds:['demo-class-7a-student-8'], demo: true },
        { sessionId: 'demo-session-02', classId: 'demo-class-7b', title: '独一无二的我', className: '七年级 · 青禾班（演示）', at: now - 86400000 * 6, endedAt: now - 86400000 * 6 + 2700000, status: '已结束', expectedStudents: 10, actualStudents: 10, presenceMode: 'simulated', reachedStages: ['enter','story','talk','energy','playground','closing'], observations: { participation: '课堂流程完整，学生均进入课堂并完成主要环节。', expression: '公开课堂互动完成情况已汇总；不展示学生私密对话全文。', support: '本次课堂没有新增学生主动关注事项。' }, studentActivity: demoActivity('demo-class-7b',10,[],[]), absentStudentIds:[], demo: true }
      ];
      var currentGroups = read(CLASS_KEY), currentStudents = read(STUDENT_KEY), currentRecords = read(RECORD_KEY);
      var hasOwnerGroups = currentGroups.some(function (x) { return !x.demo; });
      var hasOwnerStudents = currentStudents.some(function (x) { return !x.demo; });
      var hasOwnerRecords = currentRecords.some(function (x) { return !x.demo; });
      if (!currentGroups.length) addMissing(currentGroups, groups, CLASS_KEY);
      if (!currentStudents.length && !hasOwnerGroups) addMissing(currentStudents, students, STUDENT_KEY);
      if (!currentRecords.length && !hasOwnerGroups && !hasOwnerStudents) addMissing(currentRecords, records, RECORD_KEY);
      global.localStorage.setItem(MARKER, (hasOwnerGroups || hasOwnerStudents || hasOwnerRecords) ? 'preserved-owner-data' : '1');
    } catch (e) { /* local preview remains usable without seed data */ }
  }
  global.YTSeedDemo = { ensure: ensure };
})(window);
