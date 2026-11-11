// Cache only public application files. Supabase requests and user data are never cached.
const CACHE='cleanquote-pwa-cloud-v9';
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('cleanquote-pwa-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==location.origin)return;
 // Authenticated use requires the network. Do not serve previous offline app versions.
 e.respondWith(fetch(e.request,{cache:'no-store'}));
});
