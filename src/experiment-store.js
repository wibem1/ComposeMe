const KEY='minimal-composer-next:experiments';
export function createExperimentStore(storage){
 function list(){try{const v=JSON.parse(storage.getItem(KEY)??'[]');return Array.isArray(v)?v:[];}catch{return [];}}
 function write(items){storage.setItem(KEY,JSON.stringify(items));}
 function save(record,{parentId=null}={}){const item={id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,savedAt:new Date().toISOString(),parentId,...record};write([item,...list()]);return item;}
 function get(id){return list().find(x=>x.id===id)??null;}
 function update(id,patch){const items=list();const current=items.find(x=>x.id===id);if(!current)throw new Error('Experiment nicht gefunden.');const next={...current,...patch,id:current.id,savedAt:current.savedAt};write(items.map(x=>x.id===id?next:x));return next;}
 function variantsOf(id){return list().filter(x=>x.parentId===id);}
 function linkVariant(originalId,variantId){if(!originalId||!variantId||originalId===variantId)throw new Error('Original und Variante müssen verschieden sein.');const items=list();if(!items.some(x=>x.id===originalId)||!items.some(x=>x.id===variantId))throw new Error('Experiment nicht gefunden.');write(items.map(x=>x.id===variantId?{...x,parentId:originalId}:x));return get(variantId);}
 function remove(id){if(!id)return false;const items=list();if(!items.some(x=>x.id===id))return false;write(items.filter(x=>x.id!==id).map(x=>x.parentId===id?{...x,parentId:null}:x));return true;}
 return {list,save,get,update,variantsOf,linkVariant,remove};
}
