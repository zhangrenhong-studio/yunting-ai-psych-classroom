/* 成长档案叙述层：不计算分数，不把示例建议当作自动生成结果。 */
(function(global){
'use strict';
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function bullets(xs,empty){return Array.isArray(xs)&&xs.length?'<ul>'+xs.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p class="gn-muted">'+esc(empty)+'</p>'}
const examples={
 'demo-class-7a-student-4':{strengths:['曾主动询问可以向谁寻求帮助，这是可以进一步支持的求助意愿。'],suggestions:['安排一次不被打扰的私下交流，先询问最近最影响休息和精力的具体事情。','与学生共同商量一个可行的小调整，并按学校支持流程决定是否需要进一步专业评估。'],followUp:['后续了解睡眠和日间精力的实际变化，不用一次训练完成情况判断改善。','确认学生是否知道可以向谁求助，以及是否愿意接受进一步支持。']},
 'demo-class-7b-student-2':{strengths:['愿意尝试向可信任的成人求助，可把这一意愿作为建立支持的起点。'],suggestions:['先听学生描述考试前最担心的具体情境，避免只说“别紧张”。','一起区分能调整的小行动与暂时无法控制的结果，不以成绩评价其努力。'],followUp:['后续了解反复自我否定与睡眠受影响的表达是否持续。','关注学生采用支持办法后的主观感受，而不只看任务是否完成。']},
 'demo-class-8a-student-7':{strengths:['表达了家人愿意倾听，家庭支持是当前可以依靠的资源。'],suggestions:['先了解同伴误解发生的情境和学生自己的意愿，不急于要求当面对质。','如学生愿意，可一起练习一句表达感受和需要的话，再选择是否尝试沟通。'],followUp:['留意回避是否影响其日常学习和同伴相处。','了解家庭倾听是否仍能提供支持，尊重学生的分享边界。']},
 'demo-class-7a-student-9':{strengths:[],suggestions:['先询问学生最希望家人理解的是什么，不预设责任在学生或家长。','是否开展家庭沟通，应结合学生意愿与学校支持流程决定。'],followUp:['了解家庭沟通压力是否继续出现，以及对日常生活有何影响。']}
};
global.YTGrowthNarrative={render:function(student,ins){
 const n=ins&&ins.narrative,allowed=n&&n.teacherVisible===true&&Array.isArray(n.evidence)&&n.evidence.some(x=>x.teacherVisible===true&&x.text),demo=!!(ins&&ins.demo),sample=demo?(examples[String(student.id)]||{strengths:[],suggestions:['从学生近期最在意的一件具体事情开始交流，确认其是否需要帮助。','和学生商量一个愿意尝试的小行动；不因为当前分数较高就忽略其新的需要。'],followUp:['后续关注学生主动提到的情境和感受，有新材料时再调整支持。']}):null;
 const summary=allowed&&n.summary?n.summary:ins&&ins.summary;
 const strengths=allowed?n.strengths:sample&&sample.strengths,suggestions=allowed?n.suggestions:sample&&sample.suggestions,followUp=allowed?n.followUp:sample&&sample.followUp;
 const evidence=allowed?n.evidence.filter(x=>x.teacherVisible===true&&x.text):ins&&Array.isArray(ins.evidence)?ins.evidence.map(text=>({text,source:'近期综合分析依据',at:ins.updatedAt})):[];
 return '<section class="content-card gn-panel" id="growth-summary"><div class="gn-head"><div><p class="gn-kicker">先了解这个学生，再看数据</p><h2>近期成长总结与支持建议</h2></div><span class="gn-tag">'+(demo?'演示档案 · 建议为人工编写样例':allowed?'已有分析':'材料待完善')+'</span></div><p class="gn-meta">'+esc(ins&&ins.window||'观察周期未记录')+' · 更新于 '+esc(allowed&&n.updatedAt||ins&&ins.updatedAt||'尚未更新')+' · '+(demo?'非真实学生评估':'结合持续信息，不以单次课堂下结论')+'</p><div class="gn-summary"><h3>近期成长总结</h3><p>'+esc(summary||'目前可用于总结的材料不足。先保留已知记录，在后续交流中逐步了解，不默认状态正常，也不急于贴标签。')+'</p></div><div class="gn-columns"><article><h3>优势与积极线索</h3>'+bullets(strengths,'暂无足够依据描述具体优势，后续留意学生的主动尝试、兴趣和支持资源。')+'</article><article><h3>给老师的支持建议</h3>'+bullets(suggestions,'暂无个性化建议。可先了解学生本人近期的感受与需要，再决定如何支持。')+'</article></div><div class="gn-follow"><h3>后续重点关注</h3>'+bullets(followUp,'有新的学生反馈或老师观察后，再补充具体关注事项。')+'</div><details class="gn-evidence"><summary>查看总结依据（'+evidence.length+' 条）</summary>'+evidence.map(x=>'<article><b>'+esc(x.source||'已授权材料')+'</b><small>'+esc(x.at||'时间未记录')+'</small><p>'+esc(x.text)+'</p></article>').join('')+(evidence.length?'':'<p>暂无可查看依据。</p>')+'</details><p class="gn-boundary">本课总结记录一次课堂的发现；本档案关注持续变化。总结与建议不自动改变分数，不替代老师核实或专业评估。</p></section>';
}};
})(window);
