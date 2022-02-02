<template>
   <div class="course-reserves">
      <div class="reserves-content">
         <V4Spinner v-if="searching" message="Looking up reserved items..." v-bind:overlay="true"/>
         <div class="instructions">
            <p>Search for Course Reserves by...</p>
            <ul>
               <li>Entering the <b>instructor's name</b> (ex: rossman; freeman, rob), or</li>
               <li>Entering the <b>course ID</b> (ex: MUSI 2090, LAW9-286, CHEM), or</li>
               <li>Entering the <b>beginning of the course name</b> (ex: The Art of Scientific Writing, History of).</li>
            </ul>
            <p>Click the corresponding button to search for reserves.</p>
         </div>
         <label class="screen-reader-text" for="crsearch">Search course reserves by instructor last name, course name or course ID.</label>
         <div class="search-panel pure-form">
            <input id="crsearch" v-model="pendingQuery" autocomplete="off" type="text" aria-required="true" required="required">
            <div class="controls">
               <V4Button @click="searchClicked('instructor_name')" mode="primary">Search Instructors</V4Button>
               <V4Button @click="searchClicked('course_id')" mode="primary">Search Course ID</V4Button>
               <V4Button @click="searchClicked('course_name')" mode="primary">Search Course Names</V4Button>
            </div>
            <div class="links">
               <a href="https://collab.its.virginia.edu/portal" target="_blank">
                  UVA Collab<i style="margin-left:5px;" class="fal fa-external-link-alt"></i>
               </a>
            </div>
            <div class="links">
               <a href="http://www.library.virginia.edu/services/course-reserves/" target="_blank">
                  Place a Reserve (Instructors only)<i style="margin-left:5px;" class="fal fa-external-link-alt"></i>
               </a>
            </div>
         </div>
         <template v-if="searchSuccess">
            <div class="no-match" v-if="courseReserves.length == 0">
               No course reserves that match your request were found
            </div>
            <template v-else>
               <CourseSearchResults v-if="hasCourseResults"/>
               <InstructorSearchResults v-if="hasInstructorResults"/>
            </template>
         </template>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
import CourseSearchResults from "@/components/reserves/CourseSearchResults"
import InstructorSearchResults from "@/components/reserves/InstructorSearchResults"
export default {
   name: "course-reserves",
   components: {
      CourseSearchResults, InstructorSearchResults
   },
   data: function() {
      return {
         pendingQuery: ""
      }
   },
   computed: {
      ...mapState({
         courseReserves: state => state.reserves.courseReserves,
         searchSuccess: state => state.reserves.searchSuccess,
         searching: state => state.searching,
      }),
      ...mapGetters({
         hasCourseResults: 'reserves/hasCourseResults',
         hasInstructorResults: 'reserves/hasInstructorResults',
         canMakeReserves: 'user/canMakeReserves',
      }),
      ...mapFields('reserves',[
        'query',
      ]),
   },
   methods: {
      searchClicked(type) {
         let data = {type: type, query: this.pendingQuery}
         this.$store.dispatch("reserves/searchCourseReserves", data)
      },
   },
   mounted() {
      this.$store.commit("reserves/resetResults")
   }
}
</script>

<style scoped>
.course-reserves {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--uvalib-grey-dark);
   margin-bottom: 75px;
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
}
@media only screen and (min-width: 768px) {
   div.reserves-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.reserves-content  {
       width: 80%;
   }
}
input[type=text] {
   width: 100%;
   box-sizing: border-box;
}
p {
   margin: 15px 0;
}
div.instructions {
   text-align: left;
}
.controls {
  font-weight: bold;
  padding: 10px 0;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: flex-end;
}
#app .controls span.v4-button {
   margin: 0 0 5px 10px;
}
.no-match {
  color: var(--uvalib-text);
  text-align: center;
  font-size: 1.25em;
  margin: 15px;
}
.total {
   padding: 10px;
   background: var(--uvalib-brand-blue);
   border: 5px solid var(--uvalib-brand-blue);
   color: white;
   cursor: pointer;
   font-weight: bold;
   margin-bottom: 25px;
   cursor: default;
}
div.links {
   text-align: right;
   margin: 10px 0;
}
</style>
