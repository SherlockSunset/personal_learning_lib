import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const categories=['Python 进阶','Agent 开发','大模型基础','RAG 与检索','工程实践'];
export function validateNote(n){
 if(!n||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(n.id||''))throw Error('id 必须为小写英文、数字和单连字符');
 for(const key of ['title','summary'])if(typeof n[key]!=='string'||!n[key].trim())throw Error(n.id+': 缺少 '+key);
 if(n.title.length>160)throw Error(n.id+': 标题最多 160 字');
 if(!categories.includes(n.category))throw Error(n.id+': 分类不在固定分类中');
 if(!Array.isArray(n.tags)||n.tags.some(t=>typeof t!=='string'))throw Error(n.id+': tags 必须为字符串数组');
 if(!Array.isArray(n.points)||!n.points.length||n.points.some(p=>typeof p.title!=='string'||!p.title.trim()||typeof p.body!=='string'||!p.body.trim()))throw Error(n.id+': 每个知识点必须有标题和正文');
 for(const key of ['created','updated'])if(typeof n[key]!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(n[key])||!Number.isFinite(Date.parse(n[key])))throw Error(n.id+': '+key+' 必须为 ISO 时间');
 if(n.source&&!/^https?:\/\//i.test(n.source))throw Error(n.id+': source 只允许 http(s) 来源链接');
 if(!Array.isArray(n.images)||n.images.some(s=>typeof s!=='string'||!/^assets\/[a-zA-Z0-9_./-]+$/.test(s)||s.split('/').includes('..')))throw Error(n.id+': 图片必须为 assets/ 下的本地资源');
 return n;
}
export async function loadNotes(base=root){const dir=path.join(base,'content/notes');const files=(await fs.readdir(dir)).filter(f=>f.endsWith('.json')).sort();const ids=new Set();const notes=[];for(const f of files){const n=validateNote(JSON.parse(await fs.readFile(path.join(dir,f),'utf8')));if(f!==n.id+'.json')throw Error('文件名必须与 id 相同：'+f);if(ids.has(n.id))throw Error('重复 id：'+n.id);ids.add(n.id);for(const im of n.images)await fs.access(path.join(base,'content',im));notes.push(n);}return notes.sort((a,b)=>b.updated.localeCompare(a.updated));}
