<template>
   <div class="course-reserves">
      <div class="reserves-content">
         <V4Spinner v-if="reserveStore.searching" message="Looking up reserved items..." v-bind:overlay="true"/>
         <template v-if="lookupID == false">
            <div class="instructions">
               <p>Search for Course Reserves by...</p>
               <ul>
                  <li>Entering the <b>instructor's name</b> (ex: rossman; freeman, rob), or</li>
                  <li>Entering the <b>course ID</b> (ex: MUSI 2090, LAW9-286, CHEM), or</li>
               </ul>
               <p>Click the corresponding button to search for reserves.</p>
            </div>
            <label class="screen-reader-text" for="crsearch">Search course reserves by instructor last name, course name or course ID.</label>
            <div class="search-panel">
               <input id="crsearch" v-model="pendingQuery" autocomplete="off" type="text" aria-required="true" required="required">
               <div class="controls">
                  <VirgoButton @click="searchClicked('instructor_name')" label="Search Instructors"/>
                  <VirgoButton @click="searchClicked('course_id')" label="Search Course ID"/>
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
         </template>
         <template v-if="reserveStore.searchSuccess">
            <div class="no-match" v-if="reserveStore.courseReserves.length == 0">
               No course reserves that match your request were found
            </div>
            <template v-else>
               <CourseSearchResults v-if="reserveStore.hasCourseResults"/>
               <InstructorSearchResults v-if="reserveStore.hasInstructorResults"/>
            </template>
         </template>
      </div>
   </div>
</template>

<script setup>
import CourseSearchResults from "@/components/reserves/CourseSearchResults.vue"
import InstructorSearchResults from "@/components/reserves/InstructorSearchResults.vue"
import { useReserveStore } from "@/stores/reserve"
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import analytics from '@/analytics'

const reserveStore = useReserveStore()
const route = useRoute()
const pendingQuery = ref("")
const lookupID = ref(false)

function searchClicked(type) {
   let data = {type: type, query: pendingQuery.value}
   analytics.trigger('Search', 'COURSE_RESERVES_SEARCH', type)
   reserveStore.searchCourseReserves(data)
}

onMounted(() => {
   if ( route.params.id ) {
      lookupID.value = true
      let data = {type: "course_id", query: route.params.id, instructor: route.query.instructor}
      analytics.trigger('Search', 'COURSE_RESERVES_CLASS', `${route.params.id}: ${route.query.instructor}`)
      reserveStore.searchCourseReserves(data)
   }
})
</script>

<style scoped lang="scss">
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
