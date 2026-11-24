import fs from 'node:fs/promises';
import path from 'node:path';
import {root} from './content.mjs';
import {QuizCore} from '../web/quiz-core.js';
export async function loadQuizzes(notes,base=root){const directory=path.join(base,'content/quizzes');let files=[];try{files=await fs.readdir(directory);}catch(e){if(e.code!=='ENOENT')throw e;}
 const quizzes=[];for(const file of files.filter(f=>f.endsWith('.json')).sort()){const quiz=JSON.parse(await fs.readFile(path.join(directory,file),'utf8'));const note=notes.find(n=>n.id===quiz.noteId);if(!note)throw Error(file+': 题库对应文章不存在');if(file!==quiz.noteId+'.json'||quizzes.some(q=>q.noteId===quiz.noteId))throw Error(file+': 题库文件名无效或重复');const report=QuizCore.validate(quiz,note);console.log('Quiz '+note.id+': '+report.questions+' questions; knowledge coverage '+report.covered+'/'+report.total);quizzes.push(quiz);}
 for(const n of notes)if(n.assessmentRequired&&!quizzes.some(q=>q.noteId===n.id))throw Error(n.id+': 此文章要求配套题库，但 content/quizzes/ 中缺失');return quizzes;
}
