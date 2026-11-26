export const AnnotationCore=(()=>{
 const key=id=>'zhixu-annotations-v1:'+id;
 function valid(r){return r?.version===1&&Array.isArray(r.items)&&r.items.every(a=>typeof a.id==='string'&&['points','explanations'].includes(a.mode)&&typeof a.section==='string'&&Number.isInteger(a.block)&&a.block>=0&&Number.isInteger(a.start)&&a.start>=0&&typeof a.quote==='string'&&a.quote.length>0&&typeof a.prefix==='string'&&typeof a.suffix==='string'&&typeof a.note==='string'&&Number.isFinite(Date.parse(a.created))&&Number.isFinite(Date.parse(a.updated)));}
 function anchor(text,start,end){return {start,quote:text.slice(start,end),prefix:text.slice(Math.max(0,start-24),start),suffix:text.slice(end,end+24)};}
 function locate(text,a){
  if(text.slice(a.start,a.start+a.quote.length)===a.quote&&text.slice(Math.max(0,a.start-a.prefix.length),a.start)===a.prefix&&text.slice(a.start+a.quote.length,a.start+a.quote.length+a.suffix.length)===a.suffix)return a.start;
  const candidates=[];let i=text.indexOf(a.quote);while(i!==-1){candidates.push(i);i=text.indexOf(a.quote,i+1);}
  if(candidates.length===1)return candidates[0];
  const exact=candidates.filter(i=>(!a.prefix||text.slice(Math.max(0,i-a.prefix.length),i)===a.prefix)&&(!a.suffix||text.slice(i+a.quote.length,i+a.quote.length+a.suffix.length)===a.suffix));return exact.length===1?exact[0]:-1;
 }
 function createStore(storage,id){let record={version:1,items:[]},warning='',last=null;
  try{last=storage.getItem(key(id));if(last!==null){const parsed=JSON.parse(last);if(!valid(parsed))throw Error();record=parsed;}}catch{warning='标注存储不可用或记录损坏，本页改动仅临时保存；已有存储不会被覆盖。';}
  function save(){if(warning)return;try{if(storage.getItem(key(id))!==last){warning='其他标签页已更新标注，本页改动仅临时保存。请先导出备份再刷新。';return;}const raw=JSON.stringify(record);storage.setItem(key(id),raw);last=raw;}catch{warning='标注仅临时保存在本页：浏览器存储失败，刷新后可能丢失，请及时导出。';}}
  return {get record(){return record;},get warning(){return warning;},add(a){const now=new Date().toISOString();const item={...a,id:globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2),created:now,updated:now};if(!valid({version:1,items:[item]}))throw Error('无效标注');record.items.push(item);save();return item;},edit(id,note){const a=record.items.find(a=>a.id===id);if(a){a.note=note;a.updated=new Date().toISOString();save();}},remove(id){record.items=record.items.filter(a=>a.id!==id);save();}};
 }
 return {key,valid,anchor,locate,createStore};
})();
