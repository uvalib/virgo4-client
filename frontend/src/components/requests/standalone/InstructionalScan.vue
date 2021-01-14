<template>
   <div class="request-panel">
      <h2>Instructional Scanning Request</h2>
      <div class="scan pure-form">
         <div class="entry pure-control-group">
            <label for="course">Course Information<span class="required">*</span></label>
            <textarea id="course" v-model="request.course"></textarea>
            <span class="note">Please supply the Course Instructor, Course Name, Number, Section and Semester</span>
            <span v-if="hasError('course')" class="error">Course information is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="date">Need By Date<span class="required">*</span></label>
            <input type="date" v-model="request.date" id="date" aria-required="true" required="required" aria-placeholder="mm/dd/yyyy">
            <span v-if="hasError('date')" class="error">Date is required</span>
         </div>
         <div role="radiogroup" class="entry pure-control-group" aria-labelledby="personal-label">
            <label id="personal-label">Will you be providing a copy of this material for the Library to scan?</label>
            <V4Button id="personal-yes" class="radio" mode="icon" @click="request.personalCopy='true'" role="radio"
               :aria-checked="(request.personalCopy=='true').toString()">
               <i v-if="request.personalCopy=='true'" class="check fas fa-check-circle"></i>
               <i v-else class="check far fa-circle"></i>
               Yes
            </V4Button>
            <V4Button class="radio" mode="icon" @click="request.personalCopy='false'" role="radio"
               :aria-checked="(request.personalCopy=='false').toString()">
               <i v-if="request.personalCopy=='false'" class="check fas fa-check-circle"></i>
               <i v-else class="check far fa-circle"></i>
               No
            </V4Button>
            <div class="instruct" v-if="request.personalCopy=='true'">
               <p>Personal copies can be dropped off at a Library Circulation Desk, deposited in a Book Drop, or sent via campus mail to:</p>
               <p class="addy">
                  Instructional Scanning Services<br/>
                  PO BOX 400109
               </p>
               <p>
                  <b>** Please include a note with instructor name and course information in the item when dropping off a personal copy.</b>
               </p>
            </div>
         </div>
         <div class="entry pure-control-group">
            <label for="title">Article or Chapter Title<span class="required">*</span></label>
            <input type="text" v-model="request.title" id="title" aria-required="true" required="required">
            <span class="note">One article or chapter per request, please</span>
            <span v-if="hasError('title')" class="error">Article or chapter title is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="author">Article or Chapter Author<span class="required">*</span></label>
            <input type="text" v-model="request.author" id="author" aria-required="true" required="required">
            <span v-if="hasError('author')" class="error">Author is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="work">Title of work<span class="required">*</span></label>
            <input type="text" v-model="request.work" id="work" aria-required="true" required="required">
            <span class="note">Journal, Book, Conference Proceedings or Newspaper</span>
            <span v-if="hasError('title')" class="error">Title of work is required</span>
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
            <input type="text" v-model="request.year" id="year">
            <span v-if="hasError('year')" class="error">Year is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="pages">Pages<span class="required">*</span></label>
            <input type="text" v-model="request.pages" id="pages" aria-required="true" required="required">
            <span class="note">(ex: 1-15)</span>
            <span v-if="pageLengthError" class="error">Please limt page information to 25 characters</span>
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
      </div>
      <ILLCopyrightNotice type="instruction" />
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
import ILLCopyrightNotice from '../ILLCopyrightNotice.vue';
export default {
   components: {ILLCopyrightNotice},
   data: function()  {
      return {
         error: "",
         pageLengthError: false,
         errors: [],
         required: ['course', 'date', 'title', 'author', 'work', 'pages', 'anyLanguage', 'year'],
         request: {
            scanType: "INSTRUCTIONAL",
            course: "",
            date: "",
            personalCopy: "",
            title: "",
            author: "",
            work: "",
            volume: "",
            issue: "",
            month: "",
            year: "",
            pages: "",
            issn: "",
            oclc: "",
            anyLanguage: ""
         }
      }
   },
   computed: {
      ...mapState({
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
         let d = new Date(this.request.date).toLocaleDateString("en-US")
         if ( d == "Invalid Date" ){
            this.errors.push('date')
         }
         console.log(this.errors)
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
            this.pageLengthError =  (this.request.pages.length > 25)
            if ( this.pageLengthError) {
               let first = document.getElementById("pages")
               if ( first ) {
                  first.focus()
               }
            } else {
               await this.$store.dispatch("requests/submitILLiadScanRequest", this.request)
               this.$emit('submitted')
            }
         }
      },
      hasError( val) {
         return this.errors.includes(val)
      },
   },
   created() {
      this.$analytics.trigger('Requests', 'REQUEST_STARTED', "illiadScan")
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
</style>
