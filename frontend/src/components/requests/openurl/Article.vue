<template>
   <div class="request-wrap">
      <div class="request-content pure-form">
         <div class="entry pure-control-group">
            <label for="title">Journal Title<span class="required">*</span></label>
            <input type="text" v-model="title" id="title" aria-required="true" required="required">
            <span v-if="hasError('title')" class="error">Journal Title is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="article">Article Title<span class="required">*</span></label>
            <input type="text" v-model="article" id="article" aria-required="true" required="required">
            <span v-if="hasError('article')" class="error">Article Title is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="author">Article Author</label>
            <input type="text" v-model="author" id="author">
         </div>
         <div class="entry pure-control-group">
            <label for="volume">Volume</label>
            <input type="text" v-model="volume" id="volume">
         </div>
         <div class="entry pure-control-group">
            <label for="issue">Issue</label>
            <input type="text" v-model="issue" id="issue">
         </div>
         <div class="entry pure-control-group">
            <label for="month">Month</label>
            <input type="text" v-model="month" id="month">
         </div>
         <div class="entry pure-control-group">
            <label for="year">Year<span class="required">*</span></label>
            <input type="text" v-model="year" id="year" aria-required="true" required="required">
            <span v-if="hasError('year')" class="error">Year is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="pages">Pages<span class="required">*</span></label>
            <input type="text" v-model="pages" id="pages">
            <span class="note">(ex: 1-15)</span>
            <span v-if="pageLengthError" class="error">Please limt page information to 25 characters</span>
             <span v-if="hasError('pages')" class="error">Pages are required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="issn">ISSN/ISBN</label>
            <input type="text" v-model="issn" id="issn">
         </div>
         <div class="entry pure-control-group">
            <label for="oclc">OCLC Number</label>
            <input type="text" v-model="oclc" id="oclc">
         </div>
         <div class="entry pure-control-group">
            <label for="notes">Notes or Special Instructions</label>
            <textarea id="notes" v-model="notes"></textarea>
            <span class="note">(ex: color copies)</span>
         </div>
         <div class="entry pure-control-group">
            <label for="bydate">Need By Date<span class="required">*</span></label>
            <input type="text" v-model="bydate" id="bydate">
            <span v-if="hasError('bydate')" class="error">Need By Date is required</span>
         </div>
      </div>
      <div class="controls">
         <V4Button mode="tertiary" @click="$emit('canceled')">
            Cancel
         </V4Button>
         <V4Button mode="primary" @click="submitClicked" :disabled="buttonDisabled">
            Submit
         </V4Button>
      </div>
   </div>
</template>
<script>
import { mapFields } from "vuex-map-fields"
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   data: () => {
      return {
         errors: [],
         pageLengthError: false,
         required: ['title', 'article', 'year', 'pages', 'bydate']
      }
   },
   computed: {
      ...mapState({
         sysError: state => state.system.error,
         buttonDisabled: state => state.requests.buttonDisabled,
         request: state => state.requests.openurl,
      }),
      ...mapGetters({
         pickupLibraries: "user/libraries",
      }),
      ...mapFields('requests',[
         'buttonDisabled',
         'openurl.title',
         'openurl.article',
         'openurl.author',
         'openurl.volume',
         'openurl.issue',
         'openurl.month',
         'openurl.year',
         'openurl.pages',
         'openurl.issn',
         'openurl.oclc',
         'openurl.bydate',
         'openurl.notes',
      ]),
   },
   created() {
      setTimeout(() => {
         document.getElementById("title").focus()
      }, 150);
   },
   methods: {
      hasError(val) {
         return this.errors.includes(val)
      },
      submitClicked() {
         this.errors.splice(0, this.errors.length)
         for (let [key, value] of Object.entries(this.request)) {
            if ( this.required.includes(key) && value == "") {
               this.errors.push(key)
            }
         }

         if (this.errors.length > 0) {
            let tgtID = this.errors[0]
            let first = document.getElementById(tgtID)
            if ( first ) {
               first.focus()
            }
         } else {
            this.pageLengthError =  (this.scan.pages.length > 25)
            if ( this.pageLengthError) {
               let tgtID = `pages`
               let first = document.getElementById(tgtID)
               if ( first ) {
                  first.focus()
               }
            } else {
               this.$emit("submitted")
            }
         }

      },
   }
};
</script>
<style lang="scss" scoped>
.request-content {
   width: 100%;
   margin: 0;
   text-align: left;
   margin-bottom: 25px;
   .required {
      margin-left: 5px;
      font-weight: bold;
      color: var(--uvalib-red-emergency);
   }
   button.v4-button.radio {
      margin-right: 15px;
      margin-bottom: 5px;
   }
   label {
      font-weight: 500;
      display: block;
   }
   input, select, textarea {
      box-sizing: border-box;
      width: 100%;
   }
   .note {
      font-style: italic;
      display: block;
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
</style>
