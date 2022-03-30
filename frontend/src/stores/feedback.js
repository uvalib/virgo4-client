import axios from 'axios'
import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"

export const useFeedbackStore = defineStore('feedback', {
	state: () => ({
      email: "",
      wantedTo: "",
      explanation: "",
      url: "",
      status: "pending",
   }),

   actions: {
      clear() {
         this.$reset()
      },
      async submitFeedback() {
         const user = useUserStore()
         const system = useSystemStore()

         this.status="submit"
         let v4UserID = user.signedInUser
         let name = user.accountInfo.displayName
         let data = { userID: v4UserID,
            email: this.email,
            name: name,
            wantedTo: this.wantedTo,
            explanation: this.explanation,
            url: this.url,
            userAgent: navigator.userAgent
         }
         return axios.post('/api/feedback', data).then((_response) => {
            this.status="success"
         }).catch((_error) => {
            this.status="fail"
            let msg = 'There was a problem sending your feedback.<br/>Please send an email to <a  href="mailto:lib-virgo4-feedback@virginia.edu" class="feedback">lib-virgo4-feedback@virginia.edu</a>'
            system.setError(msg)
         })
      }
   }
})
