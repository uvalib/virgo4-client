<template>
   <main class="course-reserves">
      <h1>Course Reserves</h1>
      <div class="reserves-content">
         <SearchingOverlay message="Looking up reserved items..."/>
         <p>
            Type instructor's <strong>last name</strong>, <strong>course ID</strong> or 
            <strong>course name</strong> in the search box<br />
            Click the corresponding button to search for reserved items
         </p>
         <div class="search-panel pure-form">
            <input v-model="query" autocomplete="off" type="text">
            <div class="controls">
               <span v-if="canMakeReserves" @click="searchInstructorClicked('id')" class="pure-button pure-button-primary">View My Reserves</span>
               <span @click="searchInstructorClicked('name')" class="pure-button pure-button-primary">Search Instructors</span>
               <span @click="searchCourseClicked('id')" class="pure-button pure-button-primary">Search Course ID</span>
               <span @click="searchCourseClicked('name')" class="pure-button pure-button-primary">Search Course Names</span>
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
         searchType: state => state.reserves.searchType,
         noMatch: state => state.reserves.noMatch,
         error: state => state.error,
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
      searchInstructorClicked(type) {
         this.$store.dispatch("reserves/searchInstructors", type)
      },
      searchCourseClicked(type) {
         this.$store.dispatch("reserves/searchCourses", type)
      }
   },
   created() {
      this.$store.dispatch("user/getAccountInfo")
   }
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
.controls {
  font-weight: bold;
  padding: 10px 0;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: flex-end;
}
#app .controls span.pure-button.pure-button-primary {
   margin: 0 0 5px 10px;
}
p.error {
  font-weight: bold;
  margin: 0;
  color: var(--uvalib-red-emergency);
  opacity: 1;
  visibility: visible;
}
.no-match {
   font-weight: bold;
   margin: 0;
   color: var(--uvalib-red-emergency);
   text-align: center;
}
</style>
