<template>
   <div class="course-reserves">
      <h1>Course Reserves</h1>
      <div class="reserves-content">
         <V4Spinner v-if="searching && totalReserves == -1" message="Looking up reserved items..." v-bind:overlay="true"/>
         <div class="instructions">
            <p>Search for Course Reserves by...</p>
            <ul>
               <li>Entering the <b>instructor's last name</b>, or</li>
               <li>Entering the <b>full course ID</b> (ex: MUSI 2090, LAW9-286), or</li>
               <li>Entering the <b>beginning of the course name</b> (ex: "The Art of Scientific Writing", “The Parthenon", “History of").</li>
            </ul>
            <p>Click the corresponding button to search for reserves.</p>
         </div>
         <label class="screen-reader-text" for="crsearch">Search course reserves by instructor last name, course name or course ID.</label>
         <div class="search-panel pure-form">
            <input id="crsearch" v-model="pendingQuery" autocomplete="off" type="text">
            <div class="controls">
               <V4Button @click="searchInstructorClicked('name')" mode="primary">Search Instructors</V4Button>
               <V4Button @click="searchCourseClicked('id')" mode="primary">Search Course ID</V4Button>
               <V4Button @click="searchCourseClicked('name')" mode="primary">Search Course Names</V4Button>
            </div>
            <div class="links">
               <a href="https://collab.its.virginia.edu/portal" target="_blank">
                  UVA Collab<i style="margin-left:5px;" class="fas fa-external-link-alt"></i>
               </a>
            </div>
            <div class="links">
               <a href="http://www.library.virginia.edu/services/course-reserves/" target="_blank">
                  Place a Reserve (Instructors only)<i style="margin-left:5px;" class="fas fa-external-link-alt"></i>
               </a>
            </div>
         </div>
         <template v-if="totalReserves > -1">
            <div class="no-match" v-if="totalReserves == 0">
               No course reserves that match your request were found
            </div>
            <template v-else>
               <CourseSearchResults v-if="hasCourseResults"/>
               <InstructorSearchResults v-if="hasInstructorResults"/>
               <V4Spinner v-if="hasMore" style="padding:20px 20px"/>
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
         loadingMore: false,
         pendingQuery: ""
      }
   },
   computed: {
      ...mapState({
         totalReserves: state => state.reserves.totalReserves,
         searching: state => state.searching,
         hasMore: state => state.reserves.hasMore,
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
   watch: {
      searching() {
         if (this.searching === false) {
            if (this.hasMore) {
               this.loadingMore = true
               this.$store.dispatch("reserves/nextPage").finally( ()=> {
                  this.loadingMore = false
               })   
            } 
         } 
      }
   },
   methods: {
      searchInstructorClicked(type) {
         let data = {type: type, initial: true, query: this.pendingQuery}
         this.$store.dispatch("reserves/searchInstructors", data)
      },
      searchCourseClicked(type) {
         let data = {type: type, initial: true, query: this.pendingQuery}
         this.$store.dispatch("reserves/searchCourses", data)
      },
   },
   created() {
      this.$store.dispatch("user/getAccountInfo")
      setTimeout( ()=> {
         document.getElementById("crsearch").focus()
      },250)
   },
}
</script>

<style scoped>
.course-reserves {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--uvalib-grey-dark);
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
