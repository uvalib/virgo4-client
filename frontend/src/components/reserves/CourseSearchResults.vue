<template>
   <div class="results-panel">
      <h2 class="query-summary">
         Course reserves for course '{{query}}'
      </h2>
      <div class="course" v-for="(course,cidx) in results" :key="`C${cidx}#{course.id}`">
         <div class="course-name">
            <h3 class="value">{{course.name}}</h3>
            <p class="value-id">{{course.id}}</p>
         </div>
         <div class="instructor" v-for="(inst,idx) in course.instructors" :key="idx">
            <div v-if="idx>0" class="course-name">
               <h3 class="value">{{course.name}}</h3>
               <p class="value-id">{{course.id}}</p>
            </div>
            <p class="value folder">{{inst.name}}</p>
            <div class="reserves" v-for="reserve in inst.reserves" :key="reserve.catalogKey">
               <ReserveDetail :reserve="reserve" />
            </div>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import ReserveDetail from "@/components/reserves/ReserveDetail"
export default {
   components: {
      ReserveDetail
   },
   computed: {
      ...mapState({
         results: state => state.reserves.courseReserves,
         query: state => state.reserves.query,
      }),
   }
}
</script>

<style scoped>
.results-panel {
   margin: 15px 0;
   color: var(--uvalib-grey-dark);
}
.query-summary {
   text-align: left;
   font-weight: bold;
   margin-bottom: 25px;
}
div.reserves {
   padding: 0 0 0 25px;
}
label {
   font-weight: bold;
   margin-right: 10px;
}
.value, .value-id {
   margin: 0;
}
.value-id {
  font-weight: normal;
}
div.course-name {
   font-weight: bold;
   color: var(--uvalib-grey-darkest);
   padding: 0;
   padding: 8px;
   background: var(--uvalib-teal-lightest);
   margin-top: 10px;
   border-bottom: 4px solid var(--uvalib-teal-light);
}
div.course-name-alt {
  border-top: none;
  border-left: none;
  border-right: none;
}
div.course {
   margin: 10px 0 0 0;
   text-align: left;

}
div.instructor {
   font-weight: bold;
   color: var(--uvalib-grey-dark);
   padding: 0;
   background: white;
   margin-bottom: 25px;
}
div.instructor .value.folder {
   padding: 8px;
   color: var(--uvalib-grey-darkest);
}
.reserves::after {
  content: " ";
  display: block;
  width: 100%;
  height: 1em;
  margin: 0 auto;
  padding: 5px 0;
  background: linear-gradient(to right, #FFF, var(--uvalib-grey-light), #FFF) center / 100% 2px no-repeat;
}
.reserves:last-of-type::after {
  height: 0px;
  padding: 0;
}
</style>
