<template>
   <main class="account">
      <h1>My Account</h1>
      <div class="account-content">
         <div class="working" v-if="lookingUp || !hasAccountInfo" >
            <div>Looking up account details...</div>
            <img src="../assets/spinner2.gif">
         </div>
         <div v-else class="details">
            <div class="user-name">{{info.displayName}} ({{info.id}})</div>   
            <div>{{info.department}} - {{info.profile}}</div>
            <div>{{info.address}}</div>
            <div>{{info.email}}</div>
            <div class="status-info">
               <div><b>Standing:</b> {{info.standing}}</div>
               <div v-if="isBillOwed" class="outstanding-bill">
                  <b>AMOUNT OWED:</b> ${{info.amountOwed}}
               </div>
            </div>
         </div>
         <div class="controls">
            <p><b>Activities</b></p>
            <div class="actions">
               <router-link to="/">Search</router-link>
               <span class="sep">|</span>
               <router-link to="/course-reserves">Course Reserves</router-link>
               <span class="sep">|</span>
               <router-link to="/bookmarks">Bookmarks</router-link>
               <span class="sep">|</span>
               <router-link to="/checkouts">Checked Out Items</router-link>
               <span class="sep">|</span>
               <router-link to="/preferences">Preferences</router-link>
               <span class="sep">|</span>
               <div  @click="signOut" class="text-button">Sign Out</div>
            </div>
         </div>
      </div>
   </main>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
export default {
   name: "account",
   components: {
   },
   computed: {
      ...mapState({
         info: state => state.user.accountInfo,
         lookingUp: state => state.user.lookingUp,
      }),
      ...mapGetters({
        hasAccountInfo: 'user/hasAccountInfo',
      }),
      isBillOwed() {
         console.log("woof")
         let amtStr = this.info['amountOwed']
         return parseFloat(amtStr) > 0
      },
   },
   methods: {
      signOut() {
         this.$store.dispatch("user/signout")
      },
   },
   created() {
      this.$store.dispatch("user/getAccountInfo")
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
.sep {
   margin: 0 10px;
}
.controls {
   text-align: left;
}
.controls p {
   border-bottom: 4px solid var(--color-brand-orange);
   padding-bottom: 5px;
}
.controls .action {
   display: flex;
   flex-flow: row wrap;
   justify-content: center;
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
.status-info {
   margin: 15px 0;
}
</style>

