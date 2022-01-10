<template>
   <ReservedPanel v-if="submitted" />
   <div v-else class="course-reserves-request">
      <div v-if="requestList.length==0" class="reserves-content">
         <p>You currently have no items selected for course reserves.</p>
         <p>
            Please return to your <router-link to="/bookmarks">bookmarks</router-link>
            list and select items to be reserved.
         </p>
      </div>
      <div v-else class="reserves-content">
         <V4Spinner  v-if="searching" message="Submitting your request..." v-bind:overlay="true"/>
         <div class="note important">
            Please allow 14 days to process requests
         </div>
         <div class="note">
            If you need to recommend a purchase or have a personal copy to place on reserve, please click ‘Submit Request’ and follow the links on the next page.
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
                  <span v-if="hasError('instructorName')" class="error">* instructor name is required</span>
               </div>
               <div class="pure-control-group">
                  <label for="instructor_email">Instructor Email Address</label>
                  <input v-model="instructorEmail" id="instructor_email" type="email" aria-required="true" required="required">
                  <span v-if="hasError('instructorEmail')" class="error">* instructor email is required</span>
               </div>
            </template>
            <div class="pure-control-group">
               <label for="name">Your Name</label>
               <input v-model="name" id="name" type="text" aria-required="true" required="required">
               <span v-if="hasError('name')" class="error">* name is required</span>
            </div>
            <div class="pure-control-group">
               <label for="email">Your  Email Address</label>
               <input v-model="email" id="email" type="email" aria-required="true" required="required">
               <span v-if="hasError('email')" class="error">* email is required</span>
            </div>
            <div class="pure-control-group">
               <label for="course">Course ID<span class="hint">(e.g. MDST 3840)</span></label>
               <input v-model="course" id="course" type="text" aria-required="true" required="required">
               <span v-if="hasError('course')" class="error">* course ID is required</span>
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
               <span v-if="hasError('semester')" class="error">* semester is required</span>
            </div>
         </div>

         <div class="wrapper" v-if="nonVideoRequests.length > 0">
            <h3 class="video">Non-video format items to be placed on reserve</h3>
            <div class="wrapper-content pure-form pure-form-aligned">
               <div class="item-type-settings">
                  <div class="pure-control-group">
                     <label for="library">Reserve Library</label>
                     <select v-model="library" id="library" name="library" aria-required="true" required="required">
                        <option value="">Please select a location</option>
                        <option value="astr">Astronomy</option>
                        <option value="brown">Brown Science &amp; Engineering</option>
                        <option value="math">Math</option>
                        <option value="clem">Clemons</option>
                        <option value="arts">Fine Arts</option>
                        <option value="law">Law</option>
                        <option value="music">Music</option>
                        <option value="physics">Physics</option>
                     </select>
                     <span v-if="hasError('library')" class="error">* library is required</span>
                  </div>
                  <div class="pure-control-group" v-if="nonVideoRequests.length > 0">
                     <label for="period">Loan Period <span class="hint">(for all items)</span></label>
                     <select @change="itemsPeriodChosen" v-model="period" id="period" name="period" aria-required="true" required="required">
                        <option value="">Please select</option>
                        <option value="3h">3 hours</option>
                        <option value="2d">2 days</option>
                        <option value="na">Not Applicable</option>
                     </select>
                     <span v-if="hasError('period')" class="error">* load period is required</span>
                  </div>
               </div>
               <div class="items">
                  <div class="card" v-for="bm in nonVideoRequests" :key="bm.identifier">
                     <div class="title">{{bm.details.title}}</div>
                     <div class="author">{{bm.details.author}}</div>
                     <dl>
                        <dt>Loan Period</dt>
                        <dd>
                           <select :aria-label="`loan period for ${bm.details.title}`"
                              v-model="bm.period" id="item-period" name="item-period"
                              aria-required="true" required="required"
                           >
                              <option value="">Please select</option>
                              <option value="3h">3 hours</option>
                              <option value="2d">2 days</option>
                              <option value="na">Not Applicable</option>
                           </select>
                        </dd>
                        <dt>Notes</dt>
                        <dd><textarea  :aria-label="`notes for ${bm.details.title}`" v-model="bm.notes" name="item-notes"></textarea></dd>
                     </dl>
                  </div>
               </div>
            </div>
         </div>
         <div class="wrapper" v-if="videoRequests.length > 0">
            <h3>Video-format items to be placed on reserve</h3>
            <div class="wrapper-content pure-form pure-form-aligned">
               <div class="video-note">
                  <b>All video reserve requests will be delivered as streaming resources to your class's Learning Management System.
                     If you have questions about video reserves, please email
                     <a href="mailto:lib-reserves@virginia.edu">lib-reserves@virginia.edu</a>.
                  </b>
               </div>
               <div class="item-type-settings">
                  <div class="entry pure-control-group">
                     <label for="learningManagementSystem">Learning Management System</label>
                     <select v-model="lms" id="learningManagementSystem" aria-required="true" required="required">
                        <option value="">Please indicate in which system your course resides.</option>
                        <option v-for="lmsOption in learningManagementSystems" :key="lmsOption" :value="lmsOption">{{lmsOption}}</option>
                     </select>
                     <span v-if="hasError('lms')" class="error">* LMS is required.</span>
                  </div>
                  <div class="pure-control-group" v-if="lms == 'Other'">
                     <label  for="otherLMS">Please specify other LMS </label>
                        <input v-model="otherLMS" id="otherLMS" aria-required="true" required="required">
                        <span v-if="hasError('otherLMS')" class="error">* LMS is required.</span>
                  </div>
               </div>
               <div class="items">
                  <div class="card" v-for="bm in videoRequests" :key="bm.identifier">
                     <div class="title">{{bm.details.title}}</div>
                     <div class="author">{{bm.details.author}}</div>
                     <dl>
                        <dt class="label">Preferred Audio Language</dt>
                        <dd>
                           <input :aria-label="`preferred audio language for ${bm.details.title}`" v-model="bm.audioLanguage" type="text">
                        </dd>
                        <dt class="label">Subtitles</dt>
                        <dd>
                           <select :aria-label="`include stubtitles for ${bm.details.title}`" v-model="bm.subtitles">
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                           </select>
                        </dd>
                        <dt class="label">Subtitles Language</dt>
                        <dd>
                           <input :aria-label="`stubtitle language for ${bm.details.title}`" v-model="bm.subtitleLanguage" type="text">
                           <span v-if="hasSubtitleError(bm)" class="error">* language is required</span>
                        </dd>
                        <dt>Notes</dt>
                        <dd><textarea :aria-label="`notes for ${bm.details.title}`" v-model="bm.notes" name="item-notes"></textarea></dd>
                     </dl>
                  </div>
               </div>
            </div>
         </div>
         <div class="controls">
            <V4Button mode="tertiary" @click="cancelRequest">Cancel Request</V4Button>
         <V4Button mode="primary" @click="submitRequest">Submit Request</V4Button>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapFields } from 'vuex-map-fields'
import { mapMultiRowFields } from 'vuex-map-fields'
import ReservedPanel from '@/components/requests/panels/ReservedPanel'
export default {
   name: "course-reserves-request",
   data: function() {
      return {
         errors: [],
         learningManagementSystems: ['Blackboard', 'Collab', 'Education Canvas', 'Law Canvas', 'SCPS/ISSP Canvas', 'Other'],
      };
   },
   components: {
      ReservedPanel
   },
   computed: {
      ...mapState({
         submitted: state => state.reserves.submitted,
         requestList: state => state.reserves.requestList,
         searching: state => state.searching,
         reserveRequest: state => state.reserves.request,
         userInfo: state => state.user.accountInfo
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
         'request.period',
         'request.lms',
         'request.otherLMS',
      ]),
      ...mapMultiRowFields('reserves', ['requestList']),
      videoRequests() {
        return this.requestList.filter( r=> r.video === true)
      },
      nonVideoRequests() {
         return this.requestList.filter(  r=> r.video !== true)
      }
   },
   created() {
      this.$store.commit('reserves/setSubmitted', false)
      this.$store.commit("reserves/setRequestingUser", this.userInfo)
   },
   methods: {
      hasSubtitleError( item) {
         if (this.errors.includes("subtitleLanguage") == false) return false
         return (item.subtitles == "yes" && item.subtitleLanguage == "")
      },
      hasError( val) {
         return this.errors.includes(val)
      },
      cancelRequest() {
         this.$router.push("/bookmarks")
      },
      submitRequest() {
         this.errors.splice(0, this.errors.length)
         let proxyRequest = this.reserveRequest.onBehalfOf == "yes"
         for (let [key, value] of Object.entries(this.reserveRequest)) {
            console.log(key+"=["+value+"]")
            // skip lonn/library if there are no non-video items
            if ( (key == "period" || key == "library") && this.nonVideoRequests.length == 0) continue

            // skip lms if there are no video items. skip other if lms is not other
            if ( (key == "lms" || key == "otherLMS") && this.videoRequests.length == 0) continue
            if (  key == "otherLMS" && this.videoRequests.length > 0 ) {
               if ( this.reserveRequest.lms != "Other") {
                  continue
               }
            }

            if ( proxyRequest == false && (key=="instructorName" || key=="instructorEmail") ) continue

            // all other values are required
            if (value == "") {
               console.log("ERROR MISSING "+key)
               this.errors.push(key)
            }
         }

         let subtitleError = false
         this.videoRequests.forEach( r => {
            if (r.subtitles == "yes" && r.subtitleLanguage == "") {
               subtitleError = true
            }
         })
         if (subtitleError) {
            this.errors.push("subtitleLanguage")
         }
         if ( this.errors.length == 0) {
            this.$store.dispatch("reserves/createReserves")
         } else {
            this.$store.commit("system/setError", "Some required fields are missing")
            var scrollStep = -window.scrollY / (500 / 10),
            scrollInterval = setInterval(()=> {
               if ( window.scrollY != 0 ) {
                  window.scrollBy( 0, scrollStep )
               } else {
                  clearInterval(scrollInterval)
               }
            },10)
         }
      },
      itemsPeriodChosen() {
         this.$store.commit("reserves/updateReservedItemsPeriod")
      }
   }
}
</script>

<style lang="scss" scoped>
div.reserved {
   position: relative;
   margin: 25px auto 50px auto;
   width:40%;
   color: var(--uvalib-text);
   text-align: left;
}
.course-reserves {
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
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
   font-weight: bold;
   margin: 15px;
}
.form {
   margin: 15px;
   padding-top: 15px;
   text-align: left;
   margin-bottom: 40px;
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
.video-note {
   text-align: left;
   padding: 10px 10px 0 10px;
}
div.items {
   display: flex;
   flex-flow: row wrap;
   align-items: stretch;
   justify-content: flex-start;
   padding: 15px;
}
div.card {
   text-align: left;
   padding: 10px;
   font-size: 0.8em;
   border: 1px solid var(--uvalib-grey-light);
   margin: 10px;
   display: inline-block;
   max-width: 275px;
   background: white;
   flex-grow: 1;
   box-shadow: $v4-box-shadow-light;
}
div.card .title {
   font-size:1.1em;
   font-weight: bold;
}
div.card .author {
   margin: 5px 0 10px 10px;
}
div.controls {
   text-align: right;
   margin: 15px;
}
div.wrapper {
   background: white;
   margin-bottom: 30px;
   border: 1px solid var(--uvalib-grey-light);

   h3 {
      padding: 10px;
      text-align: left;
      margin: 0;
      font-size: 1em;
      background: var(--uvalib-grey-lightest);
      color: var(--uvalib-text);
      border-bottom: 1px solid var(--uvalib-grey-light);
   }
   .item-type-settings {
      text-align: left;
      margin-top: 20px;
      border-bottom: 1px solid var(--uvalib-grey-light);
      padding-bottom: 10px;
   }
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
   margin-left: 10px;
   font-weight: bold;
   font-style: italic;
   color: var(--color-error);
}
</style>

