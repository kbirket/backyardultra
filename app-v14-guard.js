/* Prevent the legacy full-page render loop from repainting the entire app every second. */
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
