import axios from 'axios'
import { getField, updateField } from 'vuex-map-fields'

const feedback = {
  namespaced: true,
  state: {
    userID: "",
    email: "",
    wantedTo: "",
    explanation: "",
    status: {
      submitting: false,
      sent: false,
      message: ''
    }
  },
  getters: {
    getField,
  },

  mutations: {
    updateField,
    clearFeedback(state) {
      state.userID = ""
      state.userID = ""
      state.email = ""
      state.wantedTo = ""
      state.explanation = ""
      state.status = {
        submitting: false,
        success: false,
        message: ''
      }

    }
  },
  actions: {
    submitFeedback(ctx) {
      ctx.state.status.submitting = true
      let v4UserID = ctx.rootState.user.signedInUser
      ctx.state.userID = v4UserID
      let data = {feedback: ctx.state}
      axios.post('/api/feedback', data).then((_response) => {
        ctx.state.status.success = true
        ctx.state.status.message = 'Thank you for your feedback!'

      }).catch((error) => {
        ctx.state.status.submitting = false
        if(error.response.status == 400) {
          ctx.state.status.message = "Please fill out all of the fields."
        }else {
          console.log(error)
          ctx.state.status.message = 'There was a problem sending your feedback.<br/>Please try again later or send an email to <a  href="mailto:lib-virgo4-feedback@virginia.edu" class="feedback">lib-virgo4-feedback@virginia.edu</a>'
        }



       // ctx.commit('system/setError', error, { root: true })
      })
    }
  }
}
export default feedback
