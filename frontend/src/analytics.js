export default {
   trigger: function(action, name, value) { 
      if (window._paq ) {
         window._paq.push(['trackEvent', action, name, value])
      } else {
         console.error(`_PAQ is not available, cannot trigger ${action} ${name} ${value}`)
      }
   }
 }