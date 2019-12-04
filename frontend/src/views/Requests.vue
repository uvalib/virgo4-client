<template>
   <main class="requests">
      <h1>Requests</h1>
      <div class="requests-content">
         <AccountActivities />
         <div v-if="lookingUp" class="working">
            <div class="box">
               <div>Working...</div>
               <img src="../assets/spinner2.gif" />
            </div>
         </div>
         <div class="details">
            <template v-if="requests.length > 0">
               <div class="request" v-for="(req,idx) in requests" :key="idx">
                  <h3 class="title">{{req.loanTitle}}</h3>
                  <dl>
                     <dt>Author:</dt>
                     <dd>{{req.loanAuthor}}</dd>
                     <dt>Call Number:</dt>
                     <dd>{{req.callNumber}}</dd>
                     <dt>Transaction Number:</dt>
                     <dd>{{req.transactionNumber}}</dd>
                     <dt>Date Requested:</dt>
                     <dd>{{formatDate(req.creationDate)}}</dd>
                     <template v-if="req.wantedBy">
                        <dt>Wanted By:</dt>
                        <dd>{{req.wantedBy}}</dd>
                     </template>
                     <template v-if="req.notWantedAfter">
                        <dt>Not Wanted After:</dt>
                        <dd>{{req.notWantedAfter}}</dd>
                     </template>
                     <dt>Status:</dt>
                     <dd>{{req.transactionStatus}}</dd>
                  </dl>
               </div>
            </template>
            <template v-else>
               <div v-if="!lookingUp" class="none">You currently have no outstanding requests</div>
            </template>
            <transition
               name="message-transition"
               enter-active-class="animated faster fadeIn"
               leave-active-class="animated faster fadeOut"
            >
               <p v-if="error" class="error">{{ error }}</p>
            </transition>
         </div>
      </div>
   </main>
</template>

<script>
import { mapState } from "vuex";
import AccountActivities from "@/components/AccountActivities";
export default {
   name: "requests",
   components: {
      AccountActivities
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
      }
   },
   created() {
      this.$store.dispatch("user/getRequests");
   }
};
</script>

<style scoped>
.requests {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
.request {
   font-size: 0.9em;
   color: #444;
   border-bottom: 1px solid #ccc;
   margin-bottom: 15px;
   padding-bottom: 0px;
}
.request .title {
   font-weight: bold;
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
   div.requests-content {
      width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.requests-content {
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
dl {
   margin-top: 0;
   margin-left: 15px;
   display: inline-grid;
   grid-template-columns: max-content 2fr;
   grid-column-gap: 15px;
}
dt {
   font-weight: bold;
   text-align: right;
}
dd {
   margin: 0 0 10px 0;
}
</style>
