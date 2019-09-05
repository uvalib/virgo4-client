<template>
   <main class="account">
      <h1>Account Information</h1>
      <div class="account-content">
         <div class="working" v-if="lookingUp" >
            <div>Looking up account details...</div>
            <img src="../assets/spinner2.gif">
         </div>
         <div v-else class="details">
            <div class="user-name">{{info.displayName}} ({{info.id}})</div>   
            <div>{{info.organizationalUnit}} - {{info.profile}}</div>
            <div>{{info.address}}</div>
            <div>{{info.email}}</div>
         </div>
         <BackToVirgo />
      </div>
   </main>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import BackToVirgo from "@/components/BackToVirgo"
export default {
   name: "account",
   components: {
      BackToVirgo
   },
   data: function() {
      return {
         lookingUp: true,
      };
   },
   computed: {
      ...mapState({
         info: state => state.user.accountInfo,
      }),
      ...mapGetters({
        hasAccountInfo: 'user/hasAccountInfo',
      }),
   },
   created() {
      if (this.hasAccountInfo ==  false) {
         this.$store.dispatch("user/getAccountInfo").then(_response => {
            this.lookingUp = false
         })
      } else {
         this.lookingUp = false
      }
   }
}
</script>

<style scoped>
.account {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
.working {
   text-align: center;
   font-size: 1.25em;
}
.working img {
   margin: 30px 0;
}
.account-content {
   width: 60%;
   margin: 0 auto;
}
@media only screen and (min-width: 768px) {
   div.account-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.account-content  {
       width: 80%;
   }
}
.details {
   text-align: left;
}
.user-name {
   font-size: 1.1em;
   font-weight: bold;
}
</style>

