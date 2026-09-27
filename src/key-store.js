const PREFIX='minimal-composer-next:key:';
export function createKeyStore(storage){return {get(provider){return storage.getItem(PREFIX+provider)??'';},set(provider,key){if(key) storage.setItem(PREFIX+provider,key); else storage.removeItem(PREFIX+provider);}};}
