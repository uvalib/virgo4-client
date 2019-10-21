<template>
   <main class="course-reserves-request">
      <h1>Course Reserves Request</h1>
      <div class="reserves-content">
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
               <label class="right-gap"  for="semester">Is this request on behalf of an instructor?</label>
               <select id="behalf" name="behalf">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
               </select>
            </div>
            <div class="pure-control-group">
               <label class="right-gap" for="name">Your Name</label>
               <input id="name" type="text">
            </div>
            <div class="pure-control-group">
               <label class="right-gap" for="email">Your  Email Address</label>
               <input id="email" type="email">
            </div>
            <div class="pure-control-group">
               <label class="right-gap"  for="course">Course ID<span class="hint">(e.g. MDST 3840)</span></label>
               <input id="course" type="text">
            </div>
            <div class="pure-control-group">
               <label class="right-gap"  for="semester">Semester</label>
               <select id="semester" name="semester">
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
               <label class="right-gap"  for="library">Reserve Library</label>
               <select id="library" name="library">
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
               <label class="right-gap"  for="reserve_period_all">Loan Period <span class="hint">(for all items)</span></label>
               <select class="reserve-period-select" id="reserve_period_all" name="reserve_period_all">
                  <option value="">Please select</option>
                  <option value="3h">3 hours</option>
                  <option value="2d">2 days</option>
               </select>
            </div>
         </div>
      </div>
   </main>
</template>

<script>
// import { mapState } from "vuex"
// import { mapGetters } from "vuex"
// import { mapFields } from 'vuex-map-fields'
export default {
   name: "course-reserves-request",
   components: {
   },
   computed: {
      // ...mapState({
      //    searchType: state => state.reserves.searchType,
      //    noMatch: state => state.reserves.noMatch,
      //    error: state => state.error,
      // }),
      // ...mapGetters({
      //    hasCourseResults: 'reserves/hasCourseResults',
      //    hasInstructorResults: 'reserves/hasInstructorResults',
      // }),
      // ...mapFields('reserves',[
      //   'query',
      // ]),
   },
   methods: {
   }
}
</script>

<style scoped>
.course-reserves {
   min-height: 400px;
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
   width: 50%;
   margin: 0 auto;
   max-width: 800px;
}
@media only screen and (min-width: 768px) {
   div.reserves-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.reserves-content  {
       width: 95%;
   }
   div.reserves-content input, div.reserves-content select {
      width: 100%;
   }
}
div.note {
   margin: 0 15px;
   border-radius: 5px;
   text-align: left;
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
   border-top: 5px solid var(--color-primary-orange);
   margin: 15px;
   padding-top: 15px;
   text-align: left;
}
input, select {
   width: 50%;
}
label.right-gap{
   margin-right: 5px;
   width: 25%;
   font-weight: bold;
   color: #444;
}
span.hint {
   font-weight: 100;
   font-size: 0.8em;
   display: block;

}
</style>

