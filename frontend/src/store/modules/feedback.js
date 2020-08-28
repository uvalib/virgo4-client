import axios from 'axios'
import { getField, updateField } from 'vuex-map-fields'

const feedback = {
   namespaced: true,
   state: {
      email: "",
      wantedTo: "",
      explanation: "",
      url: "",
      status: "pending",
   },
   getters: {
      getField,
   },

   mutations: {
      updateField,
      clearFeedback(state) {
         state.email = ""
         state.wantedTo = ""
         state.explanation = ""
         state.url = ""
         state.status="pending"
      },
      setSubmitting(state) {
         state.status="submit"
      },
      setSubmitSuccess(state) {
         state.status="success"
      },
      setSubmitFail(state) {
         state.status="fail"
      }
   },
   actions: {
      submitFeedback(ctx) {
         ctx.commit("setSubmitting")
         let v4UserID = ctx.rootState.user.signedInUser
         let data = { userID: v4UserID,
            email: ctx.state.email,
            wantedTo: ctx.state.wantedTo,
            explanation: ctx.state.explanation,
            url: ctx.state.url,
            userAgent: navigator.userAgent
         }
         return axios.post('/api/feedback', data).then((_response) => {
            ctx.commit("setSubmitSuccess")
         }).catch((_error) => {
            ctx.commit("setSubmitFail")
            let msg = 'There was a problem sending your feedback.<br/>Please send an email to <a  href="mailto:lib-virgo4-feedback@virginia.edu" class="feedback">lib-virgo4-feedback@virginia.edu</a>'
            ctx.commit("system/setError", msg, {root: true})
         })
      }
   }
}
export default feedback
