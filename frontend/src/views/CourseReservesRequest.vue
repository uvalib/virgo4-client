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
         <div class="note">
            <div class="title">
               Please allow 14 days to process requests
            </div>
            <div class="body">
               <p>
                  Note that online-only catalog entries cannot currently be included in a 
                  Virgo course reserve request.
               </p>
               <p>
                  If you need to recommend a purchase or have a personal copy to 
                  place on reserve, please click "Submit" and follow the links on the next page.
               </p>
            </div>
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
               </div>
               <div class="pure-control-group">
                  <label for="instructor_email">Instructor Email Address</label>
                  <input v-model="instructorEmail" id="instructor_email" type="email">
               </div>
            </template>
            <div class="pure-control-group">
               <label for="name">Your Name</label>
               <input v-model="name" id="name" type="text">
            </div>
            <div class="pure-control-group">
               <label for="email">Your  Email Address</label>
               <input v-model="email" id="email" type="email">
            </div>
            <div class="pure-control-group">
               <label for="course">Course ID<span class="hint">(e.g. MDST 3840)</span></label>
               <input v-model="course" id="course" type="text">
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
            </div>
            <div class="pure-control-group">
               <label for="period">Loan Period <span class="hint">(for all items)</span></label>
               <select @change="itemsPeriodChosen" v-model="period" id="period" name="period">
                  <option value="">Please select</option>
                  <option value="3h">3 hours</option>
                  <option value="2d">2 days</option>
               </select>
            </div>
         </div>
         <h3>Items to be placed on reserve</h3>
         <div class="items">
            <div class="card" v-for="bm in requestList" :key="bm.identifier">
               <div class="title">{{bm.details.title}}</div>
               <div class="author">{{bm.details.author}}</div>
               <table>
                  <tr>
                     <td class="label">Loan Period</td>
                     <td>
                        <select v-model="bm.period" id="item-period" name="item-period">
                           <option value="">Please select</option>
                           <option value="3h">3 hours</option>
                           <option value="2d">2 days</option>
                        </select>
                     </td>
                  </tr>
                  <tr>
                     <td class="label">Notes</td>
                     <td><textarea v-model="bm.notes" name="item-notes"></textarea></td>
                  </tr>
               </table>
            </div>
         </div>
         <transition name="message-transition"
            enter-active-class="animated faster fadeIn"
            leave-active-class="animated faster fadeOut">
         <p v-if="error" class="error">{{ error }}</p>
      </transition>
         <div class="controls">
            <router-link to="/">
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
import V4Spinner from "@/components/V4Spinner"
export default {
   name: "course-reserves-request",
   components: {
      V4Spinner
   },
   computed: {
      ...mapState({
         requestList: state => state.reserves.requestList,
         error: state=> state.system.error,
         searching: state => state.searching,
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
         'request.period'
      ]),
      ...mapMultiRowFields('reserves', ['requestList'])
   },
   methods: {
      submitRequest() {
         this.$store.dispatch("reserves/createReserves")
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
   margin: 0 15px;
   border-radius: 5px;
   text-align: left;
   max-width: 500px;
   margin: 0 auto;
}
div.note .body {
   padding: 10px;
   border: 1px solid #ccc;
   border-radius: 0 0 5px 5px;
}
div.note .body p {
   font-size: 0.9em;
   margin: 5px 0;
}
div.note .title {
   padding: 5px;
   background: var(--color-brand-orange);
   color: white;
   text-align: center;
   font-weight: bold;
   border-radius: 5px 5px 0 0;
   border: 1px solid var(--color-brand-orange);;
   border-bottom: 0;
}
.form {
   border-top: 5px solid var(--color-dark-blue);
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
   border-bottom: 5px solid var(--color-dark-blue);
   padding-bottom: 5px;
}
div.items {
   display: flex;
   flex-flow: row wrap;
   align-items: stretch;
   justify-content: center;
}
div.card {
   text-align: left;
   padding: 10px;
   font-size: 0.8em;
   border: 1px solid #ccc;
   margin: 5px;
   border-radius: 5px;
   display: inline-block;
   max-width: 275px;
}
div.card .title {
   font-size:1.1em;
   font-weight: bold;
}
div.card .author {
   margin: 5px 0 10px 10px;
}
table tr td {
   padding: 5px;
}
div.card table, td select, td textarea {
   width: 100%;
}
td.label {
   text-align: right;
   font-weight: bold;
}
td textarea, td select  {
   border: 1px solid #ccc;
   border-radius: 5px;
   box-sizing: border-box;
}
div.controls {
   text-align: right;
   margin: 15px;
}
</style>

