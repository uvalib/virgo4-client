<template>
   <main class="requests">
      <h1>Requests</h1>
      <div class="requests-content">
         <AccountActivities/>
         <div v-if="lookingUp" class="working" >
            <div class="box">
               <div>Working...</div>
               <img src="../assets/spinner2.gif">
            </div>
         </div>
         <div class="details">
            <template v-if="requests.length > 0">
               
            </template>
            <template v-else >
               <div v-if="!lookingUp" class="none">
                  You currently have no outstanding requests
               </div>
            </template>
            <transition name="message-transition"
                        enter-active-class="animated faster fadeIn"
                        leave-active-class="animated faster fadeOut">
               <p v-if="error" class="error">{{ error }}</p>
            </transition>
         </div>
      </div>
   </main>
</template>

<script>
import { mapState } from "vuex"
import AccountActivities from "@/components/AccountActivities"
export default {
   name: "requests",
   components: {
      AccountActivities
   },
   computed: {
      ...mapState({
         requests: state => state.user.requests,
         lookingUp: state => state.user.lookingUp,
         error: state => state.system.error,
      }),
   },
   methods: {
   },
   created() {
      this.$store.dispatch("user/getRequests")
   }
}
</script>

<style scoped>
.requests {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
.working {
   text-align: center;
   position: fixed;
   right: 0;
   left: 0;
   z-index: 1000;
   top: 0;
   bottom: 0;
   background: rgba(0, 0, 0, 0.3);
}
.working .box {
   background: white;
   z-index: 1000;
   padding: 10px 100px 0 100px;
   border: 4px solid var(--color-brand-orange);
   border-radius: 5px;
   box-shadow: 0 0 10px #444;
   display: inline-block;
   margin: 10% auto;
}
.working img {
   margin: 15px 0;
}
.requests-content {
   width: 60%;
   margin: 0 auto;
   position: relative;
}
@media only screen and (min-width: 768px) {
   div.requests-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.requests-content  {
       width: 95%;
   }
}
.none {
   text-align: center;
   font-size: 1.25em;
   margin-top: 35px;
}
.details {
   text-align: left;
}
</style>
