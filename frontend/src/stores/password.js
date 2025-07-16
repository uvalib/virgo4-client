import { defineStore } from 'pinia'
import axios from 'axios'
import { useSystemStore } from "@/stores/system"

export const usePasswordStore = defineStore('password', {
	state: () => ({
      working: false,
      error: "",
      resetToken: "",
      forgotPasswordSession: ""
   }),

   getters: {
      isPasswordReset: state => {
         return state.resetToken != ""
      }
   },

   actions: {
      initRequest() {
         this.working = true
         this.error = ""
      },

      resetForgotSession() {
         this.resetToken = ""
         this.forgotPasswordSession = ""
      },

      async changePassword(barcode, currPassword, newPassword) {
         this.initRequest()
         let data = {barcode: barcode, currPassword: currPassword, newPassword: newPassword}
         return axios.post("/api/change_password", data).then(() => {
            this.working = false
            setTimeout(()=>{
               useSystemStore().setToast("Success", "Your password has been changed.")
            }, 500)
         }).catch((e) => {
            this.error =  e.response.data
            this.working = false
         })
      },

      async forgotPassword(barcode) {
         this.initRequest()
         if  ( barcode == "" ) {
            this.error = "Library ID is required"
            this.working = false
            return
         }
         return axios.post("/api/forgot_password", {userBarcode: barcode} ).then(() => {
            useSystemStore().setToast("Success", "An email has been sent to reset your password.")
            this.working = false
         }).catch((e) => {
            let msg = "There's a problem with your account. <a href='https://www.library.virginia.edu/askalibrarian' target='_blank'>Ask a Librarian</a> for help.<br/>"
            msg += e.response.data
            this.error =  msg
            this.working = false
         })
      },

      initForgotSession(resetToken) {
         this.resetToken = resetToken
         this.forgotPasswordSession = ""
         let data = {resetPasswordToken: resetToken}
         axios.post("/api/start_reset_password_session", data ).then((response) => {
            this.forgotPasswordSession = response.data
            this.working = false
         }).catch((e) => {
            let msg = "Unable to initialize forgot password request: "+e.response.data
            this.error =  msg
            this.working = false
         })
      },

      async resetPassword( newPassword ) {
         this.initRequest()
         let data = { session: this.forgotPasswordSession, newPassword: newPassword}
         return axios.post("/api/reset_password", data ).then(() => {
            this.working = false
            setTimeout(()=>{
               useSystemStore().setToast("Success", "Your password has been changed.")
            }, 500)
         }).catch((e) => {
            this.error =  e.response.data
            this.working = false
         })
      },
   }
})
