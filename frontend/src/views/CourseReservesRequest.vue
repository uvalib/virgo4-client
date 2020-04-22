<template>
   <div class="course-reserves-request">
      <h1>Course Reserves Request</h1>
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
                  <input v-model="instructorName" name="instructor_name" id="instructor_name" type="text">
                  <span v-if="hasError('instructorName')" class="error">* instructor name is required</span>
               </div>
               <div class="pure-control-group">
                  <label for="instructor_email">Instructor Email Address</label>
                  <input v-model="instructorEmail" id="instructor_email" type="email">
                  <span v-if="hasError('instructorEmail')" class="error">* instructor email is required</span>
               </div>
            </template>
            <div class="pure-control-group">
               <label for="name">Your Name</label>
               <input v-model="name" id="name" type="text">
               <span v-if="hasError('name')" class="error">* name is required</span>
            </div>
            <div class="pure-control-group">
               <label for="email">Your  Email Address</label>
               <input v-model="email" id="email" type="email">
               <span v-if="hasError('email')" class="error">* email is required</span>
            </div>
            <div class="pure-control-group">
               <label for="course">Course ID<span class="hint">(e.g. MDST 3840)</span></label>
               <input v-model="course" id="course" type="text">
               <span v-if="hasError('course')" class="error">* course ID is required</span>
            </div>
            <div class="pure-control-group">
               <label for="semester">Semester</label>
               <select v-model="semester" id="semester" name="semester">
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
            <div class="pure-control-group">
               <label for="library">Reserve Library</label>
               <select v-model="library" id="library" name="library">
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
               <select @change="itemsPeriodChosen" v-model="period" id="period" name="period">
                  <option value="">Please select</option>
                  <option value="3h">3 hours</option>
                  <option value="2d">2 days</option>
                  <option value="na">Not Applicable</option>
               </select>
               <span v-if="hasError('period')" class="error">* load period is required</span>
            </div>
         </div>

         <div class="wrapper" v-if="nonVideoRequests.length > 0">
            <h3 class="video">Non-video format items to be placed on reserve</h3>
            <div class="wrapper-content">
               <div class="items">
                  <div class="card" v-for="bm in nonVideoRequests" :key="bm.identifier">
                     <div class="title">{{bm.details.title}}</div>
                     <div class="author">{{bm.details.author}} pool {{bm.pool}}</div>
                     <dl>
                        <dt>Loan Period</dt>
                        <dd>
                           <select v-model="bm.period" id="item-period" name="item-period">
                              <option value="">Please select</option>
                              <option value="3h">3 hours</option>
                              <option value="2d">2 days</option>
                              <option value="na">Not Applicable</option>
                           </select>
                        </dd>
                        <dt>Notes</dt>
                        <dd><textarea v-model="bm.notes" name="item-notes"></textarea></dd>
                     </dl>
                  </div>
               </div>
            </div>
         </div>
         <div class="wrapper" v-if="videoRequests.length > 0">
            <h3>Video-format items to be placed on reserve</h3>
            <div class="wrapper-content">
               <div class="video-note">
                  <b>All video reserve requests will be delivered as streaming resources to your class’s Learning Management System. 
                     If you have questions about video reserves, please email
                     <a href="mailto:lib-reserves@virginia.edu">lib-reserves@virginia.edu</a>.</b>
               </div>  
               <div class="items">
                  <div class="card" v-for="bm in videoRequests" :key="bm.identifier">
                     <div class="title">{{bm.details.title}}</div>
                     <div class="author">{{bm.details.author}}</div>
                     <dl>
                        <dt class="label">Preferred Audio Language</dt>
                        <dd><input v-model="bm.audioLanguage" type="text"></dd>
                        <dt class="label">Subtitles</dt> 
                        <dd>
                           <select v-model="bm.subtitles">
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                           </select>
                        </dd>
                        <dt class="label">Subtitles Language</dt> 
                        <dd>
                           <input v-model="bm.subtitleLanguage" type="text">
                           <span v-if="hasSubtitleError(bm)" class="error">* language is required</span>
                        </dd>
                        <dt>Notes</dt>
                        <dd><textarea v-model="bm.notes" name="item-notes"></textarea></dd>
                     </dl>
                  </div>
               </div>
            </div>
         </div>
         <div class="controls">
            <router-link to="/bookmarks">
               <span class="pure-button pure-button-tertiary">Cancel Request</span>
            </router-link>
            <span @click="submitRequest" class="pure-button pure-button-primary">
               Submit Request
            </span>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapFields } from 'vuex-map-fields'
import { mapMultiRowFields } from 'vuex-map-fields'
export default {
   name: "course-reserves-request",
   data: function() {
      return {
         errors: [],
      };
   },
   computed: {
      ...mapState({
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
      ]),
      ...mapMultiRowFields('reserves', ['requestList']),
      videoRequests() {
        return this.requestList.filter( r=> r.pool == "video") 
      }, 
      nonVideoRequests() {
         return this.requestList.filter( r=> r.pool != "video") 
      }
   },
   created() {
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
      submitRequest() {
         this.errors.splice(0, this.errors.length)
         let proxyRequest = this.reserveRequest.onBehalfOf == "yes"
         for (let [key, value] of Object.entries(this.reserveRequest)) {
            if ( key == "period" && this.nonVideoRequests == 0) continue 
            if ( proxyRequest == false && (key=="instructorName" || key=="instructorEmail") ) continue
            if (value == "") {
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

<style scoped>
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
   color: var(--uvalib-red );
   font-size: 1.1em;
   font-weight: bold;
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
   padding: 10px 10px 0 10px;
}
div.items {
   display: flex;
   flex-flow: row wrap;
   align-items: stretch;
   justify-content: flex-start;
   padding: 10px 15px;
}
div.card {
   text-align: left;
   padding: 10px;
   font-size: 0.8em;
   border: 1px solid #ccc;
   margin: 5px;
   display: inline-block;
   max-width: 275px;
   background: white;
   flex-grow: 1;
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
   margin-left: 10px;
   font-weight: bold;
   font-style: italic;
   color: var(--color-error);
}
</style>

