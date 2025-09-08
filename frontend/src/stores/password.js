import { defineStore } from 'pinia'
import axios from 'axios'
import { useSystemStore } from "@/stores/system"

export const usePasswordStore = defineStore('password', {
	state: () => ({
      working: false,
      error: "",
      resetToken: "",
      resetSession: "",
      showForgotPass: false,
      showChangePass: false
   }),

   getters: {
      isPasswordReset: state => {
         return state.resetToken != "" || state.resetSession != ""
      }
   },

   actions: {
      initRequest() {
         this.working = true
         this.error = ""
      },

      resetForgotSession() {
         this.resetToken = ""
         this.resetSession = ""
         this.error = ""
      },

      changePassword(barcode, currPassword, newPassword) {
         this.initRequest()
         let data = {barcode: barcode, currPassword: currPassword, newPassword: newPassword}
         axios.post("/api/change_password", data).then(() => {
            this.working = false
            this.showChangePass = false
            setTimeout(()=>{
               useSystemStore().setToast("Success", "Your password has been changed.")
            }, 250)
         }).catch((e) => {
            console.error(e.response.data)
            this.error =  e.response.data
            this.working = false
         })
      },

      forgotPassword(barcode) {
         this.initRequest()
         if  ( barcode == "" ) {
            this.error = "Library ID is required"
            this.working = false
            return
         }
         axios.post("/api/forgot_password", {userBarcode: barcode} ).then(() => {
            useSystemStore().setToast("Success", "An email has been sent to reset your password.")
            this.working = false
            this.showForgotPass = false
         }).catch((e) => {
            let msg = "There's a problem with your account. <a href='https://www.library.virginia.edu/askalibrarian' target='_blank' aria-describedby='new-window'>Ask a Librarian</a> for help.<br/>"
            msg += e.response.data
            this.error =  msg
            this.working = false
         })
      },

      initForgotSession(resetToken) {
         // On the first attempt, there is a reset token but no session.
         // If that request fails, a session will be part of the reponse. When that happens
         // the token will be blanked out (it is no longer valid) and session set
         this.resetToken = resetToken
         this.resetSession = ""
         this.showChangePass = true // automatically open the change password modal
      },

      resetPassword( newPassword ) {
         this.initRequest()
         // Per above notes, only session or token should be set. If both are present, session is preferred.
         let data = { token: this.resetToken, session: this.resetSession, newPassword: newPassword}
         axios.post("/api/reset_password", data ).then(() => {
            this.working = false
            this.showChangePass = false
            setTimeout(()=>{
               useSystemStore().setToast("Success", "Your password has been changed.")
            }, 250)
         }).catch((e) => {
            console.log("PASSWORD RESET FAILED:")
            console.log(e.response)
            if ( e.response.data.sessionToken ) {
               this.resetToken = ""
               this.resetSession = e.response.data.sessionToken
               this.error =  e.response.data.errorMessage
            } else {
               this.error =  e.response.data
            }
            this.working = false
         })
      },
   }
})