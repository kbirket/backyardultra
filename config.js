// Vercel version: no secrets belong in this file.
window.APP_CONFIG = { API_URL: "/api/race" };

/* The original renderer repainted every card every second, which made the live UI flicker.
   Block only that legacy interval; app-v14 owns the lightweight live clock. */
(function(){
  const native=window.setInterval;
  window.setInterval=function(fn,ms,...args){
    try{
      const src=Function.prototype.toString.call(fn);
      if(ms===1000 && src.includes('state.race') && src.includes('render()')) return 0;
    }catch(e){}
    return native(fn,ms,...args);
  };
  setTimeout(()=>{window.setInterval=native},0);
})();
