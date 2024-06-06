export default {
   install: (app) => {
      app.config.globalProperties.$formatNum = (num) => {
         if (num == 0) {
            return "0"
         }
         if (num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
         }
         return ""
      }
   }
}