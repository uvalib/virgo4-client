<template>
   <div class="request-panel">
      <h2>ILL Borrow A/V Request</h2>
      <div class="scan pure-form">
         <div class="entry pure-control-group">
            <label for="title">Title<span class="required">*</span></label>
            <input type="text" v-model="request.title" id="title" aria-required="true" required="required">
            <span class="note">All audio/video materials not owned by UVA will be reviewed for purchase before being requested via ILL.</span>
            <span v-if="hasError('title')" class="error">Article or chapter title is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="author">Artist/Composer </label>
            <input type="text" v-model="request.author" id="author">
         </div>
         <div class="entry pure-control-group">
            <label for="year">Year</label>
            <input type="text" v-model="request.year" id="year">
         </div>
         <div class="entry pure-control-group">
            <label for="format">Format</label>
            <select v-model="request.format" id="format">
               <option value="Any">Any</option>
               <option value="CD">CD</option>
               <option value="LP">LP</option>
               <option value="DVD">DVD</option>
               <option value="Blu-Ray">Blu-Ray</option>
               <option value="VHS">VHS</option>
               <option value="LD">LD</option>
            </select>
         </div>
         <div class="entry pure-control-group">
            <label for="date">Need By Date<span class="required">*</span></label>
            <input type="date" v-model="request.date" id="date" aria-required="true" required="required" aria-placeholder="mm/dd/yyyy">
            <span v-if="hasError('date')" class="error">Need by date is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="notes">Notes or Special Instructions</label>
            <textarea id="notes" v-model="request.notes"></textarea>
            <span class="note">(ex: will accept other formats, library-use only okay)</span>
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
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   data: function()  {
      return {
         error: "",
         errors: [],
         required: ['date', 'title', 'pickup'],
         request: {
            borrowType: "AV",
            date: "",
            title: "",
            author: "",
            year: "",
            format: "Any",
            notes: "",
            pickup: "",
         }
      }
   },
   computed: {
      ...mapState({
         buttonDisabled: state => state.requests.buttonDisabled,
         preferredPickupLibrary: state => state.preferences.pickupLibrary,
      }),
      ...mapGetters({
         pickupLibraries: "user/libraries",
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
   }
}
</script>

<style lang="scss" scoped>
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
