import {ingest,saveDraft} from './ingest.mjs';
const [command,input,...flags]=process.argv.slice(2);
try{if(!input||!['ingest','save'].includes(command)||flags.some(f=>!['--keep-images','--no-images','--replace'].includes(f)))throw Error('用法：node scripts/cli.mjs ingest <链接或文件> [--no-images]\n      node scripts/cli.mjs save <已由 Codex 整理的 draft.json> [--replace]');
if(command==='ingest'){const result=await ingest(input,{keepImages:!flags.includes('--no-images')});console.log('原文与草稿：'+result.folder);console.log('默认抓取原文配图。请让 Codex 结合 source.txt 中的图号和 metadata.json 图注，将图片通过 illustrations 插入对应段落，再完善知识提要和详细讲解；保留原文链接后运行 save。');for(const w of result.warnings)console.warn(w);}else console.log('已保存：'+await saveDraft(input,{replace:flags.includes('--replace')}));
}catch(e){console.error(e.message);process.exitCode=1;}
