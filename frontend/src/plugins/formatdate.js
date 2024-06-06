import dayjs from 'dayjs'

export default {
   install: (app) => {
      app.config.globalProperties.$formatDate = (dateStr) => {
         if (dateStr) {
            let d = dayjs(dateStr)
            return d.format("YYYY-MM-DD")
         }
         return ""
      }
   }
}