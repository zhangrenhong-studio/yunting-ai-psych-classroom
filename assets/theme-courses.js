/* 云听主题课程：八维度 → 预设主题；自定义主题由老师补充。 */
(function(global){
'use strict';
function topic(id,title,summary,goal,dialogueFocus,energyTrack,game,courseId){
  return {id:id,title:title,summary:summary,goal:goal,dialogueFocus:dialogueFocus,boundary:'不要求学生公开个人经历，不做诊断、评分或自动风险结论；学生主动提出需要帮助时，转入学校批准的人际支持流程。',energyTrack:energyTrack,game:game,grades:['七年级','八年级','九年级'],courseId:courseId||null};
}
var dimensions=[
  {id:'emotion',assessmentDimension:'情绪健康',name:'情绪觉察与调节',short:'认识情绪，也练习和情绪相处。',tone:'mint',topics:[
    topic('emotion-unclear','情绪说不清楚的时候','从身体、想法和情境中慢慢辨认自己的感受。','帮助学生识别当下感受，并找到合适的表达方式。','从“最近一次说不清楚的感受”开始，辨认身体与想法信号。','情绪觉察与安定','情绪线索配对'),
    topic('emotion-anger','生气的时候先停一下','理解愤怒背后的需要，练习暂停后再选择。','帮助学生看见愤怒信号，并练习暂停与表达。','围绕生气前后的身体变化、想法和需要展开。','身体降速与觉察','情境回应训练')
  ]},
  {id:'attention',assessmentDimension:'注意专注',name:'专注力与注意训练',short:'把注意力慢慢带回正在做的事。',tone:'blue',topics:[
    topic('attention-distracted','总是容易分心怎么办','看见干扰来源，建立可以执行的专注步骤。','帮助学生辨认分心来源，找到重新开始的一小步。','从课堂、作业或阅读中一次真实的分心时刻开始。','注意回收与聚焦','目标搜索'),
    topic('attention-interference','干扰很多也能慢慢找回来','在信息和情绪干扰下练习注意控制。','帮助学生在多个刺激中重新找到当前目标。','区分外部干扰与脑海中的内部干扰。','安静聚焦','Stroop训练')
  ]},
  {id:'learning',assessmentDimension:'学习行为',name:'学习动力与方法',short:'从拖延和挫败里找到下一小步。',tone:'amber',topics:[
    topic('learning-delay','明明想学，却总是拖延','理解拖延背后的压力，拆出能开始的小行动。','帮助学生减少自责，把任务拆成能开始的一步。','围绕“知道要做但迟迟没有开始”的时刻展开。','行动启动','三分钟启动挑战'),
    topic('learning-setback','一次没考好以后','把成绩和自我价值分开，练习复盘而非否定。','帮助学生理解失利后的反应，并找到可调整的部分。','区分成绩事实、自动想法和下一步行动。','挫折后的安定','复盘路径训练')
  ]},
  {id:'social',assessmentDimension:'社会交往',name:'同伴相处与沟通',short:'练习理解、表达、边界与关系修复。',tone:'violet',topics:[
    topic('social-misunderstanding','和朋友产生误会','理解不同视角，练习澄清和关系修复。','帮助学生区分事实与猜测，练习把话说开。','从一次“我以为对方……”的经历开始。','沟通前的安定','事实与猜测分类'),
    topic('social-boundary','不知道怎样拒绝别人','认识关系边界，练习清楚而不攻击的拒绝。','帮助学生识别勉强答应的信号，并练习边界表达。','围绕一次想拒绝却没有说出口的时刻展开。','表达稳定','拒绝与协商训练')
  ]},
  {id:'anxiety',assessmentDimension:'焦虑抑郁状态',name:'紧张与低落情绪应对',short:'在紧张或低落时找到安全、可执行的支持。',tone:'rose',topics:[
    topic('anxiety-exam','考试前的紧张','认识紧张信号，练习把注意力带回当前。','帮助学生听懂紧张信号，形成自己的考前安定步骤。','从考前身体、想法和行为的变化开始。','身体安定与注意回收','紧张信号识别'),
    topic('anxiety-low','什么都不太想做的时候','在低能量时减少自责，寻找微小行动和支持。','帮助学生觉察低能量状态，找到可承受的小行动。','不贴标签地聊聊最近的能量变化与支持需要。','温和休息与能量唤起','支持路径训练')
  ]},
  {id:'sleep',assessmentDimension:'睡眠休息',name:'睡眠与身心恢复',short:'理解休息信号，练习让身心慢下来。',tone:'indigo',topics:[
    topic('sleep-thoughts','脑子停不下来的夜晚','看见睡前反复思考，建立温和的过渡。','帮助学生辨认睡前信号，形成现实可行的过渡步骤。','围绕躺下后仍停不下来的想法展开。','睡前安顿','睡眠线索识别'),
    topic('sleep-screen','睡前放下手机为什么这么难','理解即时刺激与休息之间的拉扯。','帮助学生识别继续刷手机的触发点，设计自己的边界。','从一次“本来只想再看一会儿”的经历开始。','注意降速','屏幕边界训练')
  ]},
  {id:'family',assessmentDimension:'亲子关系',name:'家庭沟通与理解',short:'在家庭关系中练习表达需要与理解差异。',tone:'coral',topics:[
    topic('family-understood','感觉父母不理解自己','区分期待、担心和感受，寻找可沟通的入口。','帮助学生看见双方需要，练习更清楚地表达。','从一次“怎么说都说不到一起”的对话开始。','沟通前安定','不同视角配对'),
    topic('family-expectation','当期待变成压力','理解家庭期待带来的复杂感受与边界。','帮助学生辨认压力来源，并找到可协商的部分。','围绕期待、比较与自我要求之间的关系展开。','压力安定','目标协商训练')
  ]},
  {id:'stress',assessmentDimension:'应激应对',name:'压力、挫折与适应',short:'面对变化和挫折时，练习恢复与求助。',tone:'cyan',topics:[
    topic('stress-adaptation','进入新环境的不适应','理解陌生、犹豫和期待，逐步建立归属感。','帮助学生认识新环境中的真实感受，并找到连接行动。','围绕进入新学校、新班级后的陌生与期待展开。','进入新环境的安定','环境适应训练','lesson-01'),
    topic('stress-failure','遇到失败以后怎样继续','认识挫折反应，练习恢复、调整和求助。','帮助学生识别挫折后的反应，找到重新开始的一小步。','从一次失败后的身体、情绪和想法变化开始。','挫折后的安定','行动路径训练')
  ]}
];
function allTopics(){var out=[];dimensions.forEach(function(d){d.topics.forEach(function(t){out.push(Object.assign({},t,{dimensionId:d.id,dimensionName:d.name,dimensionTone:d.tone,assessmentDimension:d.assessmentDimension,topicId:t.id,topicTitle:t.title}))})});return out;}
function topicById(id){return allTopics().find(function(x){return x.id===id})||null;}
/* 兼容旧页面读取，仅把已完成课程包暴露为可开课项目。 */
function allLessons(){return allTopics().filter(function(x){return !!x.courseId}).map(function(x){return Object.assign({},x,{order:1,topicId:x.id,topicTitle:x.title});});}
global.YT_THEME_COURSES={dimensions:dimensions,allTopics:allTopics,topicById:topicById,allLessons:allLessons};
})(window);
