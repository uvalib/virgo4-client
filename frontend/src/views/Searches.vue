<template>
   <div class="searches">
      <h1>Searches</h1>
      <div class="searches-content">
         <AccountActivities/>
         <div class="working" v-if="lookingUp" >
            <V4Spinner message="Loading up requests..."/>
         </div>
         <div class="details">
            <transition
               name="message-transition"
               enter-active-class="animated faster fadeIn"
               leave-active-class="animated faster fadeOut"
            >
               <p v-if="error" class="error">{{ error }}</p>
            </transition>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import V4Spinner from "@/components/V4Spinner"
import AccountActivities from "@/components/AccountActivities"
export default {
   name: "requests",
   components: {
      V4Spinner, AccountActivities
   },
   computed: {
      ...mapState({
         requests: state => state.user.requests,
         lookingUp: state => state.user.lookingUp,
         error: state => state.system.error
      })
   },
   methods: {
      formatDate(date) {
         return date.split("T")[0];
      },
   },
   created() {
      this.$store.dispatch("user/getRequests");
   }
};
</script>

<style scoped>
.searches {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}

div.searches-content {
   width: 60%;
   margin: 0 auto;
   text-align: left;
}
@media only screen and (min-width: 768px) {
   div.searches-content {
      width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.searches-content {
      width: 95%;
   }
}
.none {
   text-align: center;
   font-size: 1.25em;
   margin-top: 35px;
}
</style>
