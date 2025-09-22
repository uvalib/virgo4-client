<template>
   <div class="signin" :class="{embedded: props.embedded == true}">
      <div v-if="route.query.activated == 'true'" class="auth-message success">
         <p>Thank you, your email has been confirmed.</p>
         <p>You may now sign in below with your library ID and password.</p>
      </div>
      <div v-else-if="route.query.activated == 'false'" class="auth-message">
         <p>Auth token has expired.</p>
         <ForgotPassword />
      </div>
      <div class="netbadge">
         <h2>UVA Users</h2>
         <p class="subhead">(UVA students, faculty, and staff)</p>
         <div class="section centered">
            <VirgoButton @click="netbadgeLogin" label="Sign In with Netbadge"/>
         </div>
      </div>
      <div>
         <h2>All Other Users</h2>
         <p>(All other researchers, including UVA alumni or retirees)</p>
         <div class="section">
            <FormKit type="form" id="signin" :actions="false" @submit="signinClicked">
               <FormKit label="Library ID" type="text" v-model="user" validation="required" help="Library ID, eg: C001005101 or TEMP001166" autocomplete="username" validation-visibility="submit"/>
               <FormKit label="Password" type="password" v-model="pin" validation="required" autocomplete="current-password" validation-visibility="submit" />
               <V4FormActions :hasCancel="false" submitLabel="Sign in" submitID="submit-signin" buttonAlign="center" />
            </FormKit>
            <transition name="message-transition"
               enter-active-class="animated faster fadeIn"
               leave-active-class="animated faster fadeOut">
               <div v-if="userStore.authMessage" class="auth-message">
                  <div v-if="userStore.lockedOut" class="locked-out">
                     {{ userStore.authMessage }}
                  </div>
                  <div v-else class="tries">
                     <div class="auth-msg">{{ userStore.authMessage }}</div>

                     <p v-if="userStore.authTriesLeft <= 5" >
                        You have <b>{{userStore.authTriesLeft}}</b> more tries before your account is locked.
                     </p>
                  </div>
               </div>
            </transition>
            <template v-if="!systemStore.ilsError">
               <div class="changes">
                  <ForgotPassword />
                  <ChangePassword v-if="hasPasswordToken" />
               </div>
            </template>
            <div class="ils-error" v-if="systemStore.ilsError">{{systemStore.ilsError}}</div>
         </div>
      </div>
      <div class="community">
         Members of our community are welcome to use many UVA Library resources.
         <a href="https://www.library.virginia.edu/policies/circulation/" target="_blank" aria-describedby="new-window">Learn about creating an account and accessing materials.</a>
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

const props = defineProps({
   embedded: {
      type: Boolean,
      default: false
   }
})

const route = useRoute()
const systemStore = useSystemStore()
const userStore = useUserStore()
const user = ref('')
const pin = ref('')

const hasPasswordToken = computed( ()=> {
   return route.query.token && route.query.token.length > 0
})

const signinClicked = (() => {
  userStore.signin({barcode: user.value.trim(), password: pin.value})
})

const netbadgeLogin = (() => {
   userStore.netbadge()
})
</script>

<style scoped lang="scss">
.signin {
   position: relative;
   margin: 2vw auto 0;
   padding-bottom: 6vw;
   text-align: left;
   div.netbadge {
      padding-bottom: 25px;
      border-bottom: 1px solid $uva-grey-100;
      margin: 25px 0;
   }
   div.section {
      text-align: left;
   }
   .section.centered {
      text-align: center;
      button {
         margin: 0;
      }
   }
   .changes {
      margin-top: 10px;
      text-align: center;
   }
   .community {
      padding-top: 25px;
      border-top: 1px solid $uva-grey-100;
      margin: 15px 0;
   }
}
.ils-error {
    font-size: 1em;
    font-weight: bold;
    text-align: center;
    padding: 10px;
    margin: 15px 0;
    border-radius: 0.3rem;
    color: $uva-text-color-dark;
    background-color: $uva-red-100;
}
h2 {
  margin-bottom: 0;
}
.signin.embedded {
   margin: 0 auto;
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
   div.section {
     margin-left: 0;
   }
}
.auth-message {
   font-weight: bold;
   color: $uva-red-A;
   text-align: center;
   margin: 15px 0 15px;
   &.success {
      color: $uva-green-A;

   }
}
.tries {
   font-weight: normal;
}
.auth-msg {
   font-weight: bold;
}
.locked-out {
   color: $uva-text-color-base;
   font-size: 1em;
   font-weight: bold;
   text-align: center;
   padding: 10px;
   margin: 15px 0;
   border-radius: 0.3rem;
   background-color: $uva-red-100;
}
</style>
