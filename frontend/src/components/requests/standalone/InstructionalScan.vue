<template>
   <div class="request-panel">
      <h2>Instructional Scanning Request</h2>
      <div class="scan pure-form">
         <div class="entry pure-control-group">
            <label for="course-info">Course Information</label>
            <textarea id="course-info" v-model="request.course"></textarea>
            <span class="note">Please supply the Course Instructor, Course Name, Number, Section and Semester.</span>
            <span v-if="hasError('course')" class="error">* coure information is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="date">Need By Date</label>
            <input type="text" v-model="request.date" id="date" aria-required="true" required="required">
            <span v-if="hasError('date')" class="error">* date is required</span>
         </div>
         <div role="radiogroup" class="entry pure-control-group" aria-labelledby="personal-label">
            <label class="inline" id="personal-label">Is this item a Personal Copy?</label>
            <V4Button class="radio" mode="icon" @click="request.personalCopy='true'" role="radio" 
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
            <div class="instruct">
               <p>Personal copies can be dropped off at a Library Circulation Desk, deposited in a Book Drop, or sent via campus mail to:</p>
               <p class="addy">
                  Instructional Scanning Services<br/>
                  PO BOX 400109
               </p>
               <p>
                  <b>** Please include a note with instructor name and course information in the item when dropping off a personal copy.</b>
               </p>
            </div>
            <span v-if="hasError('date')" class="error">* yes or no is required</span>
         </div>
         <!-- *
         Article or Chapter Title* (one chapter or article per request, please)
         Article or Chapter Author*
         Title of work (Journal, Book, Conference Proceedings or Newspaper)*
         Volume
         Issue
         Month
         Year*
         Pages*
         ISBN/ISSN
         OCLC Number
         Will you accept the item in a language other than English? (yes or no)** -->    
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
      <p class="error" v-if="error">{{error}}</p>
      <div class="controls">
         <V4Button mode="tertiary" id="scan-cancel" @click="$emit('canceled')">
            Cancel
         </V4Button>
         <V4Button mode="primary" id="scan-ok" @click="submitClicked" :focusNextOverride="true" @tabnext="nextTabOK">
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
         required: ['course', 'date'],
         request: {
            course: "",
            date: "",
            personalCopy: "",
         }
      }
   },
   methods: {
      opened() {
         // TODO
      },
      async submitClicked() {
         // TODO
      },
      nextTabOK() {
         this.$refs.scanmodal.lastFocusTabbed()
      },
      backTabInput() {
         this.$refs.scanmodal.firstFocusBackTabbed()
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
   button.v4-button.radio {
      margin-left: 10px;
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
   label.inline { 
      font-weight: 500;
      display: inline-block;
      margin-right: 10px;
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
      margin-left: 10px;
      font-weight: bold;
      font-style: italic;
      color: var(--color-error);
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
   font-size:0.9em;
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
