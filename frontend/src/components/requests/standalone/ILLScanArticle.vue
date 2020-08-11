<template>
   <div class="request-panel">
      <h2>ILL Scan Chapter/Article</h2>
      <div class="scan pure-form">
         <div class="entry pure-control-group">
            <label for="doctype">What would you like to have scanned?<span class="required">*</span></label>
            <select v-model="request.doctype" id="doctype">
               <option value="">Make a selection</option>
               <option value="Book Chapter">Book Chapter</option>
               <option value="Article">Article</option>
               <option value="Law Cite Check">Law Cite Check</option>
            </select>
            <span v-if="hasError('doctype')" class="error">A selection is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="title">Book or Journal Title<span class="required">*</span></label>
            <input type="text" v-model="request.title" id="title" aria-required="true" required="required">
            <span v-if="hasError('title')" class="error">Book or journal title is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="article">Chapter or Article Title<span class="required">*</span></label>
            <input type="text" v-model="request.article" id="article" aria-required="true" required="required">
            <span v-if="hasError('article')" class="error">Chapter or article title is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="author">Chapter or Article Author</label>
            <input type="text" v-model="request.author" id="author">
         </div>
         <div class="entry pure-control-group">
            <label for="volume">Volume</label>
            <input type="text" v-model="request.volume" id="volume">
         </div>
         <div class="entry pure-control-group">
            <label for="issue">Issue</label>
            <input type="text" v-model="request.issue" id="issue">
         </div>
         <div class="entry pure-control-group">
            <label for="month">Month</label>
            <input type="text" v-model="request.month" id="month">
         </div>
         <div class="entry pure-control-group">
            <label for="year">Year<span class="required">*</span></label>
            <input type="text" v-model="request.year" id="year" aria-required="true" required="required">
            <span v-if="hasError('year')" class="error">Year is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="pages">Pages<span class="required">*</span></label>
            <input type="text" v-model="request.pages" id="pages" aria-required="true" required="required">
            <span v-if="hasError('pages')" class="error">Pages are required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="issn">ISBN/ISSN</label>
            <input type="text" v-model="request.issn" id="issn">
         </div>
         <div class="entry pure-control-group">
            <label for="oclc">OCLC Number</label>
            <input type="text" v-model="request.oclc" id="oclc">
         </div>
         <div class="entry pure-control-group">
            <label for="date">Need By Date<span class="required">*</span></label>
            <input type="text" v-model="request.date" id="date" aria-required="true" required="required">
            <span v-if="hasError('date')" class="error">Need by date is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="notes">Notes or Special Instructions</label>
            <textarea id="notes" v-model="request.notes"></textarea>
            <span class="note">(ex: missing from shelf, color copies)</span>
         </div>
      </div>
      <div class="notice">
         <p class="head">
            <strong>Important Copyright Information<br/>
            NOTICE OF WARNING CONCERNING COPYRIGHT RESTRICTIONS
            </strong>
         </p>
         <p>
            The copyright law of the United States (Title 17, United States Code) governs the making of
            photocopies or other reproductions of copyrighted materials.
         </p>
         <p>
            Under certain conditions specified in the law, libraries and archives are authorized to
            furnish a photocopy or other reproduction. One of these specified conditions is that the
            photocopy or reproduction is not to be "used for any purpose other than private study, scholarship, or research".
            If a user makes a request for, or later uses, a photocopy or reproduction for purposes in excess of "fair use",
            that user may be liable for copyright infringement.
         </p>
         <p>
            This institution reserves the right to refuse to accept a copying order if, in its judgment,
            fulfillment of the order would involve violation of copyright law.
         </p>
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
export default {
   data: function()  {
      return {
         error: "",
         errors: [],
         required: ['doctype', 'title', "article", "year", "pages", "date"],
         request: {
            scanType: "ARTICLE",
            doctype: "",
            title: "",
            article: "",
            author: "",
            volume: "",
            issue: "",
            month: "",
            year: "",
            pages: "",
            issn: "",
            oclc: "",
            notes: "",
            date: ""
         }
      }
   },
   computed: {
      ...mapState({
         sysError: state => state.system.error,
         buttonDisabled: state => state.requests.buttonDisabled,
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
            await this.$store.dispatch("requests/submitILLiadScanRequest", this.request)
            if ( this.sysError == "" || this.sysError == null) {
               this.$emit('submitted')
            }
         }
      },
      hasError( val) {
         return this.errors.includes(val)
      },
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
   margin: 10px 0;
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
