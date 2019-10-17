<template>
   <main class="course-reserves">
      <h1>Course Reserves</h1>
      <div class="working" v-if="lookingUp" >
         <div>Looking up course reserves data...</div>
         <img src="../assets/spinner2.gif">
      </div>
      <div v-else  class="reserves-content">
         <SearchingOverlay message="Looking up reserved item details..."/>
         <p>Type instructor's last name or course name in the search box and click the corresponding button to search for reserved items</p>
         <div class="search-panel pure-form">
            <input v-model="query" autocomplete="off" type="text">
            <div class="controls">
               <span @click="searchCourseClicked" class="pure-button pure-button-primary">Search Course Names</span>
               <span @click="searchInstructorClicked" class="pure-button pure-button-primary">Search Instructors</span>
            </div>    
         </div>
         <div class="no-match" v-if="noMatch==true">
            No course reserves that match your request were be found
         </div>
         <CourseSearchResults v-if="hasCourseResults"/>
         <InstructorSearchResults v-if="hasInstructorResults"/>
      </div>
   </main>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
import SearchingOverlay from "@/components/layout/SearchingOverlay"
import CourseSearchResults from "@/components/reserves/CourseSearchResults"
import InstructorSearchResults from "@/components/reserves/InstructorSearchResults"
export default {
   name: "course-reserves",
   components: {
      CourseSearchResults, InstructorSearchResults,SearchingOverlay
   },
   computed: {
      ...mapState({
         lookingUp: state => state.reserves.searching,
         searchType: state => state.reserves.searchType,
         noMatch: state => state.reserves.noMatch,
         error: state => state.error,
      }),
      ...mapGetters({
         hasCourseResults: 'reserves/hasCourseResults',
         hasInstructorResults: 'reserves/hasInstructorResults',
      }),
      ...mapFields('reserves',[
        'query',
      ]),
   },
   methods: {
      searchInstructorClicked() {
         this.$store.dispatch("reserves/searchInstructors")
      },
      searchCourseClicked() {
         this.$store.dispatch("reserves/searchCourses")
      }
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
   width: 60%;
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
   font-size: 0.9em;
   margin: 5px 0;
}
.controls {
  font-size: 0.85em;
  font-weight: bold;
  padding: 10px 0;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: flex-end;
}
p.error {
  font-weight: bold;
  margin: 0;
  color: var(--color-error);
  opacity: 1;
  visibility: visible;
}
.no-match {
   font-weight: bold;
   margin: 0;
   color: var(--color-error);
   text-align: center;
}
</style>

