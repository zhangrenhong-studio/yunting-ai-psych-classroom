/* Register only the exact confirmed classroom snapshot as an independent package. */
(function(g){'use strict';var q=new URLSearchParams(location.search),s=g.YTClassroomDemo&&g.YTClassroomDemo.read(),d=s&&s.themeStorySnapshot;
if(q.get('mode')!=='classroom'||!d||!d.confirmed||q.get('session')!==s.sessionId||q.get('id')!==s.courseId||!g.YTThemePackage)return;
var course=d.packageSnapshot?JSON.parse(JSON.stringify(d.packageSnapshot)):g.YTThemePackage.build(d);if(!course)return;
/* Legacy scheduled snapshots keep their exact identity but get their own theme content. */
course.id=s.courseId;g.COURSE_REGISTRY=g.COURSE_REGISTRY||[];var i=g.COURSE_REGISTRY.findIndex(function(c){return c.id===s.courseId});if(i<0)g.COURSE_REGISTRY.push(course);else g.COURSE_REGISTRY[i]=course;
})(window);
