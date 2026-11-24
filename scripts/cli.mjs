import {ingest,saveDraft} from './ingest.mjs';
const [command,input,...flags]=process.argv.slice(2);
try{if(!input||!['ingest','save'].includes(command)||flags.some(f=>!['--keep-images','--replace'].includes(f)))throw Error('用法：node scripts/cli.mjs ingest <链接或文件> [--keep-images]\n      node scripts/cli.mjs save <已由 Codex 整理的 draft.json> [--replace]');
if(command==='ingest'){const result=await ingest(input,{keepImages:flags.includes('--keep-images')});console.log('原文与草稿：'+result.folder);console.log('请让本地 Codex 读取 source.txt 并完善 draft.json，再运行 save；摄入本身不会生成 AI 总结。');for(const w of result.warnings)console.warn(w);}else console.log('已保存：'+await saveDraft(input,{replace:flags.includes('--replace')}));
}catch(e){console.error(e.message);process.exitCode=1;}
