<template>
   <div class="signin">
      <div class="netbadge">
         <span class="netbadge">
            <h2>UVA Users</h2>
            <p class="subhead">(UVA students, faculty, and staff)</p>
            <div class="indent">
               <V4Button id="netbadge" mode="primary" @click="netbadgeLogin">Sign In with Netbadge</V4Button>
            </div>
         </span>
      </div>
      <div>
         <h2>All Other Users</h2>
         <p>(All other researchers, including UVA alumni or retirees)</p>
         <div class="indent">
            <table class="pure-form form">
               <tr>
                  <td class="label">Library ID</td>
                  <td class="value">
                     <input v-model="user" type="text">
                     <p class="hint">Driver's License Number, eg: A12345678</p>
                  </td>
               </tr>
               <tr>
                  <td class="label">Password</td>
                  <td class="value">
                     <input @keyup.enter="signinClicked" v-model="pin" type="password">
                  </td>
               </tr>
               <tr>
                  <td colspan="2">
                     <transition name="message-transition"
                        enter-active-class="animated faster fadeIn"
                        leave-active-class="animated faster fadeOut">
                        <div v-if="userStore.authMessage" class="authMessage">
                           <div v-if="userStore.lockedOut" class="locked-out">
                              {{ userStore.authMessage }}
                           </div>
                           <div v-else class="tries">
                              <div class="auth-msg">{{ userStore.authMessage }}</div>
                              You have <b>{{userStore.authTriesLeft}}</b> more tries before your account is locked.
                           </div>
                        </div>
                     </transition>
                  </td>
               </tr>
               <tr v-if="!systemStore.ilsError">
                  <td colspan="2">
                     <V4Button mode="primary" @click="signinClicked">Sign in</V4Button>
                  </td>
               </tr>
               <tr>
                  <td colspan="2">
                     <ForgotPassword :trigger="showForgotModal" @closed="onForgotPassClosed" />
                     <ChangePassword v-if="hasPasswordToken" @show-forgot-password="onShowForgotPassword"/>
                  </td>
               </tr>
            </table>
            <div class="ils-error" v-if="systemStore.ilsError">{{systemStore.ilsError}}</div>
         </div>
      </div>
      <div class="community">
         Members of our community are welcome to use many UVA Library resources.
         <a href="https://www.library.virginia.edu/policies/circulation/" target="_blank">Learn about creating an account and accessing materials.</a>
      </div>
   </div>
</template>

<script setup>
import ForgotPassword from "@/components/modals/ForgotPassword.vue"
import ChangePassword from "@/components/modals/ChangePassword.vue"
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const systemStore = useSystemStore()
const userStore = useUserStore()
const user = ref('')
const pin = ref('')
const showForgotModal = ref(false)

const hasPasswordToken = computed( ()=> {
   return route.query.token && route.query.token.length > 0
})

userStore.$subscribe((mutation) => {
   if (mutation.events.key == "authTriesLeft")  {
      console.log("AUTH TRIES "+mutation.events.oldValue+" -> "+mutation.events.newValue)
      if (mutation.events.newValue < mutation.events.oldValue ) {
         pin.value = ""
      }
   }
})

function onForgotPassClosed() {
   showForgotModal.value = false
}
function onShowForgotPassword() {
   showForgotModal.value = true
}
function signinClicked() {
  userStore.signin({barcode: user.value.trim(), password: pin.value})
}
function netbadgeLogin() {
   userStore.netbadge()
}
</script>

<style scoped>
.signin {
   min-height: 400px;
   position: relative;
   margin: 2vw auto 6vw;
   color: var(--uvalib-text);
   text-align: left;
}
.ils-error {
    font-size: 1em;
    font-weight: bold;
    text-align: center;
    padding: 10px;
    margin: 15px 0;
    border-radius: 5px;
    color: var(--uvalib-text);
    background-color: var(--uvalib-red-lightest);
}
.sign-in-content {
   width: 60%;
   margin: 0 auto;
   text-align: left;
}
h2 {
  margin-bottom: 0;
}
td.label {
  font-weight: 500;
  text-align: right;
  padding: 8px 5px 0 5px;
  width:1%;
  white-space: nowrap;
  vertical-align: text-top;
}
td.value {
   padding: 3px 0 10px 0;
   width: 100%;
}
#app .signin .pure-form input {
   width:100%;
   box-sizing: border-box;
   padding: 6px;
}
p.hint {
   margin: 5px 10px;
   color: var(--uvalib-grey-dark);
   text-align: left;
}
.controls {
   margin-top: 5px;
}
div.netbadge {
   padding-bottom: 25px;
   border-bottom: 1px solid var(--uvalib-grey-light);
   margin: 25px 0;
}
.community {
   padding-top: 25px;
   border-top: 1px solid var(--uvalib-grey-light);
   margin: 25px 0;
}
div.indent {
   text-align: center;
}
@media only screen and (min-width: 768px) {
   .signin {
      width: 35%;
   }
}
@media only screen and (max-width: 768px) {
   .signin {
      width: 95%;
   }
   div.indent {
     margin-left: 0;
   }
}
.authMessage {
   font-weight: bold;
   color: var(--uvalib-red-emergency);
   text-align: center;
   margin: 0 0 15px 0;
}
.tries {
   font-weight: normal;
}
.auth-msg {
   font-weight: bold;
}
.locked-out {
   color: var(--uvalib-text);
   font-size: 1em;
   font-weight: bold;
   text-align: center;
   padding: 10px;
   margin: 15px 0;
   border-radius: 5px;
   background-color: var(--uvalib-red-lightest);
}
</style>
