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
            <input type="text" v-model="request.date" id="date" aria-required="true" required="required">
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
            <label for="year">Year</label>
            <input type="text" v-model="request.year" id="year">
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
      <div class="notice">
         <p class="head">
            <strong>Important Copyright Information<br/>
            NOTICE OF WARNING CONCERNING COPYRIGHT RESTRICTIONS
            </strong>
         </p>
         <p>
            N.B. The Fair Use guidelines for Copyright Law are broad in scope and can be difficult to interpret. 
            For this reason, the Library has come up with the following recommendations:
         </p>
         <p>
            Materials which may be scanned for the Collab for a course without obtaining copyright permissions:
            <ul>
               <li>One chapter from a book</li>
               <li>One article from a journal issue</li>
               <li>Government publications</li>
               <li>Exams, homework solutions, lecture notes, student papers, etc.</li>
               <li>Anything for which you own the copyright</li>
               <li>Anything in the public domain</li>
            </ul>
         </p>
         <p>
            If you wish to go outside of these guidelines, or if you wish to use materials for more than one semester, 
            copyright permission may be sought from the publisher of the journal or book. The Copyright Clearance Center
            offers a quick and convenient method of obtaining permission. More information on the University's copyright 
            policy is available. The copyright law of the United States (Title 17, US Code) governs the making of photocopies 
            or other reproduction of copyrighted material. Under certain conditions specified in the law, libraries and 
            archives are authorized to furnish a photocopy or other reproduction. One of these specified conditions is that the 
            photocopy or reproduction is not to be used for any other purpose other than private study, scholarship, or research. 
            If a user makes a request for, or later uses, a photocopy or reproduction for purposes in excess of "fair use," that user 
            may be liable for copyright infringement. This institution reserves the right to refuse to accept a copying order if, 
            in its judgment, fulfillment of the order would involve violation of copyright law.
         </p>
         <p>
            SUBMISSION OF THIS REQUEST IS CONFIRMATION THAT you understand the University's Policy on Copying of Copyrighted Material, 
            and that the material requested for reserve either complies with these guidelines or it may be copied because you have 
            received written permission from the copyright holder.
         </p>
         <p>
            Instructors are responsible for compliance with copyright law.    
         </p>
      </div>
      <div class="controls">
         <V4Button mode="tertiary" id="scan-cancel" @click="$emit('canceled')">
            Cancel
         </V4Button>
         <V4Button mode="primary" id="scan-ok" @click="submitClicked">
            Submit
         </V4Button>
      </div>
   </div>
</template>

<script>
export default {
   data: function()  {
      return {
         error: "",
         errors: [],
         required: ['course', 'date', 'title', 'author', 'work', 'pages', 'anyLanguage'],
         request: {
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
            await this.$store.dispatch("requests/submitStandaloneInstructionalScan", this.request)
            this.$emit('submitted')
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