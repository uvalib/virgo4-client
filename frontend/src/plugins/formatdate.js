import { useDateFormat } from '@vueuse/core'

export default {
   install: (app) => {
      app.config.globalProperties.$formatDate = (date) => {
         if (date) {
            return useDateFormat(date,"YYYY-MM-DD").value
         }
         return ""
      }
   }
}