import test from 'node:test';
import assert from 'node:assert/strict';
import {createBackup,restoreBackup,createKeyBackup,restoreKeyBackup,createDiagnostic} from '../src/technical-tools.js';

function storage(seed={}){
 const map=new Map(Object.entries(seed));
 return {get length(){return map.size;},key(i){return [...map.keys()][i]??null;},getItem(k){return map.has(k)?map.get(k):null;},setItem(k,v){map.set(k,String(v));},removeItem(k){map.delete(k);},dump(){return Object.fromEntries(map);}};
}

test('backup excludes API keys and restores app data without touching keys',()=>{
 const src=storage({'minimal-composer-next:experiments':'[1]','minimal-composer-next:preference:model:openai':'gpt','minimal-composer-next:key:openai':'SECRET','other':'x'});
 const backup=createBackup(src);
 assert.equal(backup.data['minimal-composer-next:key:openai'],undefined);
 const dst=storage({'minimal-composer-next:key:openai':'KEEP','minimal-composer-next:experiments':'old'});
 restoreBackup(dst,backup);
 assert.equal(dst.getItem('minimal-composer-next:key:openai'),'KEEP');
 assert.equal(dst.getItem('minimal-composer-next:experiments'),'[1]');
});

test('diagnostic contains current request response and notation metadata',()=>{
 const d=createDiagnostic({appVersion:'0.5.10',provider:'openai',model:'m',task:'Analyse',response:'Antwort',history:[{id:'1'}],notation:{format:'LilyPond',error:null}});
 assert.equal(d.appVersion,'0.5.10');assert.equal(d.task,'Analyse');assert.equal(d.response,'Antwort');assert.equal(d.notation.format,'LilyPond');assert.equal(d.history.length,1);
});

test('key backup contains only API keys and restores them',()=>{
 const src=storage({'minimal-composer-next:key:openai':'OPEN','minimal-composer-next:key:anthropic':'ANTH','minimal-composer-next:experiments':'[1]'});
 const backup=createKeyBackup(src);
 assert.equal(backup.data['minimal-composer-next:key:openai'],'OPEN');
 assert.equal(backup.data['minimal-composer-next:experiments'],undefined);
 const dst=storage({'minimal-composer-next:key:openai':'OLD'});
 restoreKeyBackup(dst,backup);
 assert.equal(dst.getItem('minimal-composer-next:key:openai'),'OPEN');
 assert.equal(dst.getItem('minimal-composer-next:key:anthropic'),'ANTH');
});
