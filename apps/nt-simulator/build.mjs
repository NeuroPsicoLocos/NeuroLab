import {readFileSync,writeFileSync} from 'node:fs';
const base=new URL('./',import.meta.url),groups={scene:['ions','state','render','app'],modules:['model','modules','modules-ui'],course:['course-content','course-model','course-render','course-ui'],pharmacology:['course-content','pharmacology','pharmacology-ui'],navigation:['course-content','navigation','navigation-ui']};
for(const [name,parts] of Object.entries(groups)){
 const body=parts.map(p=>readFileSync(new URL(p+'.mjs',base),'utf8').split('\n').filter(line=>!line.startsWith('import ')).join('\n').replaceAll('export const ','const ').replaceAll('export function ','function ')).join('\n');
 const expected='(()=>{\n'+body+'\n})();\n',path=new URL(name+'.bundle.js',base);
 if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==expected)throw new Error('Bundle desactualizado: '+name);}else writeFileSync(path,expected);
}
