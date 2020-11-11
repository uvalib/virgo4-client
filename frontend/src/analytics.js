export default {
   trigger: function(action, name, value) {
      if (window._paq ) {
         //console.log(`Trigger trackEvent ${action} ${name} ${value}`)
         window._paq.push(['trackEvent', action, name, value])
         //console.log("trigger done")
      } else {
         //console.error(`_PAQ is not available, cannot trigger ${action} ${name} ${value}`)
      }
   }
 }