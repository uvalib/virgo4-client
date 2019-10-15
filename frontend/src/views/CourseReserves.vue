<template>
   <main class="course-reserves">
      <h1>Course Reserves</h1>
      <div class="working" v-if="lookingUp" >
         <div>Looking up course reserves data...</div>
         <img src="../assets/spinner2.gif">
      </div>
      <div v-else  class="reserves-content">
         <p>Type instructor's last name or course name in the search box and click the corresponding button to search for reserved items</p>
         <div class="search-panel pure-form">
            <input v-model="query" autocomplete="off" type="text">
            <div class="controls">
               <span @click="searchCourseClicked" class="pure-button pure-button-primary">Search Course Names</span>
               <span @click="searchInstructorClicked" class="pure-button pure-button-primary">Search Instructors</span>
            </div>    
         </div>
      </div>
   </main>
</template>

<script>
import { mapState } from "vuex"
import { mapFields } from 'vuex-map-fields'
export default {
   name: "course-reserves",
   components: {
   },
   computed: {
      ...mapState({
         lookingUp: state => state.reserves.searching,
      }),
      ...mapFields('reserves',[
        'query',
      ]),
   },
   methods: {
      searchInstructorClicked() {
         alert("instructor "+this.query)
      },
      searchCourseClicked() {
         alert("course "+this.query)
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
</style>

