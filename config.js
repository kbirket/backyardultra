// Vercel version: no secrets belong in this file.
window.APP_CONFIG = { API_URL: "/api/race" };

/* Keep legacy render loops out of the live screen. app-v14 owns the actual clock. */
(function(){
  const native=window.setInterval;
  window.setInterval=function(fn,ms,...args){
    try{
      const src=Function.prototype.toString.call(fn);
      // app-v3: full render every second
      if(ms===1000 && src.includes('state.race') && src.includes('render()')) return 0;
      // app-v5: replaces the live cards every second; that creates visible jumping.
      if(ms===1000 && src.includes('updateAll')) return 0;
    }catch(e){}
    return native(fn,ms,...args);
  };
})();
