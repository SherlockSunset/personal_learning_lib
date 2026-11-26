import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {LearningCore as L} from '../web/learning-core.js';

const now=new Date(2026,11,31,12,0,0);
function entry(id,day,hour=10){const read=new Date(now);read.setDate(read.getDate()+day-1);read.setHours(hour);return {note:{id,title:id},record:{version:1,reads:[read.toISOString()],reviews:[]}};}
const entries=[entry('overdue',-3),entry('today-due',0),entry('today-later',0,18),entry('tomorrow',1),entry('last-day',13),entry('later',14),{note:{id:'complete'},record:{reads:[now.toISOString()],reviews:Array(6).fill(now.toISOString())}},{note:{id:'unread'},record:{reads:[],reviews:[]}}];
const plan=L.plan(entries,now);
assert.equal(plan.days.length,14);assert.equal(plan.days[0].id,'2026-12-31');assert.equal(plan.days[1].id,'2027-01-01');assert.equal(plan.days.at(-1).id,'2027-01-13');
assert.equal(plan.groups.all.length,7);assert.deepEqual(plan.groups.due.map(e=>e.note.id),['overdue','today-due']);assert.equal(plan.groups.overdue.length,1);assert.equal(plan.days[0].items.length,2);assert.equal(plan.days[13].items[0].note.id,'last-day');assert.equal(plan.groups.later[0].note.id,'later');assert.equal(plan.groups.complete.length,1);
const partitions=[...plan.days.flatMap(d=>d.items),...plan.groups.overdue,...plan.groups.later,...plan.groups.complete];assert.equal(new Set(partitions.map(e=>e.note.id)).size,7);assert.equal(partitions.length,7);
const midnight=L.plan(entries,new Date(2027,0,1,0,0,0));assert.equal(midnight.groups.overdue.length,3);assert.equal(midnight.days[0].items[0].note.id,'tomorrow');
const context=vm.createContext({});vm.runInContext(await fs.readFile(new URL('../web/review-charts.js',import.meta.url),'utf8'),context);context.plan=plan;const html=vm.runInContext('ReviewCharts.html(plan,"2027-01-01")',context);assert.equal((html.match(/class="review-day /g)||[]).length,14);assert.match(html,/data-review-filter="2027-01-01" aria-pressed="true"/);assert.match(html,/此前未完成/);assert.match(html,/较远计划/);assert.equal((vm.runInContext('ReviewCharts.progress(3)',context).match(/class="done"/g)||[]).length,3);
context.empty=L.plan([],now);const empty=vm.runInContext('ReviewCharts.html(empty,"all")',context);assert.doesNotMatch(empty,/NaN|Infinity/);assert.match(empty,/height:0%/);
console.log('Passed: review chart calendar boundaries, precise due times, overdue/14-day/later/completed partitions, midnight rollover, empty charts, accessible filters and six-stage progress.');
