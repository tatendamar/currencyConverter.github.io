importScripts('./js/idb.js');
importScripts('./js/utils.js');


const CACHE_VERSION = 'static-v10';
const CACHE_DYNAMIC_VERSION = 'dynamic-v5'

//install service worker
self.addEventListener('install', function(event){
 
  event.waitUntil(
    caches.open(CACHE_VERSION)
    .then(function(cache){
      
      cache.addAll([
        './',
        './index.html',
        './js/idb.js',
        './js/app.js',
        './style.css',
        'https://stackpath.bootstrapcdn.com/bootstrap/4.1.1/css/bootstrap.min.css',
        'https://stackpath.bootstrapcdn.com/bootstrap/4.1.1/js/bootstrap.min.js',
      ])
    })
  );
});

//trimcache  method to reduce the number of dynamic cached items

function cacheTrim(cacheName, numItems){
  caches.open(cacheName)
  .then(function(cache){
    return cache.keys()
    .then(function(keys){
      if(keys.length > numItems){
        cache.delete(keys[0])
        .then(cacheTrim(cacheName, numItems));
      }
    });
  })
};

//activating  service worker
self.addEventListener('activate', function(event){
 
  event.waitUntil(
    caches.keys()
    .then(function(keyList){
      return Promise.all(keyList.map(function(key){
        if(key !== CACHE_VERSION && key !==CACHE_DYNAMIC_VERSION){
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

//fetching 
self.addEventListener('fetch', function(event){
  event.respondWith(
    caches.match(event.request)
    .then(function(response){
      if(response){
        return response;
      } else {
        //retrieve data saved in indexeddb
        readAllData('currency')
        .then(function(data){
            data.forEach(function(key){
              if(key){
                return key;
              }
            });
          });
        };
        //cache items dynamically
        return fetch(event.request)
        .then(function(res){
          return caches.open(CACHE_DYNAMIC_VERSION)
          .then(function(cache){
            cacheTrim(CACHE_DYNAMIC_VERSION, 15)
            cache.put(event.request, res.clone());
            return res;
            })
           });
          })
        );
        //respond with network fetch  and save to the indexeddb
       event.respondWith(
         fetch(event.request)
        .then(function(res){
           const cloneResponse = res.clone()
            cloneResponse.json()
            .then(function(data){
              for(key in data){
                 writeData('currency', data[key]);
              }
            });
            return res;
          })
        .catch(function(err){
          console.log(err);
        })
  );
});
