<template>
   <main class="checkout">
      <h1>My Account</h1>
      <div class="checkout-content">
         <AccountActivities/>
         <div class="working" v-if="lookingUp" >
            <div>Looking up checked-out item details...</div>
            <img src="../assets/spinner2.gif">
         </div>
         <div v-else class="details">
            <template v-if="checkouts.length > 0">
               <div class="item" v-for="co in sortedCheckouts" :key="co.id">
                  <h3 class="item-title">
                     <i v-if="itemOnNotice(co)" class="notice fas fa-exclamation-triangle"></i>
                     {{co.title}}
                  </h3>
                  <dl>
                    <dt>Author:</dt>
                      <dd>{{co.author}}</dd>
                    <dt class="label">Library:</dt>
                      <dd>{{co.library}}</dd>
                    <dt class="label">Call number:</dt>
                      <dd>{{co.callNumber}}</dd>
                    <dt class="label">Due Date:</dt>
                      <dd v-html="formatDueInfo(co)"></dd>
                    <dt class="label" v-if="parseFloat(co.overdueFee)>0">Fine:</dt>
                      <dd class="fine-value" v-if="parseFloat(co.overdueFee)>0">${{co.overdueFee}}</dd>
                  </dl>
               </div>
            </template>
            <div v-else class="none">
               You currently have no items checked out
            </div>
            <transition name="message-transition"
                        enter-active-class="animated faster fadeIn"
                        leave-active-class="animated faster fadeOut">
               <p v-if="error" class="error">Unable to retrieve bookmarks: {{ error }}</p>
            </transition>
         </div>
      </div>
   </main>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import AccountActivities from "@/components/AccountActivities"
export default {
   name: "checkouts",
   components: {
      AccountActivities
   },
   computed: {
      ...mapState({
         checkouts: state => state.user.checkouts,
         lookingUp: state => state.user.lookingUp,
         error: state => state.system.error,
      }),
      ...mapGetters({
        sortedCheckouts: 'user/sortedCheckouts',
      })
   },
   methods: {
      formatDueInfo(checkout) {
         let out =  `<div>${checkout.due.split("T")[0]}</div>`
         if (checkout.overdue) {
            out += "<div class='overdue'>Overdue</div>"
         }
         if ( checkout.recallDate != "") {
             out += `<div class='recall'>Recalled ${checkout.recallDate}</div>`
         }
         return out
      },
      itemOnNotice(co) {
         return co.overdue || co.recallDate != ""
      }
   },
   created() {
      this.$store.commit('user/setLookingUp', true)
      this.$store.dispatch("user/getCheckouts")
   }
}
</script>
<style>

.details div.overdue, .details div.recall {
   background: var(--uvalib-red-emergency);
   color: white;
   border-radius: 5px;
   font-weight: bold;
   padding: 5px;
   margin: 2px 0;
}
.details div.recall {
   background-color: var(--uvalib-yellow);
   color: var(--uvalib-grey-darkest);
}
</style>
<style scoped>
dl {
  margin-top: 0;
  margin-left: 15px;
  display: inline-grid;
  grid-template-columns: 95px 1fr;
}
dt {
  font-weight: bold;
}
dd {
  margin: 0 0 10px 0;
}
.checkout {
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
.checkout-content {
   width: 60%;
   margin: 0 auto;
}
@media only screen and (min-width: 768px) {
   div.checkout-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.checkout-content  {
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
.item {
   font-size: 0.9em;
   color: #444;
   border-bottom: 1px solid #ccc;
   margin-bottom: 15px;
   padding-bottom: 10px;
}
.item-title {
   font-weight: bold;
}
td.label {
   font-weight: bold;
   text-align: right;
   vertical-align: text-top;
}
td.label.fine {
   color: var(--uvalib-red-emergency);
}
.fine-value {
  background: var(--uvalib-red-emergency);
  color: white;
  border-radius: 5px;
  font-weight: bold;
  padding: 5px;
}
td {
   padding: 2px 5px;
}
i.notice {
   color:  var(--uvalib-yellow);
   margin-right: 5px;
   font-size: 1.25em;
}
</style>
