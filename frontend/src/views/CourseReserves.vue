<template>
   <div class="course-reserves">
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
         <template v-if="!searching && totalReserves > -1">
            <div class="no-match" v-if="totalReserves == 0">
               No course reserves that match your request were found
            </div>
            <template v-else>
               <div class="count">{{totalReserves}} reserved items found</div>
               <CourseSearchResults v-if="hasCourseResults"/>
               <InstructorSearchResults v-if="hasInstructorResults"/>
               <ScrollToTop />
               <div v-if="hasMore" @click="loadMore" class="see-more">
                  <span v-if="loadingMore">
                    <div class="spinner">
                      <div class="bounce1"></div>
                      <div class="bounce2"></div>
                      <div class="bounce3"></div>
                    </div>
                  </span>
                  <span v-else>Load More Reserves</span>
               </div>
            </template>
         </template>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
import SearchingOverlay from "@/components/layout/SearchingOverlay"
import CourseSearchResults from "@/components/reserves/CourseSearchResults"
import InstructorSearchResults from "@/components/reserves/InstructorSearchResults"
import ScrollToTop from "@/components/ScrollToTop"
export default {
   name: "course-reserves",
   components: {
      CourseSearchResults, InstructorSearchResults,
      SearchingOverlay, ScrollToTop
   },
   data: function() {
      return {
         showScrollTop: false,
         loadingMore: false
      }
   },
   computed: {
      ...mapState({
         totalReserves: state => state.reserves.totalReserves,
         hasMore: state => state.reserves.hasMore,
         error: state => state.error,
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
      searchInstructorClicked(type) {
         let data = {type: type, initial: true}
         this.$store.dispatch("reserves/searchInstructors", data)
      },
      searchCourseClicked(type) {
         let data = {type: type, initial: true}
         this.$store.dispatch("reserves/searchCourses", data)
      },
      loadMore() {
         if (this.hasMore) {
            this.loadingMore = true
            this.$store.dispatch("reserves/nextPage").finally( ()=> {
                this.loadingMore = false
            })
         }
      },
      scrollChecker() {
         if (window.window.scrollY > 800) {
            this.showScrollTop = true
         } else {
            this.showScrollTop = false
         }
      }
   },
   created() {
      this.$store.dispatch("user/getAccountInfo")
      window.addEventListener("scroll", this.scrollChecker)
   },
   destroyed: function() {
      window.removeEventListener("scroll", this.scrollChecker)
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
.no-match {
  color: var(--uvalib-text);
  text-align: center;
  font-size: 1.25em;
  margin: 15px;
}
.see-more, .no-more {
   padding: 10px;
   background: var(--uvalib-brand-blue);
   border: 5px solid var(--uvalib-brand-blue);
   color: white;
   cursor: pointer;
   font-weight: bold;
   margin-bottom: 25px;
}
.see-more:hover {
   text-decoration: underline;
   color: var(--uvalib-blue-alt-light);
}
.no-more {
   cursor: default;
}
.spinner {
  margin: 0 auto;
  width: 80px;
  text-align: center;
}
.spinner > div {
  width: 18px;
  height: 18px;
  background-color: var(--uvalib-brand-orange);
  border-radius: 100%;
  display: inline-block;
  -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  margin: 0 2px;
}
.spinner .bounce1 {
  -webkit-animation-delay: -0.32s;
  animation-delay: -0.32s;
}
.spinner .bounce2 {
  -webkit-animation-delay: -0.16s;
  animation-delay: -0.16s;
}
@-webkit-keyframes sk-bouncedelay {
  0%, 80%, 100% { -webkit-transform: scale(0) }
  40% { -webkit-transform: scale(1.0) }
}
@keyframes sk-bouncedelay {
  0%, 80%, 100% {
    -webkit-transform: scale(0);
    transform: scale(0);
  } 40% {
    -webkit-transform: scale(1.0);
    transform: scale(1.0);
  }
}
</style>
