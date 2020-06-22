<template>
   <div class="checkout">
      <h1>My Account</h1>
      <div class="checkout-content">
         <AccountActivities/>
         <V4Spinner v-if="lookingUp" message="Working..." v-bind:overlay="true"/>
         <div class="details">
            <div class="barred" v-if="isBarred">
               Your account is suspended until all bills are paid and/or the overdue items are returned.<br/>
               If you need assistance, please email <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a>.
            </div>
            <div class="checkouts" v-if="checkouts.length > 0">
               <div class="checkout-header">
                  <h2>UVA Checkouts</h2>
                  <V4Button v-if="!isBarred" id="renew-all-btn" mode="primary" @click="renewAll">Renew All</V4Button>
               </div>
               <div class="checkout-list">
                  <div class="item" v-for="(co,idx) in sortedCheckouts" :key="idx">
                     <h3 class="item-title">
                        <i v-if="itemOnNotice(co)" class="notice fas fa-exclamation-triangle"></i>
                        {{co.title}}
                     </h3>
                     <dl>
                     <dt>Author:</dt>
                        <dd>{{co.author}}</dd>
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
                     <div class="renewbar">
                         <V4Button v-if="!isBarred" mode="primary" 
                           @click="renewItem(co.barcode)" class="renew"
                           :aria-label="`renew ${co.title}`"
                        >
                           Renew
                        </V4Button>
                     </div>
                  </div>
               </div>
            </div>
            <div class="checkouts" v-if="illiadCheckouts.length > 0">
               <div class="checkout-header">
                  <h2>ILL Checkouts</h2>
               </div>
               <div class="checkout-list">
                  <div class="item" v-for="(co,idx) in illiadCheckouts" :key="idx">
                     <h3 class="item-title">{{co.loanTitle}}</h3>
                     <dl>
                        <dt>Author:</dt>
                           <dd>{{co.loanAuthor}}</dd>
                        <template  v-if="co.callNumber">
                           <dt class="label">Call number:</dt>
                              <dd>{{co.callNumber}}</dd>
                        </template>
                        <dt class="label">Due Date:</dt>
                           <dd>{{formatILLDate(co.dueDate)}}</dd>
                     </dl>
                  </div>
               </div>
            </div>
            <template v-if="!lookingUp && checkouts.length == 0 && illiadCheckouts.length == 0" >
               <div class="none">
                  You currently have no items checked out
               </div>
            </template>
         </div>
      </div>
   </div>
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
         requests: state => state.user.requests,
      }),
      ...mapGetters({
        sortedCheckouts: 'user/sortedCheckouts',
        isBarred: 'user/isBarred',
      }),
      illiadCheckouts() {
         return this.requests.illiad.filter( h=> h.transactionStatus == "Checked Out to Customer")
      }
   },
   methods: {
      renewItem(barcode) {
         this.$store.dispatch("user/renewItem", barcode)
      },
      renewAll() {
         this.$store.dispatch("user/renewAll")
      },
      formatILLDate(dateStr) {
         return dateStr.split("T")[0]
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
      this.$store.dispatch("user/getRequests")
      setTimeout(()=> { 
         let ele = document.getElementById("renew-all-btn")
         if ( ele ) {
            ele.focus()
         } else {
            document.getElementById("checkouts-submenu").focus()
         }
      }, 250)
   }
}
</script>

<style lang="scss" scoped>
// v-deep allows these dynamically added classes to be styled
::v-deep .details div.overdue, .details div.recall {
   background: var(--uvalib-red-emergency);
   color: white;
   border-radius: 5px;
   font-weight: bold;
   padding: 5px 15px;
   width:fit-content;
   margin: 2px 0;
}
::v-deep .details div.recall {
   background-color: var(--uvalib-yellow);
   color: var(--uvalib-grey-darkest);
   padding: 5px 15px;
   width:fit-content;
}

.checkouts {
   margin-bottom: 25px;
   .v4-button {
      margin-bottom: 0 !important;
   }
   .checkout-header {
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      background: var(--uvalib-blue-alt-light);
      padding: 5px 5px 5px 15px;
      border: 1px solid var(--uvalib-blue-alt);
      border-bottom: none;

      h2 {
         margin: 0;
      }

      .v4-button {
         margin-left: auto;
      }
   }
   .checkout-list {
      border: 1px solid var(--uvalib-grey);
      .item {
         font-size: 0.9em;
         color: #444;
         border-bottom: 1px solid var(--uvalib-grey);
         margin: 0;
         padding: 0 10px 10px 10px;
      }
      .item:last-child {
         border-bottom: 0;
      }
      .item-title {
         font-weight: bold;
      }
   }
   .renewbar {
      text-align: right;
   }
}
dl {
  margin: 0 0 0 15px;
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
v4-button.renew {
   font-size: 0.75em;
   float: right;
   font-weight: 500;
   margin-top: 10px;
}
.toolbar {
   font-size: 0.8em;
   text-align: right;
  
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