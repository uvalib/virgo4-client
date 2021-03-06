<template>
   <div class="checkout">
      <V4Spinner v-if="downloading" message="Downloading..." v-bind:overlay="true" />
      <RenewSummary v-if="hasRenewSummary"/>
      <SignInRequired v-if="isSignedIn == false" targetPage="checkout information"/>
      <template v-if="isSignedIn">
         <AccountActivities />
         <V4Spinner v-if="renewing" message="Renew in progress..." v-bind:overlay="true" />
         <div v-if="lookingUpUVA" class="working">
            <V4Spinner message="Looking up UVA Checkouts..." />
         </div>
         <div v-if="lookingUpILL" class="working">
            <V4Spinner message="Looking up ILL Checkouts..." />
         </div>
         <div class="details">
            <div class="barred" v-if="isBarred">
               Your account is suspended until all bills are paid and/or the overdue items are returned.<br/>
               If you need assistance, please email <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a>.
            </div>
            <template v-if="lookingUpUVA == false && checkouts.length > 0">
               <AccordionContent
                  class="checkout-accordion"
                  background="var(--uvalib-blue-alt-lightest)"
                  borderWidth="0 0 3px 0"
                  borderColor="var(--uvalib-blue-alt)"
                  id="uva-checkouts"
                  :expanded="checkoutsOrder == 'OVERDUE'"
               >
                  <template v-slot:title><span class="section-title">UVA Checkouts ({{checkouts.length}})</span></template>
                  <div class="checkout-list">
                     <div class="controls">
                        <span class="sort">
                           <label>Sort by</label>
                           <select :value="checkoutsOrder" @change="sortChanged" ref="uvasort">
                              <option value="AUTHOR_ASC">Author (Ascending)</option>
                              <option value="AUTHOR_DESC">Author (Descending)</option>
                              <option value="TITLE_ASC">Title (Ascending)</option>
                              <option value="TITLE_DESC">Title (Descending)</option>
                              <option value="DUE_ASC">Due Date (Ascending)</option>
                              <option value="DUE_DESC">Due Date (Descending)</option>
                              <option value="OVERDUE">Overdue / Recalled</option>
                           </select>
                        </span>
                        <span class="checkout-options">
                           <V4Button v-if="checkouts.length" id="download-csv-btn"
                              mode="icon"
                              @click="downloadCSV()"
                              title="Download your checkouts as a CSV file" >
                              <i class="fal fa-download"></i>
                           </V4Button>
                           <V4Button  id="renew-all-btn" mode="primary" @click="renewAll">Renew All</V4Button>

                        </span>
                     </div>
                     <div class="item" v-for="(co,idx) in checkouts" :key="idx">
                        <h3 class="item-title">
                           <i v-if="itemOnNotice(co)" class="notice fas fa-exclamation-triangle"></i>
                           <template v-if="co.id">
                              <router-link :to="`/catalog/u${co.id}`">{{co.title}}</router-link>
                           </template>
                           <template v-else>
                              {{co.title}}
                           </template>
                        </h3>
                        <dl>
                        <template v-if="co.author.length > 0">
                           <dt>Author:</dt>
                           <dd>{{co.author}}</dd>
                        </template>
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
               </AccordionContent>
            </template>
            <div v-if="lookingUpUVA == false && checkouts.length == 0 && !ilsError" class="none">
               You have no UVA checkouts.
            </div>
            <div v-if="lookingUpUVA == false && ilsError" class="error">
               {{ilsError}}
            </div>
            <template v-if="lookingUpILL == false && illiadCheckouts.length > 0">
               <AccordionContent
                  class="checkout-accordion"
                  background="var(--uvalib-blue-alt-lightest)"
                  borderWidth="0 0 3px 0"
                  borderColor="var(--uvalib-blue-alt)"
                  id="ill-checkouts"
               >
                  <template v-slot:title><span class="section-title">ILL Checkouts  ({{illiadCheckouts.length}})</span></template>
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
               </AccordionContent>
            </template>
            <div v-if="lookingUpILL == false && illiadCheckouts.length == 0" class="none">
               You have no ILL checkouts.
            </div>
         </div>
      </template>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import AccountActivities from "@/components/AccountActivities"
import AccordionContent from "@/components/AccordionContent"
import RenewSummary from "@/components/modals/RenewSummary"
export default {
   name: "checkouts",
   components: {
      AccountActivities,AccordionContent,RenewSummary
   },
   data: function() {
      return {
         lookingUpUVA: true,
         downloading: false,
      }
   },
   computed: {
      ...mapState({
         userID: state => state.user.userID,
         checkouts: state => state.user.checkouts,
         checkoutsOrder: state => state.user.checkoutsOrder,
         requests: state => state.user.requests,
         ilsError: state => state.system.ilsError,
         renewing: state => state.user.renewing,
         lookingUpILL: state => state.user.lookingUp,
      }),
      ...mapGetters({
        isBarred: 'user/isBarred',
        isSignedIn: 'user/isSignedIn',
        hasRenewSummary: 'user/hasRenewSummary'
      }),
      illiadCheckouts() {
         return this.requests.illiad.filter( h=> h.transactionStatus == "Checked Out to Customer")
      }
   },
   methods: {
      signInClicked() {
         this.$router.push("/signin")
      },
      sortChanged() {
         this.$store.commit("user/sortCheckouts", this.$refs.uvasort.value)
      },
      renewItem(barcode) {
         this.$store.dispatch("user/renewItem", barcode)
      },
      renewAll() {
         this.$store.dispatch("user/renewAll")
      },
      async downloadCSV(){
         this.downloading = true
         await this.$store.dispatch("user/downloadCheckoutsCSV")
         this.downloading = false
      },
      formatILLDate(dateStr) {
         if (!dateStr) {
            return "N/A"
         }
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
   async created() {
      this.lookingUpUVA = false
      if ( this.isSignedIn ) {
         this.$analytics.trigger('Navigation', 'MY_ACCOUNT', "Checkouts")
         this.lookingUpUVA = true
         await this.$store.dispatch("user/getCheckouts")
         this.lookingUpUVA = false
         if (this.$route.query.overdue) {
            this.checkoutsOrder = "OVERDUE"
            this.$store.commit("user/sortCheckouts", "OVERDUE")
         }
      }
   }
}
</script>

<style lang="scss" scoped>
// v-deep allows these dynamically added classes to be styled
::v-deep .details div.overdue, .details div.recall {
   background: var(--uvalib-red-emergency);
   color: white;
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

.checkout {
   min-height: 400px;
   position: relative;
   color: var(--color-primary-text);
   width: 60%;
   margin: 2vw auto 0 auto;
   position: relative;

   .checkout-accordion {
      margin-bottom: 20px;
   }
   .working  {
      text-align: center;
      margin: 5px 0 20px 0;
   }
   .none {
      text-align: center;
      font-size: 1.25em;
      margin: 20px 0;
      border: 1px solid var(--uvalib-grey);
      background: var(--uvalib-grey-lightest);
      padding: 10px;
   }
   .section-title {
      font-weight: bold;
      font-size:1.15em;
      padding: 5px;
   }
   .details {
      text-align: left;
   }
}

.checkout-list {
   background-color: var(--uvalib-grey-lightest);
   border: 1px solid var(--uvalib-grey-light);

   .controls{
      margin: 0;
      text-align: right;
      padding: 5px 5px 5px 10px;
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      border-bottom: 3px solid var(--uvalib-blue-alt);
      background: white;

      label {
         font-weight: 500;
         margin-right: 10px;
      }

      #renew-all-btn {
         margin: 0;
      }
      #download-csv-btn {
         cursor: pointer;
         font-size: 1.25em;
         margin: 0 15px;
      }

      .checkout-options{
         margin-left: auto !important;
      }
   }

   .item {
      font-size: 0.9em;
      margin:15px;
      border: 1px solid var(--uvalib-grey-lightest);
      background: white;
      padding: 5px 10px;
      box-shadow: $v4-box-shadow-light;

      h3 {
         margin: 0 0 15px 0;
         padding: 10px;
         border-bottom: 2px solid var(--uvalib-grey-light);
      }
      .renewbar {
         text-align: right;
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
      .co-message {
         font-size: 1em;
         padding: 5px 10px;
         margin-bottom: 15px;
         background-color: var(--uvalib-red-lightest);
         font-weight: bold;
         border-radius: 5px;
      }
   }
}

@media only screen and (min-width: 768px) {
   div.checkout  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.checkout  {
       width: 95%;
   }
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
.barred, .error {
   font-size: 1em;
   font-weight: bold;
   text-align: center;
   padding: 10px;
   margin: 15px 0;
   border-radius: 5px;
   color: var(--uvalib-text);
   background-color: var(--uvalib-red-lightest);
}
</style>
