<template>
   <div class="course-reserves">
      <h1>Course Reserves</h1>
      <div class="reserves-content">
         <V4Spinner v-if="searching && totalReserves == -1" message="Looking up reserved items..." v-bind:overlay="true"/>
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
import V4Spinner from "@/components/V4Spinner"
import CourseSearchResults from "@/components/reserves/CourseSearchResults"
import InstructorSearchResults from "@/components/reserves/InstructorSearchResults"
export default {
   name: "course-reserves",
   components: {
      CourseSearchResults, InstructorSearchResults,V4Spinner
   },
   data: function() {
      return {
         loadingMore: false
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
         let data = {type: type, initial: true}
         this.$store.dispatch("reserves/searchInstructors", data)
      },
      searchCourseClicked(type) {
         let data = {type: type, initial: true}
         this.$store.dispatch("reserves/searchCourses", data)
      },
   },
   created() {
      this.$store.dispatch("user/getAccountInfo")
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
.controls {
  font-weight: bold;
  padding: 10px 0;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
}
#app .controls span.pure-button.pure-button-primary {
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
</style>
