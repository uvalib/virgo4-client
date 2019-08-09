<template>
   <main class="account">
      <h1>My Account</h1>
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
         <div class="controls">
            <span @click="backClicked" class="pure-button pure-button-primary">Return to Virgo</span>
         </div>
      </div>
   </main>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
export default {
   name: "account",
   data: function() {
      return {
         lookingUp: true,
      };
   },
   computed: {
      ...mapState({
         info: state => state.auth.accountInfo,
      }),
      ...mapGetters({
        hasAccountInfo: 'auth/hasAccountInfo',
      }),
   },
   methods: {
      backClicked() {
         this.$router.push("/")
      }
   },
   created() {
      if (this.hasAccountInfo ==  false) {
         this.$store.dispatch("auth/getAccountInfo").then(_response => {
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
   width: 40%;
   margin: 0 auto;
}
.details {
   text-align: left;
}
.user-name {
   font-size: 1.1em;
   font-weight: bold;
}
.controls {
   margin-top: 15px;
   text-align: right;
}
</style>

