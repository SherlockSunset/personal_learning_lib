import assert from 'node:assert/strict';
import {AnnotationCore as A} from '../web/annotations-core.js';
import {RecordsCore as R} from '../web/records-core.js';
import {LearningCore as L} from '../web/learning-core.js';

function storage(entries=[]){const values=new Map(entries);return {get length(){return values.size;},key:i=>[...values.keys()][i],getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};}
const local=storage(),s=A.createStore(local,'test');
const a=s.add({mode:'explanations',section:'section-test',block:0,...A.anchor('工具调用需要校验参数。',0,4),note:'自己的理解 <script>'});
assert.equal(A.createStore(local,'test').record.items[0].note,'自己的理解 <script>');
s.edit(a.id,'补充备注');assert.equal(A.createStore(local,'test').record.items[0].note,'补充备注');
assert.equal(A.locate('新增：工具调用需要校验参数。',a),3);
assert.equal(A.locate('已经完全改写。',a),-1);
assert.equal(A.locate('调用和调用',{quote:'调用',start:100,prefix:'',suffix:''}),-1);
const repeated=A.anchor('甲调用，乙调用。',5,7);assert.equal(A.locate('前言甲调用，乙调用。',repeated),7);
s.remove(a.id);assert.equal(A.createStore(local,'test').record.items.length,0);
const corrupt=storage([[A.key('bad'),'{broken']]),bad=A.createStore(corrupt,'bad');bad.add({...a,id:undefined});assert.ok(bad.warning);assert.equal(corrupt.getItem(A.key('bad')),'{broken');
const blocked=A.createStore({getItem(){throw Error();}},'blocked');blocked.add(a);assert.equal(blocked.record.items.length,1);assert.ok(blocked.warning);
const quota=A.createStore({getItem:()=>null,setItem(){throw Error();}},'quota');quota.add(a);assert.ok(quota.warning);
const concurrent=storage(),first=A.createStore(concurrent,'same'),second=A.createStore(concurrent,'same');first.add(a);second.add({...a,note:'第二个标签页'});assert.ok(second.warning);assert.equal(A.createStore(concurrent,'same').record.items[0].note,a.note);

const reading=L.createStore(local,'zhixu-reading-v1:test');const start=new Date(2026,10,26,10,30,20);reading.read(start);assert.equal(L.status(reading.record,start),'计划中');assert.equal(reading.review(start),false);const due=new Date(L.due(reading.record));assert.equal(due.getDate(),27);assert.equal(due.getHours(),10);assert.equal(reading.review(due),true);assert.equal(reading.review(due),false);const overdue=new Date(2026,11,15,10,30,20);assert.equal(reading.review(overdue),true);const next=new Date(L.due(reading.record));assert.equal(next.getDate(),19);
local.setItem('zhixu-quiz-v1:removed-note',JSON.stringify({draft:{responses:{q:{text:'未提交答案'}}},attempts:[{responses:{q:{selfGraded:false}}}]}));local.setItem('unrelated-key','excluded');
local.setItem('zhixu-future-format','raw unknown value');const session=storage([['zhixu-session','session draft']]);
const data=R.collect(name=>name==='localStorage'?local:session,[{key:A.key('bad'),record:bad.record,warning:bad.warning}],[],start);
assert.ok(data.storage.localStorage.find(r=>r.key==='zhixu-quiz-v1:removed-note').value.includes('未提交答案'));
assert.ok(data.storage.localStorage.some(r=>r.value==='raw unknown value'));assert.ok(!data.storage.localStorage.some(r=>r.key==='unrelated-key'));
assert.equal(data.memoryRecords[0].record.items.length,1);assert.equal(data.storage.sessionStorage[0].value,'session draft');assert.ok(data.warnings.length);
const failure=R.collect(()=>{throw Error();},[{key:'temporary',record:{text:'临时作答'},warning:'存储失败'}],[]);assert.equal(failure.warnings.length,3);assert.equal(failure.memoryRecords[0].record.text,'临时作答');
assert.deepEqual(JSON.parse(JSON.stringify(data)),data);
console.log('Passed: annotation anchors, ambiguous/orphan quotes, edit/delete persistence, corrupt/blocked/full/conflicting storage, review schedule, all-note export, unknown/raw records, drafts and temporary snapshots.');
