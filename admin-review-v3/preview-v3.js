/* Architecture review only: browser-local simulation, never production auth/monitoring. */
(() => {
'use strict';
window.YTAdminV3Preview = true;
const legacyFetch = window.fetch.bind(window);
const KEY = 'yunting-admin-architecture-review-v3-data';
const TABLES = ['schools','teachers','classes','students','lessons','growth','resources','courses'];
const TYPES = ['login','classroom','ai','media','save','other'];
let store, loading;
const stamp = () => new Date().toISOString();
const clone = x => JSON.parse(JSON.stringify(x));
const response = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8'}});
function bad(message,status=422) { const e = new Error(message); e.status=status; throw e; }
function persist() { localStorage.setItem(KEY,JSON.stringify(store)); }
async function old(path,options={}) { const r=await legacyFetch('/api'+path,options); const d=await r.json();if(!r.ok)bad(d.detail||'读取演示数据失败',r.status);return d; }
async function ready() {
 if (loading) return loading;
 loading=(async()=>{
  try { store=JSON.parse(localStorage.getItem(KEY)||'null'); } catch {}
  if (store?.schema===3) return;
  store={schema:3,issues:[],audit:[],course_versions:{},resource_versions:{}};
  for (const t of TABLES) store[t]=(await old('/'+t)).items||[];
  store.settings=await old('/settings');
  store.audit=(await old('/audit')).items||[];
  persist();
 })();
 return loading;
}
const find=(table,id)=>{const row=store[table]?.find(x=>String(x.id)===String(id));if(!row)bad('记录不存在',404);return row;};
const nextId=table=>Math.max(0,...store[table].map(x=>Number(x.id)||0))+1;
const same=(a,b)=>String(a)===String(b);
function safeSummary(row) {
 if(!row)return null;
 return Object.fromEntries(['id','school_id','class_id','teacher_id','status','class_ids','features','expires_at','school_ids','current_version'].filter(k=>k in row).map(k=>[k,clone(row[k])]));
}
function log(action,entity,id,before,after) {
 store.audit.unshift({id:nextId('audit'),actor_username:'管理员体验账号（浏览器演示）',action,entity,entity_id:id,school_id:after?.school_id||before?.school_id||(entity==='schools'?id:null),before:safeSummary(before),after:safeSummary(after),created_at:stamp()});
}
function dateOnly() { return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
function expiry(s) {
 if(s.status!=='active')return 'inactive';
 if(!s.expires_at)return 'active';
 const today=dateOnly(),d=String(s.expires_at).slice(0,10);
 if(d<today)return 'expired';
 return (Date.parse(d)-Date.parse(today))/(24*60*60*1000)<=30?'expiring':'active';
}
function schoolLessons(id) {return store.lessons.filter(x=>same(x.school_id,id)).sort((a,b)=>String(b.started_at||'').localeCompare(String(a.started_at||'')));}
function canUse(schoolIds,id) {return !schoolIds?.length||schoolIds.some(x=>same(x,id));}
function publishedCourse(c) {return (store.course_versions[c.id]||[]).find(x=>x.version===c.current_version)?.snapshot||null;}
function accessible(id) {
 return {resources:store.resources.filter(x=>x.status==='published'&&canUse(x.school_ids,id)),courses:store.courses.filter(x=>{const p=publishedCourse(x);return p&&x.status!=='offline'&&canUse(p.school_ids,id);}).map(x=>({...x,published_school_ids:publishedCourse(x).school_ids||[],availability:'published_version',draft_has_changes:x.status==='draft'}))};
}
function summary(s) {
 const teachers=store.teachers.filter(x=>same(x.school_id,s.id));
 const classes=store.classes.filter(x=>same(x.school_id,s.id));
 const content=accessible(s.id),lessons=schoolLessons(s.id);
 return {...s,teacher_count:teachers.length,class_count:classes.length,student_count:store.students.filter(x=>same(x.school_id,s.id)).length,last_lesson_at:lessons[0]?.started_at||null,expiry_state:expiry(s),readiness:[{key:'school',label:'学校已启用且未到期',ready:!['inactive','expired'].includes(expiry(s))},{key:'teacher',label:'已有启用教师账号',ready:teachers.some(x=>x.status==='active')},{key:'class',label:'教师已建立班级',ready:classes.some(x=>x.status==='active')},{key:'content',label:'已配置可用官方课程',ready:content.courses.length>0}]};
}
function handover(sourceId,body) {
 const source=find('teachers',sourceId),target=find('teachers',body.target_teacher_id);
 if(same(source.id,target.id))bad('接收教师不能与原教师相同。');
 if(!same(source.school_id,target.school_id)||target.status!=='active')bad('只能交接给同校启用的教师。');
 if(!Array.isArray(body.class_ids)||!body.class_ids.length)bad('请至少选择一个班级。');
 if(new Set(body.class_ids.map(String)).size!==body.class_ids.length)bad('班级不能重复选择。');
 const classes=body.class_ids.map(id=>find('classes',id));
 if(classes.some(c=>!same(c.teacher_id,source.id)||!same(c.school_id,source.school_id)||c.status==='archived'))bad('班级归属已变化或已归档，请刷新后重新预览。');
 const ids=classes.map(x=>String(x.id));
 return {source:clone(source),target:clone(target),classes:clone(classes),student_count:store.students.filter(x=>ids.includes(String(x.class_id))).length,lesson_count:store.lessons.filter(x=>ids.includes(String(x.class_id))).length};
}
function list(table,params) {
 let items=store[table].slice();
 for(const [k,v]of params){
  if(!v)continue;
  if(k==='search')items=items.filter(r=>[r.name,r.title,r.username,r.student_no,r.description].some(t=>String(t||'').toLowerCase().includes(v.toLowerCase())));
  else if(k==='school_id')items=items.filter(r=>table==='schools'?same(r.id,v):['resources','courses'].includes(table)?canUse(r.school_ids,v):same(r.school_id,v));
  else if(['status','kind','teacher_id','class_id','student_id','attention_level'].includes(k))items=items.filter(r=>same(r[k],v));
  else if(k==='date_from')items=items.filter(r=>String(r.started_at||r.generated_at||'').slice(0,10)>=v);
  else if(k==='date_to')items=items.filter(r=>String(r.started_at||r.generated_at||'').slice(0,10)<=v);
 }
 return items;
}
function syncOwners(c) {
 store.students.filter(s=>same(s.class_id,c.id)).forEach(s=>{s.teacher_id=c.teacher_id;s.updated_at=stamp();});
 for(const t of store.teachers)t.class_ids=store.classes.filter(x=>same(x.teacher_id,t.id)&&x.status!=='archived').map(x=>x.id);
}
function validate(table,r,original) {
 if(!String(r.name||r.title||'').trim())bad('名称不能为空。');
 if(table==='schools') {
  if(!['active','inactive'].includes(r.status))bad('学校状态无效。');
  if(r.expires_at&&!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(r.expires_at))bad('到期日期格式无效。');
  if(!Array.isArray(r.features||[]))bad('功能授权格式无效。');
 }
 if(['teachers','classes','students'].includes(table)) {
  find('schools',r.school_id);
  if(!['active','inactive',...(table==='classes'?['archived']:[])].includes(r.status))bad('状态无效。');
 }
 if(table==='teachers') {
  if(!r.username?.trim())bad('教师账号不能为空。');
  if(store.teachers.some(t=>!same(t.id,r.id)&&t.username===r.username))bad('教师账号已存在。');
  if((r.class_ids||[]).some(id=>!same(find('classes',id).school_id,r.school_id)))bad('不能选择其他学校的班级。');
  if(original&&!same(original.school_id,r.school_id)&&store.classes.some(c=>same(c.teacher_id,r.id)))bad('有负责班级时不能直接换校，请先交接。');
 }
 if(table==='classes') {
  if(original?.status==='archived'&&r.status!==original.status)bad('请通过恢复操作重新启用班级。');
  if(r.teacher_id&&!same(find('teachers',r.teacher_id).school_id,r.school_id))bad('负责教师必须属于本校。');
 }
 if(table==='students') {
  const c=find('classes',r.class_id);
  if(!same(c.school_id,r.school_id))bad('学生与班级必须属于同一学校。');
  if(c.status==='archived')bad('归档班级不能新增或转入学生。');
  if(store.students.some(s=>!same(s.id,r.id)&&same(s.school_id,r.school_id)&&s.student_no===r.student_no))bad('本校学号已存在。');
  r.teacher_id=c.teacher_id;
 }
 if(table==='resources') {
  if(!['course','audio','training'].includes(r.kind)||!['draft','published','offline'].includes(r.status))bad('资源类型或发布状态无效。');
  if(r.url&&!/^https?:\/\//.test(r.url))bad('资源链接仅支持 http 或 https。');
  (r.school_ids||[]).forEach(id=>find('schools',id));
 }
}
function courseSnapshot(c) {
 for(const k of ['title','grade','theme','interaction_guidance'])if(!String(c[k]||'').trim())bad('请补全课程标题、年级、主题和互动引导后发布。');
 const story=find('resources',c.story_id),audio=find('resources',c.audio_id);
 if(story.kind!=='course'||story.status!=='published'||!story.content?.trim()||!story.explanation?.trim())bad('故事与解释须完整且已发布。');
 if(audio.kind!=='audio'||audio.status!=='published'||!/^https?:\/\//.test(audio.url||''))bad('请选择已发布且有有效链接的心理能量音频。');
 if(!Array.isArray(c.training_ids)||!c.training_ids.length)bad('请至少选择一项成长训练。');
 const trainings=c.training_ids.map(id=>find('resources',id));
 if(trainings.some(x=>x.kind!=='training'||x.status!=='published'))bad('成长训练必须已发布。');
 const targets=c.school_ids||[];targets.forEach(id=>find('schools',id));
 for(const r of [story,audio,...trainings])if(r.school_ids?.length&&(!targets.length||targets.some(id=>!canUse(r.school_ids,id))))bad('课程分配范围不能超过所用资源的授权范围。');
 return {...clone(c),resources:{story:clone(story),audio:clone(audio),trainings:clone(trainings)}};
}
window.fetch=async(input,options={})=>{
 const url=new URL(typeof input==='string'?input:input.url,location.href);
 if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return legacyFetch(input,options);
 const method=(options.method||'GET').toUpperCase(),route=url.pathname.slice(5);
 if(['session','login','logout','change-password','uploads'].includes(route)||route.startsWith('prompts'))return legacyFetch(input,options);
 try {
  const session=await legacyFetch('/api/session');if(!session.ok)return session;
  await ready();
  let body={};if(typeof options.body==='string'){try{body=JSON.parse(options.body)}catch{bad('数据格式错误');}}
  const parts=route.split('/'),[table,id,action]=parts;
  if(route==='operations')return response({counts:Object.fromEntries(TABLES.map(t=>[t,store[t].length])),schools:store.schools.map(summary),issues:{...Object.fromEntries(['pending','processing','resolved'].map(s=>[s,store.issues.filter(x=>x.status===s).length])),integration_status:'not_connected'},recent_audit:store.audit.slice(0,8),integration_status:'not_connected'});
  if(table==='schools'&&action==='workspace') {
   const school=find('schools',id),teachers=store.teachers.filter(x=>same(x.school_id,id)),classes=store.classes.filter(x=>same(x.school_id,id)),students_count=store.students.filter(x=>same(x.school_id,id)).length;
   return response({school:summary(school),teachers,classes,students_count,counts:{teachers:teachers.length,classes:classes.length,students:students_count,lessons:schoolLessons(id).length},content:accessible(id),lessons:schoolLessons(id),issues:store.issues.filter(x=>same(x.school_id,id)),audit:store.audit.filter(x=>same(x.school_id,id)),expiry_state:expiry(school),integration_status:'not_connected'});
  }
  if(table==='teachers'&&['handover-preview','handover'].includes(action)) {
   if(method!=='POST')bad('不支持此方法',405);
   const result=handover(id,body);
   if(action==='handover-preview')return response(result);
   if(body.confirm!==true)bad('请确认交接影响后提交。');
   for(const x of result.classes){const c=find('classes',x.id),before=clone(c);c.teacher_id=result.target.id;c.updated_at=stamp();syncOwners(c);log('handover','classes',c.id,before,c);}
   persist();return response({...result,completed:true});
  }
  if(table==='classes'&&['archive','restore'].includes(action)) {
   if(method!=='POST')bad('不支持此方法',405);
   if(body.confirm!==true)bad('请确认班级状态变更。');
   const c=find('classes',id),before=clone(c);
   if(action==='archive') {
    if(!String(body.reason||'').trim())bad('请填写归档原因。');
    if(c.status==='archived')bad('班级已经归档。');
    if(store.lessons.some(l=>same(l.class_id,id)&&['live','running'].includes(l.status)))bad('班级有进行中的课堂，结束后再归档。');
    c.previous_status=c.status;c.status='archived';c.archive_reason=String(body.reason).slice(0,500);c.archived_at=stamp();
   }else{if(c.status!=='archived')bad('只有归档班级可以恢复。');c.status=c.previous_status||'active';c.restored_at=stamp();}
   c.updated_at=stamp();syncOwners(c);log(action,'classes',c.id,before,c);persist();return response(c);
  }
  if(route==='report-overview')return response({personal_access:'restricted',items:store.schools.map(s=>{const reports=store.growth.filter(x=>same(x.school_id,s.id)&&x.report_status==='generated');return {school_id:s.id,school_name:s.name,report_count:reports.length,last_generated_at:reports.map(x=>x.generated_at).filter(Boolean).sort().at(-1)||null};})});
  if(table==='reports'||table==='growth')bad('平台管理员默认仅可查看学校级成长报告概况；个人报告请由获授权校内老师查看。',403);
  if(table==='issues') {
   if(method==='GET')return response(id?find('issues',id):{items:list('issues',url.searchParams).sort((a,b)=>b.id-a.id),integration_status:'not_connected'});
   if(method==='POST'&&!id) {
    find('schools',body.school_id);if(!TYPES.includes(body.type))bad('请选择问题类型。');
    const description=String(body.description||'').trim();if(!description||description.length>2000)bad('请填写 1–2000 字的问题描述，不要包含学生敏感信息。');
    const r={id:nextId('issues'),school_id:Number(body.school_id),type:body.type,description,status:'pending',note:'',source:'manual',created_at:stamp(),updated_at:stamp(),history:[]};store.issues.push(r);log('create','issues',r.id,null,r);persist();return response(r);
   }
   if(method==='PATCH'&&id) {
    const r=find('issues',id),before=clone(r);
    if(!['pending','processing','resolved'].includes(body.status))bad('问题状态无效。');
    const note=String(body.note||'').trim();if(!note||note.length>2000)bad('请填写 1–2000 字的处理说明。');
    r.status=body.status;r.note=note;r.updated_at=stamp();r.history.push({status:r.status,note,created_at:r.updated_at,actor:'管理员体验账号'});log('update','issues',r.id,before,r);persist();return response(r);
   }
   bad('不支持此操作',405);
  }
  if(table==='resources'&&action==='usage') {
   const resource=find('resources',id);
   return response({resource,courses:store.courses.filter(c=>[c.story_id,c.audio_id,...(c.training_ids||[])].some(x=>same(x,id))||(()=>{const p=publishedCourse(c);return p&&[p.story_id,p.audio_id,...(p.training_ids||[])].some(x=>same(x,id));})()).map(c=>({id:c.id,title:c.title,status:c.status,current_version:c.current_version,school_ids:c.school_ids||[]})),policy:'编辑或下线仅影响后续新引用；已发布课程快照与历史记录保留。老师个人课程和原课堂端尚未接入，不能宣称其已同步。'});
  }
  if(route==='audit')return response({items:store.audit});
  if(route==='runtime')return response({database:'浏览器演示存储，未连接正式数据库',counts:Object.fromEntries(TABLES.map(t=>[t,store[t].length])),ai:{status:'not_configured'},integration_status:'not_connected',monitoring:'not_connected',backup:'not_connected'});
  if(route==='settings') {
   if(method==='PATCH') {
    if('data_retention_days'in body&&body.data_retention_days!==store.settings.data_retention_days)bad('自动保留策略尚未接入，此项只读。');
    if(!String(body.platform_name||'').trim()||!Number.isInteger(body.session_hours)||body.session_hours<1||body.session_hours>168)bad('请填写平台名称和 1–168 小时的会话期限。');
    store.settings={...store.settings,platform_name:body.platform_name,session_hours:body.session_hours};log('update','settings',1);persist();
   }
   return response({...store.settings,retention_enforced:false,integration_status:'not_connected'});
  }
  if(table==='courses') {
   if(method==='GET') {
    if(!id)return response({items:list(table,url.searchParams)});
    const c=find(table,id);
    if(action==='versions')return response({items:clone(store.course_versions[c.id]||[]).reverse()});
    if(action==='preview') {
     const snapshot=publishedCourse(c),usePublished=url.searchParams.get('version')==='published';
     const r=usePublished?snapshot:c;if(!r)bad('尚无发布版本。');
     const refs=usePublished?r.resources:{story:store.resources.find(x=>same(x.id,r.story_id)),audio:store.resources.find(x=>same(x.id,r.audio_id)),trainings:store.resources.filter(x=>(r.training_ids||[]).some(id=>same(x.id,id)))};
     return response({...r,preview_mode:usePublished?'published_snapshot':'draft',stages:[{key:'enter',name:'课前准备',preparation_text:r.preparation_text},{key:'story',name:'故事引导',resource:refs.story},{key:'talk',name:'互动陪伴',interaction_guidance:r.interaction_guidance},{key:'energy',name:'心理能量成长训练',audio:refs.audio},{key:'playground',name:'成长训练',trainings:refs.trainings},{key:'closing',name:'心语留言',closing_prompt:r.closing_prompt}]});
    }
    return response(c);
   }
   if(method==='POST'&&['publish','rollback'].includes(action)) {
    const c=find(table,id),before=clone(c);let snap;
    if(action==='publish')snap=courseSnapshot(c);
    else {const prior=(store.course_versions[c.id]||[]).find(v=>v.version===Number(body.version));if(!prior)bad('历史版本不存在',404);snap=clone(prior.snapshot);Object.assign(c,clone(snap));delete c.resources;}
    const versions=store.course_versions[c.id]||=[],version=versions.length+1;
    const v={version,snapshot:snap,created_at:stamp(),published_at:stamp()};versions.push(v);store.course_versions[c.id]=versions;c.current_version=version;c.status='published';c.updated_at=stamp();log(action,table,c.id,before,c);persist();return response(c);
   }
   if(method==='POST'&&!id) {
    const r={...body,id:nextId(table),status:'draft',current_version:null,created_at:stamp(),updated_at:stamp()};store.courses.push(r);log('create',table,r.id,null,r);persist();return response(r);
   }
   if(method==='PATCH'&&id) {
    const c=find(table,id),before=clone(c);Object.assign(c,body,{id:c.id,current_version:c.current_version,status:'draft',updated_at:stamp()});log('update',table,c.id,before,c);persist();return response(c);
   }
  }
  if(TABLES.includes(table)&&!action) {
   if(method==='GET')return response(id?find(table,id):{items:list(table,url.searchParams)});
   if(['lessons','growth'].includes(table))bad('教学历史记录只读',403);
   if(['classes','students'].includes(table)&&method==='POST')bad('班级和学生由教师日常创建与维护。',403);
   if(!['POST','PATCH'].includes(method))bad('不支持此操作',405);
   const original=id?find(table,id):null,before=original?clone(original):null;
   const r={status:table==='resources'?'draft':'active',...(original||{}),...body,id:original?.id||nextId(table),updated_at:stamp()};
   if(body.password&&body.password.length<10)bad('密码至少 10 位。');
   delete r.password;delete r.password_hash;delete r.token;
   if(!original)r.created_at=stamp();validate(table,r,original);
   if(original)Object.assign(original,r);else store[table].push(r);
   if(table==='classes')syncOwners(r);
   if(table==='teachers'){
    for(const c of store.classes)if((r.class_ids||[]).some(id=>same(id,c.id)))c.teacher_id=r.id;else if(same(c.teacher_id,r.id))c.teacher_id=null;
    for(const c of store.classes.filter(c=>same(c.school_id,r.school_id)))syncOwners(c);
   }
   if(table==='resources'&&r.status==='published') {
    const versions=store.resource_versions[r.id]||=[];versions.push({version:versions.length+1,snapshot:clone(r),created_at:stamp()});store.resource_versions[r.id]=versions;
   }
   log(body.password?'reset_password':original?'update':'create',table,r.id,before,r);persist();return response(r);
  }
  if(table==='resources'&&action==='versions')return response({items:clone(store.resource_versions[id]||[]).reverse()});
  return legacyFetch(input,options);
 } catch(e) {return response({detail:e.message||'预览操作失败'},e.status||422);}
};
})();
