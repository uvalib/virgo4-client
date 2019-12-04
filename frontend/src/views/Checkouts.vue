<template>
   <main class="checkout">
      <h1>My Account</h1>
      <div class="checkout-content">
         <AccountActivities/>
         <div v-if="lookingUp" class="working" >
            <div class="box">
               <div>Working...</div>
               <img src="../assets/spinner2.gif">
            </div>
         </div>
         <div class="details">
            <template v-if="checkouts.length > 0">
               <div class="barred" v-if="isBarred">
                     Your account is suspended until all bills are paid and/or the overdue items are returned.<br/>
                     If you need assistance, please email <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a>.
               </div>
               <div v-else class="toolbar">
                  <span @click="renewAll" 
                     class="renew-all pure-button pure-button-primary">Renew All</span>
               </div>
               <div class="item" v-for="(co,idx) in sortedCheckouts" :key="idx">
                  <h3 class="item-title">
                     <i v-if="itemOnNotice(co)" class="notice fas fa-exclamation-triangle"></i>
                     {{co.title}}
                     <span @click="renewItem(co.barcode)" v-if="!isBarred"
                        class="renew pure-button pure-button-primary">Renew</span>
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
                  <div v-if="co.message" class="co-message">
                     {{co.message}}
                  </div>
               </div>
            </template>
            <template v-else >
               <div v-if="!lookingUp" class="none">
                  You currently have no items checked out
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
        isBarred: 'user/isBarred',
      })
   },
   methods: {
      renewItem(barcode) {
         this.$store.dispatch("user/renewItem", barcode)
      },
      renewAll() {
         this.$store.dispatch("user/renewAll")
      },
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
   padding: 5px 15px;
   width:fit-content;
   margin: 2px 0;
}
.details div.recall {
   background-color: var(--uvalib-yellow);
   color: var(--uvalib-grey-darkest);
   padding: 5px 15px;
   width:fit-content;
}
</style>
<style scoped>
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
.checkout {
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
.checkout-content {
   width: 60%;
   margin: 0 auto;
   position: relative;
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
   padding-bottom: 0px;
}
.item-title {
   font-weight: bold;
}
.fine-value {
  background: var(--uvalib-red-emergency);
  color: white;
  border-radius: 5px;
  font-weight: bold;
  padding: 5px 15px;
  width:fit-content;
}
i.notice {
   color:  var(--uvalib-yellow);
   margin-right: 5px;
   font-size: 1.25em;
}
span.renew {
   font-size: 0.75em;
   float: right;
   font-weight: 500;
}
.toolbar {
   font-size: 0.8em;
   text-align: right;
   border-bottom: 2px solid var(--color-brand-blue);
   padding-bottom: 5px;
   position: relative;
   top: -10px;
   font-weight: 500;
}
.barred {
   font-size: 1em;
   font-weight: bold;
   text-align: center;
   padding: 10px;
   margin: 15px 0;
   border-radius: 5px;
   background-color: var(--uvalib-red-lightest);
}
.co-message {
   font-size: 1em;
   padding: 5px 10px;
   margin-bottom: 15px;
   background-color: var(--uvalib-red-lightest);
   font-weight: bold;
   border-radius: 5px;
}
</style>
