<template>
  <div class='course-reserves'>
    <h2>Video Reserve Request</h2>

    <div class="note important">
        Please allow 14 days to process requests.
    </div>
    <div class="pure-form pure-form-aligned form">
      <div class="pure-control-group">
          <label for="behalf_of">Is this request on behalf of an instructor?</label>
          <select v-model="onBehalfOf" id="behalf_of" name="behalf_of">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
      </div>
      <template v-if="onBehalfOf=='yes'">
          <div class="pure-control-group">
            <label for="instructor_name">Instructor Name</label>
            <input v-model="instructorName" name="instructor_name" id="instructor_name" type="text" aria-required="true" required="required">
            <p v-if="hasError('instructorName')" class="error">* instructor name is required</p>
          </div>
          <div class="pure-control-group">
            <label for="instructor_email">Instructor Email Address</label>
            <input v-model="instructorEmail" id="instructor_email" type="email" aria-required="true" required="required">
            <p v-if="hasError('instructorEmail')" class="error">* instructor email is required</p>
          </div>
      </template>
      <div class="pure-control-group">
          <label for="name">Your Name</label>
          <input v-model="name" id="name" type="text" aria-required="true" required="required">
          <p v-if="hasError('name')" class="error">* name is required</p>
      </div>
      <div class="pure-control-group">
          <label for="email">Your  Email Address</label>
          <input v-model="email" id="email" type="email" aria-required="true" required="required">
          <p v-if="hasError('email')" class="error">* email is required</p>
      </div>
      <div class="pure-control-group">
          <label for="course">Course ID<span class="hint">(e.g. MDST 3840)</span></label>
          <input v-model="course" id="course" type="text" aria-required="true" required="required">
          <p v-if="hasError('course')" class="error">* course ID is required</p>
      </div>
      <div class="pure-control-group">
          <label for="semester">Semester</label>
          <select v-model="semester" id="semester" name="semester" aria-required="true" required="required">
            <option value="">Please select a semester</option>
            <option value="Fall">Fall</option>
            <option value="January">January</option>
            <option value="Spring">Spring</option>
            <option value="Summer I">Summer I</option>
            <option value="Summer II">Summer II</option>
            <option value="Summer III">Summer III</option>
          </select>
          <p v-if="hasError('semester')" class="error">* semester is required</p>
      </div>

      <div class="entry pure-control-group">
         <label for="learningManagementSystem">Learning Management System</label>
         <select v-model="lms" id="learningManagementSystem" aria-required="true" required="required">
            <option value="">Please indicate in which system your course resides.</option>
            <option v-for="lmsOption in learningManagementSystems" :key="lmsOption" :value="lmsOption">{{lmsOption}}</option>
         </select>
         <p v-if="hasError('lms')" class="error">* learning management system is required.</p>
      </div>
      <div class="pure-control-group" v-if="lms == 'Other'">
         <label  for="otherLMS">Please specify other LMS </label>
         <input v-model="otherLMS" id="otherLMS" aria-required="true" required="required">
      </div>
      <div class="video-note">
        All video reserve requests will be delivered as streaming resources to your class’s Learning Management System.
          If you have questions about video reserves, please email
          <a href="mailto:lib-reserves@virginia.edu">lib-reserves@virginia.edu</a>.
      </div>


      <dl>
        <template v-if="itemOptions.length > 1" >
          <dt class="label">Select the item you want:</dt>
          <dd>
            <select v-model="selectedVideo" aria-required="true" required="required">
               <option :value="{}">Select an item</option>
               <option v-for="l in itemOptions" :key="l.barcode" :value="l">{{l.label}}</option>
            </select>
             <p class="error" v-if="hasError('barcode')">* an item selection is required.</p>
          </dd>
        </template>

        <template v-if="!streamingReserve">
         <dt class="label">Preferred audio language</dt>
         <dd>
               <input id="audio_language" :aria-label="`preferred audio language`" v-model="audioLanguage" type="text">
         </dd>
         <dt class="label">Include subtitles?</dt>
         <dd>
               <select :aria-label="`include stubtitles?`" v-model="subtitles">
               <option value="yes">Yes</option>
               <option value="no">No</option>
               </select>
         </dd>
         <dt class="label">Subtitles language</dt>
         <dd>
               <input :aria-label="`subtitle language desired`" id="subtitle_language" v-model="subtitleLanguage" type="text">
               <p v-if="hasError('subtitleLanguage')" class="error">* language is required</p>
         </dd>
        </template>
        <dt>Notes</dt>
        <dd><textarea :aria-label="`notes for this request`" v-model="notes" name="item-notes"></textarea></dd>
      </dl>

      <div class="controls">
        <V4Button mode="primary" class="request-button" @click="submit"  :disabled=buttonDisabled :class="{disabled: buttonDisabled}">Submit Request</V4Button>
      </div>

    </div>
  </div>
</template>
<script>
import { mapFields } from "vuex-map-fields"
import { mapState } from "vuex"
export default {
   data: function() {
      return {
         errors: [],
         selectedVideo: {},
         audioLanguage: "English" ,
         subtitles: "no",
         subtitleLanguage: "",
         notes: "",
         learningManagementSystems: ['Blackboard', 'Collab', 'Education Canvas', 'Law Canvas', 'SCPS/ISSP Canvas', 'Other'],
         fieldMap: {
            "instructorName": "instructor_name",
            "instructorEmail": "instructor_email",
            "name": "name",
            "email": "email",
            "course": "course",
            "semester": "semester",
            "subtitleLanguage": "subtitle_language",
            "lms": "lms",
         }
      };
   },
   computed: {
      ...mapState({
        itemOptions: state => state.requests.activeOption.item_options,
        streamingReserve: state => state.requests.activeOption.streaming_reserve,
        reserveRequest: state => state.reserves.request,
        userInfo: state => state.user.accountInfo,
        itemDetails: state => state.item.details,
        buttonDisabled: state => state.requests.buttonDisabled
      }),
      ...mapFields('reserves',[
         'request.onBehalfOf',
         'request.instructorName',
         'request.instructorEmail',
         'request.name',
         'request.email',
         'request.course',
         'request.semester',
         'request.library',
         'request.lms',
         'request.otherLMS'
      ]),
   },
   created() {
      this.$store.commit("reserves/setRequestingUser", this.userInfo)
      if(this.itemOptions.length == 1){
        this.selectedVideo = this.itemOptions[0]
      }
      setTimeout( ()=> {
         document.getElementById("behalf_of").focus()
      }, 100)
   },
   methods: {
      // items() {
      //   let items = this.itemOptions
      //   // id and name are required in V4Select
      //   for(let i in items) {
      //     items[i].id = items[i].barcode
      //     items[i].name = items[i].label
      //     items[i].callNumber = items[i].label
      //   }
      //   return items
      // },

      hasError( val) {
         return this.errors.includes(val)
      },
      submit() {
         this.errors.splice(0, this.errors.length)
         let proxyRequest = this.reserveRequest.onBehalfOf == "yes"
         for (let [key, value] of Object.entries(this.reserveRequest)) {
            if ( proxyRequest == false && (key=="instructorName" || key=="instructorEmail")
            || (key=="period" || key=="library")) continue
            if (key=="otherLMS") continue
            if (value == "") {
              this.errors.push(key)
            }
         }
         if (this.lms == "Other" && this.otherLMS == "" ){
            this.errors.push('lms')
         }
         if (this.subtitles == "yes" && this.subtitleLanguage == "") {
            this.errors.push("subtitleLanguage")
         }

         if ( this.itemOptions.length > 1 && !this.selectedVideo.barcode) {
            this.errors.push("barcode")
         }

        if ( this.errors.length == 0) {
            this.selectedVideo.pool = this.itemDetails.source
            this.selectedVideo.catalogKey = this.itemDetails.identifier
            this.selectedVideo.title = this.itemDetails.header.title
            this.selectedVideo.audioLanguage = this.audioLanguage
            this.selectedVideo.subtitles = this.subtitles
            this.selectedVideo.subtitleLanguage = this.subtitleLanguage
            this.selectedVideo.notes = this.notes
            this.selectedVideo.isVideo = true
            this.$store.dispatch("reserves/createVideoReserve", this.selectedVideo)
         } else {
            let err = this.errors[0]
            let eleID = this.fieldMap[err]
            let first = document.getElementById(eleID)
            if ( first ) {
               first.focus()
            }
         }
      },
   }
}
</script>

<style lang="scss" scoped>
.course-reserves {
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
.working {
   text-align: center;
   font-size: 1.25em;
}
.working img {
   margin: 30px 0;
}
.reserves-content {
   width: 80%;
   margin: 0 auto;
   min-height: 250px;
}
@media only screen and (min-width: 768px) {
   div.reserves-content  {
       width: 80%;
   }
}
@media only screen and (max-width: 768px) {
   div.reserves-content  {
       width: 95%;
   }
   div.reserves-content input, div.reserves-content select {
      width: 100%;
   }
   div.reserves-content label {
      width: 100% !important;
   }
}
div.note {
   margin: 15px;
   text-align: center;
}
.video-note, .note.important {
   font-size: 1.1em;
}
.form {
   margin: 15px;
   padding-top: 15px;
   text-align: left;
}
input, select {
   width: 50%;
}
div.reserves-content label {
   margin-right: 15px;
   font-weight: bold;
   color: #444;
   width: 25%;
}
span.hint {
   font-weight: 100;
   font-size: 0.8em;
   display: block;
}
h3 {
   padding: 5px 10px;
   text-align: left;
   background-color: var(--color-brand-blue);
   color: white;
   margin: 0;
}
.video-note {
   text-align: left;
   padding: 30px 0;
}
div.controls {
   text-align: right;
   margin: 15px;
}
div.wrapper {
   background: var(--uvalib-grey-lightest);
   margin-bottom: 20px;
}
div.wrapper-content {
 border: 1px solid var(--uvalib-grey-light);
}
dl {
   margin: 0;
   display: inline-grid;
   grid-template-columns: 1fr 1.5fr;
   grid-column-gap: 10px;
}
dt {
   margin: 0 0 15px 0;
   font-weight: bold;
   text-align: right;
   word-break: break-word;
   -webkit-hyphens: auto;
   -moz-hyphens: auto;
   hyphens: auto;
}
dd {
   margin: 0 0 15px 0;
   vertical-align: top;
}
dd input, dd select, dd textarea  {
   border: 1px solid #ccc;
   padding: 3px 6px;
   border-radius: 3px;
   box-sizing: border-box;
   width: 100%;
}
span.error {
   margin-left: 30%;
   font-weight: bold;
   font-style: italic;
   color: var(--color-error);
}
</style>