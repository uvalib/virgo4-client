<template>
   <div class="request-panel">
      <h2 v-if="prefill==false">ILL Borrow Item Request</h2>
      <div class="scan pure-form">
         <div class="entry pure-control-group">
            <label for="doctype">What would you like to borrow?<span class="required">*</span></label>
            <select v-model="request.doctype" id="doctype">
               <option value="">Select an item type</option>
               <option value="Book">Book</option>
               <option value="Bound Journal Volume">Bound Journal Volume</option>
               <option value="Thesis or Dissertation">Thesis or Dissertation</option>
               <option value="Newspapers">Newspapers</option>
               <option value="Microform">Microform</option>
               <option value="Government Document ">Government Document </option>
               <option value="Music Score">Music Score</option>
            </select>
            <span v-if="hasError('doctype')" class="error">Item type is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="title">Title<span class="required">*</span></label>
            <input type="text" v-model="request.title" id="title" aria-required="true" required="required">
            <span class="note">Please do not abbreviate title</span>
            <span v-if="hasError('title')" class="error">Article or chapter title is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="author">Author/Editor</label>
            <input type="text" v-model="request.author" id="author">
         </div>
         <div class="entry pure-control-group">
            <label for="publisher">Publisher</label>
            <input type="text" v-model="request.publisher" id="publisher">
         </div>
         <div class="entry pure-control-group">
            <label for="volume">Volume</label>
            <input type="text" v-model="request.volume" id="volume">
         </div>
         <div class="entry pure-control-group">
            <label for="year">Year<span class="required">*</span></label>
            <input type="text" v-model="request.year" id="year"  aria-required="true" required="required">
            <span v-if="hasError('date')" class="error">Year is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="edition">Edition</label>
            <input type="text" v-model="request.edition" id="edition">
         </div>
         <div class="entry pure-control-group">
            <label for="oclc">OCLC Number</label>
            <input type="text" v-model="request.oclc" id="oclc">
         </div>
         <div class="entry pure-control-group">
            <label for="issn">ISBN/ISSN</label>
            <input type="text" v-model="request.issn" id="issn">
         </div>
         <div class="entry pure-control-group">
            <label for="date">Need By Date<span class="required">*</span></label>
            <input type="date" v-model="request.date" id="date" aria-required="true" required="required" aria-placeholder="mm/dd/yyyy">
            <span v-if="hasError('date')" class="error">Need by date is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="cited">Cited In</label>
            <input type="text" v-model="request.cited" id="cited">
         </div>
         <div role="radiogroup" class="entry pure-control-group" aria-labelledby="language-label">
            <label id="language-label">
               Will you accept the item in a language other than English?
               <span class="required">*</span>
            </label>
            <V4Button id="any-language-yes" class="radio" mode="icon" @click="request.anyLanguage='true'" role="radio"
               :aria-checked="(request.anyLanguage=='true').toString()">
               <i v-if="request.anyLanguage=='true'" class="check fas fa-check-circle"></i>
               <i v-else class="check far fa-circle"></i>
               Yes
            </V4Button>
            <V4Button class="radio" mode="icon" @click="request.anyLanguage='false'" role="radio"
               :aria-checked="(request.anyLanguage=='false').toString()">
               <i v-if="request.anyLanguage=='false'" class="check fas fa-check-circle"></i>
               <i v-else class="check far fa-circle"></i>
               No
            </V4Button>
            <span v-if="hasError('anyLanguage')" class="error">Language choice is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="notes">Notes or Special Instructions</label>
            <textarea id="notes" v-model="request.notes"></textarea>
            <span class="note">(ex: missing from shelf, specific edition needed)</span>
         </div>
         <div class="entry pure-control-group">
            <label for="doctype">Preferred pickup location<span class="required">*</span></label>
            <select v-model="request.pickup" id="pickup">
               <option value="">Select a location</option>
               <option v-for="l in pickupLibraries" :key="l.id" :value="l.id">{{l.name}}</option>
            </select>
            <span v-if="hasError('pickup')" class="error">Pickup location is required</span>
         </div>
      </div>
      <div v-if="request.pickup == 'LEO' && (noILLiadAccount==true || leoAddress=='')" class="illiad-prompt ra-box ra-fiy">
         It looks like you haven't specified a LEO delivery location yet. Before we can deliver your item, could you please go
         <a href="https://www.library.virginia.edu/services/ils/ill/" target="_blank">here</a> and let us know where you would like your item to be delivered.
      </div>
      <div class="controls">
         <V4Button mode="tertiary" id="scan-cancel" @click="$emit('canceled')">
            Cancel
         </V4Button>
         <V4Button mode="primary" id="scan-ok" @click="submitClicked" :disabled="buttonDisabled">
            Submit
         </V4Button>
      </div>
   </div>
</template>

<script>
import { mapState, mapGetters } from "vuex"
export default {
   props: {
      prefill: {
         type: Boolean,
         default: false
      },
   },
   data: function()  {
      return {
         error: "",
         errors: [],
         required: ['doctype', 'date', 'title', 'year', 'anyLanguage', 'pickup'],
         request: {
            borrowType: "ITEM",
            doctype: "",
            date: "",
            title: "",
            author: "",
            publisher: "",
            volume: "",
            year: "",
            edition: "",
            issn: "",
            oclc: "",
            cited: "",
            anyLanguage: "",
            notes: "",
            pickup: "",
         }
      }
   },
   computed: {
      ...mapState({
         buttonDisabled: state => state.requests.buttonDisabled,
         preferredPickupLibrary: state => state.preferences.pickupLibrary,
         noILLiadAccount: state => state.user.noILLiadAccount,
         leoAddress: state => state.user.accountInfo.leoAddress,
         details : state => state.item.details,
      }),
      ...mapGetters({
         pickupLibraries: "user/libraries",
         generalFormat: "item/generalFormat"
      })
   },
   methods: {
      async submitClicked() {
         this.errors.splice(0, this.errors.length)
         for (let [key, value] of Object.entries(this.request)) {
            if ( this.required.includes(key) && value == "") {
               this.errors.push(key)
            }
         }
         let d = new Date(this.request.date).toLocaleDateString("en-US")
         if ( d == "Invalid Date" ){
            this.errors.push('date')
         }
         if (this.errors.length > 0) {
            let tgtID = this.errors[0]
            if (tgtID == "anyLanguage") {
               tgtID = "any-language-yes"
            }
            let first = document.getElementById(tgtID)
            if ( first ) {
               first.focus()
            }
         } else {
            await this.$store.dispatch("requests/submitILLiadBorrowRequest", this.request)
            this.$emit('submitted')
         }
      },
      hasError( val) {
         return this.errors.includes(val)
      },
   },
   created() {
      this.request.pickup = this.preferredPickupLibrary.id
      this.$analytics.trigger('Requests', 'REQUEST_STARTED', "illiadBorrow")
      if ( this.prefill ) {
         if ( this.generalFormat == "") {
            return
         }
         if (this.generalFormat == "Book") {
            this.request.doctype = "Book"
         }
         this.request.title = this.details.header.title
         this.request.author = this.details.header.author.value.join("; ")
         let isbnF = this.details.basicFields.find( f => f.name == "isbn")
         if (isbnF) {
            this.request.issn = isbnF.value.join(", ")
         }
      }
   }
}
</script>

<style lang="scss" scoped>
.illiad-prompt {
   margin: 15px;
   a {
      text-decoration: underline !important;
      font-weight: 500;
   }
}
h2 {
   background: var(--uvalib-blue-alt-lightest);
   color: var(--uvalib-text-dark);
   border-width: 1px 0px;
   border-style: solid;
   font-weight: 500;
   padding: 5px;
   border-color: var(--uvalib-blue-alt);
   margin: 0 0 20px 0px;
   font-size: 1.2em;
}
.scan {
   padding: 0 5px;
   margin-bottom: 25px;
   border-bottom: 1px solid var(--uvalib-grey-light);

   button.v4-button.radio {
      margin-right: 15px;
   }
   .required {
      margin-left: 5px;
      font-weight: bold;
      color: var(--uvalib-red-emergency);
   }
   .instruct {
      margin: 0;
      p {
         margin: 5px 0;
      }
      p.addy {
         margin: 10px 25px 20px 25px;
      }
   }
   label {
      font-weight: 500;
      display: block;
   }
   .note {
      font-style: italic;
   }
   input, select, textarea {
      box-sizing: border-box;
      width: 100%;
   }
   .entry {
      margin-bottom: 15px;
   }
   span.error {
      margin: 0px;
      font-weight: normal;
      font-style: italic;
      color: var(--color-error);
      display: block;
   }
}
.controls {
   margin: 10px 10px;
   text-align: right;
}
p.error {
   font-size: 0.9em;
   color: var(--uvalib-red-emergency);
   text-align: center;
   padding: 0;
   margin: 10px;
}
.notice {
   font-size:0.95em;
   padding: 0;
   border: 1px solid var(--uvalib-red-emergency);
   p {
      margin: 10px 15px;
   }
   p.head {
      margin: 0;
      padding: 5px 15px;
      background: var(--uvalib-red-lightest);
      border-bottom: 1px solid var(--uvalib-red-emergency);
   }
}
</style>
