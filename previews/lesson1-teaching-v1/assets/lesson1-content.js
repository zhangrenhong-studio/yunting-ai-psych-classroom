/* First-lesson teaching content only. Other courses remain unchanged. */
(function(g){'use strict';
var c=(g.COURSE_REGISTRY||[]).find(function(x){return x.id==='lesson-01'});if(!c)return;
c.title='换了新环境，慢一点也没关系';c.subtitle='适应是一个过程，进步比完美更重要';
c.stages.enter.title=c.title;c.stages.enter.eyebrow='七年级 · 适应与成长 · 第1课';c.stages.enter.subtitle='情绪上，接纳自己的节奏；专注上，温柔拉回注意力；学习上，从小行动开始。';c.stages.enter.opening='今天，我们一起聊聊新环境里的变化。可以表达，也可以先安静想一想。';c.stages.enter.audio=null;
c.stages.story={frameLabel:'小泽的初一第一周',bookTitle:'小泽的初一第一周',bookNote:'换了新环境，慢一点也没关系',disableLegacyAudio:true,beats:[{id:'lesson1-story',scene:'初一 · 第一周',text:'小泽小学时成绩不错，上了初中第一周就懵了：一下子七门课，作业堆成山，上课节奏也比小学快很多。看着同桌很快就和新同学打成一片，自己却还没交到朋友，小泽心里暗暗着急。'},{id:'lesson1-thought',scene:'他心里的疑问',text:'为什么别人都适应得那么快？是不是我比别人差？'}],narration:{},prompt:{id:'lesson-01-story',text:'如果你是小泽的朋友，你会对他说什么？',placeholder:'可以只谈小泽，写一句理解或一个建议，不必讲自己的经历。',maxLen:500},knowledge:{concept:'心理适应',title:'初中与小学：到底哪里变了？',paragraphs:[
'课程任务、老师讲课节奏以及同学、老师和环境可能都发生变化。有些事需要重新熟悉，也需要更主动地安排。具体科目数量以本校安排为准。',
'心理适应，可以理解为环境变化以后，我们逐渐调整认识和做法，找到与新环境相处的方式。暂时忙乱不说明整个人能力差，不同的人在不同事情上的速度也可能不同。',
'同样是一项作业没有完成，“我怎么这么差”是对整个人的评价；“这项还没完成，我需要看看卡在哪一步”更具体。我们对事情的解释会影响感受，但真实任务和支持条件也需要被看见。',
'五分钟启动法：不想做的事，可以先用五分钟试着开始。时间到了再看是否继续、调整或求助，并不保证一开始就能顺利做完。',
'拆分任务：把大作业拆成小事，先看清要求、选一项、从第一小步开始。做完一件可划掉一件，要求不明时先问清楚。',
'温和自我对话：不说“我怎么这么差”，可以说“我正在慢慢适应，这次要求还没弄清，可以先问一个问题”。不是强迫乐观，而是把问题说具体。',
'可以先选一个办法，在老师示范后实际试一试。适应不等于忍受欺负或伤害，遇到持续困扰和安全担忧时，需要可信任的成人提供支持。'
],core:'适应是一个过程，进步比完美更重要。'}};
c.stages.talk.opening=['刚才我们读了《小泽的初一第一周》，也认识了三个适应小妙招。','你可以只谈小泽，也可以选一件普通小事：先试着拆清第一步，或改写一句责备自己的话。'];
var talk=c.stages.talk.nodes||[];
if(talk[0])talk[0].say=['我看到了你对小泽的想法：「{{storyEcho}}」。','下面围绕一个具体小行动继续练习，你也可以先听或独立书写。'];
if(talk[1]){talk[1].say=['你想先试哪个办法：五分钟启动、拆分任务，还是温和自我对话？也可以只替小泽想。'];talk[1].branches=[];talk[1].replies={};}
if(talk[3]){talk[3].say=['如果只选一件小事，可以先做哪一步？不顺利时，还能怎样调整或求助？'];talk[3].branches=[];talk[3].replies={};}
c.stages.closing.ending=['适应是一个过程，进步比完美更重要。','小目标可以调整；需要时可以向老师或可信任的成人求助。'];c.stages.closing.audio=null;c.stages.closing.lessonGoal=true;
g.YTLesson1Durations={enter:4,story:11,talk:10,energy:6,playground:5,closing:9};
})(window);
