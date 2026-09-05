// Vercel version: no secrets belong in this file.
window.APP_CONFIG = { API_URL: "/api/race" };

/* Keep the legacy 1-second full-page repaint disabled permanently.
   The original app-v3 timer calls render(), which rebuilds the whole screen every second.
   app-v14 owns the lightweight live clock and does not match this guard. */
(function(){
  const native=window.setInterval;
  window.setInterval=function(fn,ms,...args){
    try{
      const src=Function.prototype.toString.call(fn);
      if(ms===1000 && src.includes('state.race') && src.includes('render()')) return 0;
    }catch(e){}
    return native(fn,ms,...args);
  };
})();
