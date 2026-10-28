/* Same-browser review bridge. No real accounts, notifications, assessment pipeline or automatic monitoring. */
(function(global){
'use strict';
var previous=global.fetch.bind(global),model=global.YTSupportReports;
if(global.YTSeedDemo)global.YTSeedDemo.ensure();
model.initialize();
global.YTReviewV4Seed=function(store){
 var groups=model.groups(),students=model.roster().filter(function(s){return s.school_id===1});
 store.classes=store.classes.filter(function(c){return c.school_id!==1}).concat(groups);
 store.students=store.students.filter(function(s){return s.school_id!==1}).concat(students.map(function(s){return Object.assign({},s,{teacher_id:1,created_by_role:'teacher',created_by_id:1})}));
 store.teachers.forEach(function(t){t.class_ids=store.classes.filter(function(c){return c.teacher_id===t.id&&c.status!=='archived'}).map(function(c){return c.id})});
 store.lessons.forEach(function(l){if(l.school_id===1&&groups[0])l.class_id=groups[0].id});
 syncExtras(store);
};
function syncExtras(store){model.setExtraRoster(store.students.filter(function(s){return s.school_id!==1}).map(function(s){var c=store.classes.find(function(c){return String(c.id)===String(s.class_id)});return Object.assign({},s,{class_status:c?.status||'inactive'})}))}
global.fetch=async function(input,options){
 var u=new URL(typeof input==='string'?input:input.url,location.href);
 if(u.origin!==location.origin||u.pathname!=='/api/report-overview')return previous(input,options);
 var session=await previous('/api/session');if(!session.ok)return session;
 try{
  // The underlying preview initializes the v4 namespace and invokes the seed bridge once.
  var schoolsResponse=await previous('/api/operations');if(!schoolsResponse.ok)return schoolsResponse;
  var ops=await schoolsResponse.json(),schools=ops.schools||[];
  var store=JSON.parse(localStorage.getItem('yunting-admin-architecture-review-v4-data')||'null');
  if(store)syncExtras(store);
  var filters=Object.fromEntries(u.searchParams),allClasses=store?.classes||[];
  if(filters.school_id&&!schools.some(function(s){return String(s.id)===String(filters.school_id)}))throw Error('学校不存在');
  if(filters.class_id&&!allClasses.some(function(c){return String(c.id)===String(filters.class_id)&&(!filters.school_id||String(c.school_id)===String(filters.school_id))}))throw Error('班级不存在或不属于所选学校');
  var currentRoster=store?store.students.map(function(s){var c=store.classes.find(function(c){return String(c.id)===String(s.class_id)});return Object.assign({},s,{class_status:c?.status||'inactive'})}):model.roster();
  var scopedSchools=filters.class_id&&!filters.school_id?schools.filter(function(s){return String(s.id)===String(allClasses.find(function(c){return String(c.id)===String(filters.class_id)})?.school_id)}):schools;
  var d=model.aggregate(model.reports(),currentRoster,scopedSchools,filters);
  d.demo=true;d.source_note='老师端与管理员端共用的明确演示报告记录；不会把全部心理观察自动算作报告，也不代表正式学校数据。';
  return new Response(JSON.stringify(d),{status:200,headers:{'Content-Type':'application/json; charset=utf-8'}});
 }catch(e){return new Response(JSON.stringify({detail:e.message}),{status:422,headers:{'Content-Type':'application/json'}})}
};
})(window);
