import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {root,loadNotes} from './content.mjs';
import {loadQuizzes} from './quizzes.mjs';
import {QuizCore as Q} from '../web/quiz-core.js';
const notes=await loadNotes(),quizzes=await loadQuizzes(notes);assert.ok(quizzes.length);
const quiz=quizzes.find(q=>q.noteId==='note-0f561bcbef');assert.ok(quiz);const note=notes.find(n=>n.id===quiz.noteId),clone=x=>JSON.parse(JSON.stringify(x));
assert.equal(Q.validate(quiz,note).covered,13);
assert.throws(()=>Q.validate({...quiz,questions:quiz.questions.filter(q=>!q.knowledgeIds.includes('code-mode'))},note),/未覆盖/);
const bad=clone(quiz);bad.questions[0].reviewSectionIds=['missing-section'];assert.throws(()=>Q.validate(bad,note),/回读章节/);
const repeated=clone(quiz);repeated.questions.push(clone(repeated.questions[0]));assert.throws(()=>Q.validate(repeated,note),/重复/);
const draft=Q.makeDraft(quiz);assert.throws(()=>Q.submit(quiz,draft),/完成全部/);
for(const q of quiz.questions){draft.responses[q.id]=q.type==='short_answer'?{text:'这是用于验证评分的作答。'}:{value:q.answer};}
draft.responses['delta-context'].uncertain=true;
const attempt=Q.submit(quiz,draft);let score=Q.summarize(attempt);assert.equal(score.pending,3);assert.equal(score.score,null);assert.equal(score.objectiveCorrect,13);
for(const q of attempt.questions.filter(q=>q.type==='short_answer')){attempt.responses[q.id].rubricIds=q.rubric.map(r=>r.id);attempt.responses[q.id].selfGraded=true;}
attempt.responses['evaluation-design-explain'].rubricIds.pop();score=Q.summarize(attempt);assert.equal(score.pending,0);assert.equal(score.score,98);
const record={schemaVersion:1,draft:null,attempts:[attempt]};assert.deepEqual(new Set(Q.weakIds(record,quiz)),new Set(['delta-context','evaluation-design-explain']));
let rows=Q.coverage(note,quiz,record);assert.equal(rows.find(r=>r.id==='incremental-state').status,'需巩固');assert.equal(rows.find(r=>r.id==='evaluation-design').status,'需巩固');
const retry=Q.makeDraft(quiz,Q.weakIds(record,quiz),'weak');for(const id of retry.questionIds){const q=quiz.questions.find(q=>q.id===id);retry.responses[id]=q.type==='short_answer'?{text:'新的完整回答',rubricIds:q.rubric.map(r=>r.id),selfGraded:true}:{value:q.answer};}
const retried=Q.submit(quiz,retry);retried.submittedAt=new Date(Date.parse(attempt.submittedAt)+1000).toISOString();record.attempts.unshift(retried);assert.equal(Q.weakIds(record,quiz).length,0);assert.ok(Q.coverage(note,quiz,record).every(r=>r.status==='本次掌握'));
const incomplete={schemaVersion:1,attempts:[{...retried,questions:[quiz.questions.find(q=>q.id==='harness-executes')],responses:{'harness-executes':{value:true}}}]};assert.equal(Q.coverage(note,quiz,incomplete).find(r=>r.id==='harness').status,'证据不足');
const next=clone(quiz);next.version++;assert.equal(Q.currentAttempts(record,next).length,0);assert.ok(Q.coverage(note,next,record).every(r=>r.status==='未作答'));assert.throws(()=>Q.submit(next,draft),/题库已变化/);assert.equal(Q.summarize(attempt).score,98);
const edited=clone(quiz);edited.questions[0].prompt+='（更新）';assert.notEqual(Q.fingerprint(quiz),Q.fingerprint(edited));
const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};let store=Q.createStore(storage,'test');store.save({...record,draft});store=Q.createStore(storage,'test');assert.equal(store.record.draft.responses['delta-context'].value,false);assert.equal(store.record.attempts.length,2);
store.save({...record,attempts:Array.from({length:35},(_,i)=>({...attempt,id:'a-'+i}))});assert.equal(Q.createStore(storage,'test').record.attempts.length,30);
memory.set('bad','{broken');const corrupted=Q.createStore(storage,'bad');assert.ok(corrupted.warning);assert.equal(corrupted.save(record),false);assert.equal(memory.get('bad'),'{broken');
const quota=Q.createStore({getItem:()=>null,setItem(){throw Error('quota');}},'quota');assert.equal(quota.save({...record,draft}),false);assert.ok(quota.warning);assert.ok(quota.record.draft);
const html=await fs.readFile(path.join(root,'dist/index.html'),'utf8');const script=html.match(/<script>([\s\S]*)<\/script>/)[1];const end=script.indexOf(';\n',script.indexOf('const LIBRARY_QUIZZES='))+2;const embedded=vm.runInNewContext(script.slice(0,end)+';LIBRARY_QUIZZES');assert.equal(embedded.find(q=>q.noteId===quiz.noteId).questions.length,16);
console.log('Passed: quiz coverage/anchors, unanswered guard, objective grading, pending and weighted self-grading, uncertainty, weak retries, partial evidence, bank versioning, history snapshots, draft reload, retention and storage failures.');
