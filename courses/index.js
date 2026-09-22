/* ==========================================================================
   云听 AI 智慧心理教室 · 课程库清单
   --------------------------------------------------------------------------
   依据《中学生心理健康教育完整课程大纲》整理：初高中 6 个年级 × 8 个主题块
   = 48 个主题块，外加 5 类通用专项。

   每个主题块对应课程大纲里的一组「2 课时」，在平台上按 45 分钟一节上完。

   courseId 有值 = 已建成，可进入；为 null = 待建设，首页置灰不可点。
   新增一节已建成的课，只需要在这里填上 courseId。
   ========================================================================== */

(function (global) {
  'use strict';

  var LIBRARY = {
    stages: [
      /* ================================================================
         初中
         ================================================================ */
      {
        id: 'junior',
        name: '初中',
        blurb: '适应过渡、情绪启蒙、人际适应、青春期成长、抗挫能力培养',
        grades: [
          {
            id: 'grade-7',
            name: '七年级',
            core: '适应与成长 · 认识全新自我',
            courses: [
              { order: 1, title: '走进初中，拥抱新起点',   summary: '初中生活变化与心理适应、新生常见迷茫调适、班级心理融入', courseId: 'lesson-01' },
              { order: 2, title: '独一无二的我',           summary: '我的优缺点盘点、正视不完美、拒绝自我否定、学会接纳自己', courseId: 'lesson-02' },
              { order: 3, title: '情绪小管家',             summary: '喜怒哀乐的情绪分类、读懂自己的情绪信号、情绪无好坏', courseId: null },
              { order: 4, title: '学会好好说话',           summary: '同学相处之道、初识交往边界、学会倾听与礼貌表达', courseId: null },
              { order: 5, title: '告别拖延，轻松学习',     summary: '拖延心理成因、克服惰性的小方法、合理分配时间', courseId: null },
              { order: 6, title: '青春期的小变化',         summary: '身心变化、正视成长发育差异、克服容貌焦虑', courseId: null },
              { order: 7, title: '面对挫折，勇敢前行',     summary: '考试失利、交友受挫后的心理调适、培养初步抗挫能力', courseId: null },
              { order: 8, title: '学期心理复盘与成长规划', summary: '本学期心理成长总结、梳理自身问题、制定下学期目标', courseId: null }
            ]
          },
          {
            id: 'grade-8',
            name: '八年级',
            core: '情绪与人际 · 解锁成长困惑',
            courses: [
              { order: 1, title: '情绪调控小妙招',         summary: '愤怒、焦虑、敏感等负面情绪调节、正念放松、合理宣泄', courseId: null },
              { order: 2, title: '读懂亲情，化解亲子矛盾', summary: '青春期叛逆心理解读、理解父母的沟通方式、化解争吵', courseId: null },
              { order: 3, title: '同伴交往与边界感',       summary: '真心朋友的定义、远离小团体与排挤、学会拒绝', courseId: null },
              { order: 4, title: '理性看待青春期好感',     summary: '区分好感与早恋、异性正常交往边界、专注自我成长', courseId: null },
              { order: 5, title: '拒绝内耗，停止自我否定', summary: '精神内耗的表现、过度敏感与胡思乱想的调适', courseId: null },
              { order: 6, title: '考试焦虑调适',           summary: '考前紧张、失眠、发挥失常的心理原因与调整技巧', courseId: null },
              { order: 7, title: '自我保护与心理安全',     summary: '校园欺凌识别与自我保护、网络言论边界', courseId: null },
              { order: 8, title: '八年级成长沉淀与心态升级', summary: '梳理青春期困惑、总结情绪与人际处理经验', courseId: null }
            ]
          },
          {
            id: 'grade-9',
            name: '九年级',
            core: '压力与冲刺 · 从容迎战中考',
            courses: [
              { order: 1, title: '与压力共处，解锁备考心态', summary: '中考压力正常化认知、科学减压、缓解备考疲惫', courseId: null },
              { order: 2, title: '克服厌学，重拾学习动力',   summary: '备考倦怠与厌学心理疏导、找回学习目标', courseId: null },
              { order: 3, title: '拒绝攀比，做自己的主角',   summary: '克服成绩攀比焦虑、接纳自身节奏、避免自我内卷', courseId: null },
              { order: 4, title: '高效备考的心理法则',       summary: '克服考前浮躁、专注力训练、合理看待模考成绩', courseId: null },
              { order: 5, title: '亲子支持，助力中考',       summary: '化解备考期间亲子矛盾、构建家庭支持系统', courseId: null },
              { order: 6, title: '挫折韧性：不惧失利',       summary: '模考失利心理调适、拒绝自我放弃、培养备考韧性', courseId: null },
              { order: 7, title: '我的未来我做主',           summary: '了解不同升学路径、初步认知兴趣与特长', courseId: null },
              { order: 8, title: '中考心态收官与毕业成长',   summary: '考前终极心态调整、告别初中、勇敢奔赴新阶段', courseId: null }
            ]
          }
        ]
      },

      /* ================================================================
         高中
         ================================================================ */
      {
        id: 'senior',
        name: '高中',
        blurb: '人格完善、深度情绪管理、成熟人际、高压学业调适、生涯规划、生命教育',
        grades: [
          {
            id: 'grade-10',
            name: '高一',
            core: '适应与重塑 · 确立高中成长基调',
            courses: [
              { order: 1, title: '跨越初高中落差',         summary: '初高中学习与心理差异、新生适应障碍调适、融入新集体', courseId: null },
              { order: 2, title: '深度自我认知：构建稳定内核', summary: '探索性格、优势与短板、摆脱他人评价焦虑', courseId: null },
              { order: 3, title: '高级情绪管理：做情绪的主人', summary: '情绪识别、内耗根治、情绪稳定训练与长期维稳', courseId: null },
              { order: 4, title: '高中生高效人际相处',     summary: '高质量交友、学会独处、处理宿舍人际矛盾', courseId: null },
              { order: 5, title: '破解高中学习困境',       summary: '听不懂、学不会的心理调适、克服假性努力', courseId: null },
              { order: 6, title: '网络心理与自律成长',     summary: '摆脱手机依赖、拒绝网络沉迷、树立健康上网心态', courseId: null },
              { order: 7, title: '青春期成熟认知与自我边界', summary: '理性看待情感关系、守住身心边界、自尊自爱自律', courseId: null },
              { order: 8, title: '高一复盘：夯实成长基础', summary: '总结适应期问题、优化心态与学习状态', courseId: null }
            ]
          },
          {
            id: 'grade-11',
            name: '高二',
            core: '沉淀与突破 · 化解成长瓶颈',
            courses: [
              { order: 1, title: '破解高二迷茫',           summary: '高二分水岭心理特点、摆脱学习倦怠、重塑学习动力', courseId: null },
              { order: 2, title: '压力管理与心理韧性提升', summary: '长期高压下的心理调适、科学解压、避免心理透支', courseId: null },
              { order: 3, title: '深度沟通：化解亲子与师生矛盾', summary: '亲子代沟化解、理性面对老师批评、师生沟通技巧', courseId: null },
              { order: 4, title: '竞争与合作',             summary: '摆脱恶性竞争焦虑、学会良性竞争、克服嫉妒心理', courseId: null },
              { order: 5, title: '生涯探索：发现自我优势', summary: '兴趣、性格、能力测评分析、结合选科探索专业方向', courseId: null },
              { order: 6, title: '完美主义自救',           summary: '克服过度完美主义、接受不完美、摆脱苛求自我', courseId: null },
              { order: 7, title: '生命教育：敬畏生命',     summary: '生命的意义与价值、正视挫折与苦难、珍爱自我', courseId: null },
              { order: 8, title: '高二蓄力：为高三赋能',   summary: '梳理成长短板、调整备考心态、储备心理能量', courseId: null }
            ]
          },
          {
            id: 'grade-12',
            name: '高三',
            core: '冲刺与蜕变 · 从容迎战高考',
            courses: [
              { order: 1, title: '高考高压心态重塑',       summary: '高三全年心理变化规律、接纳高压、建立常态化心态', courseId: null },
              { order: 2, title: '重度考试焦虑专项调适',   summary: '考前失眠、心慌、逃避心理矫正、临场调节技巧', courseId: null },
              { order: 3, title: '突破学习瓶颈',           summary: '高原期心理疏导、成绩波动正常化认知、坚持沉淀', courseId: null },
              { order: 4, title: '拒绝精神内耗，专注自我成长', summary: '摆脱成绩攀比、过度思虑、建立稳定备考内核', courseId: null },
              { order: 5, title: '家庭支持与情绪求助',     summary: '化解家庭期待压力、学会倾诉与求助', courseId: null },
              { order: 6, title: '抗挫折专项训练：容错备考', summary: '模考连续失利心态调整、培养越挫越勇的韧性', courseId: null },
              { order: 7, title: '生涯抉择与未来展望',     summary: '高考志愿初步认知、专业与职业匹配、长远目标', courseId: null },
              { order: 8, title: '高考终极心态与成长蜕变', summary: '考前终极放松训练、接纳所有付出、奔赴未来', courseId: null }
            ]
          }
        ]
      }
    ],

    /* 通用专项补充课程：可灵活穿插授课，全学段适用 */
    specials: [
      { id: 'sp-social',  name: '人际交往专项', summary: '拒绝讨好型人格、化解宿舍矛盾、学会拒绝、远离校园冷暴力' },
      { id: 'sp-emotion', name: '情绪心理专项', summary: '自卑心理疏导、敏感多疑调适、暴躁情绪控制、孤独感化解' },
      { id: 'sp-study',   name: '学习心理专项', summary: '专注力提升、记忆力心理训练、拖延根治、厌学情绪疏导' },
      { id: 'sp-safety',  name: '安全心理专项', summary: '校园欺凌预防、网络心理安全、自我保护、心理危机识别' },
      { id: 'sp-positive', name: '积极心理专项', summary: '自信心建立、感恩教育、积极心态培养、心理韧性提升' }
    ]
  };

  global.COURSE_LIBRARY = LIBRARY;
})(window);
