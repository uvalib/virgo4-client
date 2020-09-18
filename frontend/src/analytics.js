export default {
   trigger: function(action, name, value, detail) {
      if (window._paq ) {
         console.log(`Trigger trackEvent ${action} ${name} ${value} ${detail}`)
         window._paq.push(['trackEvent', action, name, value, detail])
         console.log("trigger done")
      } else {
         console.error(`_PAQ is not available, cannot trigger ${action} ${name} ${value} ${detail}`)
      }
   }
 }