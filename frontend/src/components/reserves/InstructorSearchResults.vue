<template>
   <div class="results-panel">
      <h2 v-if="query" class="query-summary">
         Course reserves for instructor '{{query}}'
      </h2>
      <h2 v-else class="query-summary">
         My Course Reserves
      </h2>
      <div class="instructor" v-for="(inst,idx) in results" :key="idx">
         <h3 class="value folder">{{inst.name}}</h3>
         <div class="course" v-for="(course,ci) in inst.courses" :key="course.id">
            <p v-if="ci>0" class="value folder">{{inst.name}}</p>
            <div class="course-name">
               <p class="value">{{course.name}}</p>
               <p class="value-id">{{course.id}}</p>
            </div>
            <div class="reserves" v-for="reserve in course.reserves" :key="reserve.catalogKey">
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
  margin-bottom: 15px;
  border-bottom: 1px solid var(--uvalib-grey-light);
}
div.instructor {
   text-align: left;
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
  border-top: 4px solid var(--uvalib-teal-light);
}
.folder {
   background: var(--uvalib-teal-lightest);
   margin: 10px 0 0 0;
   padding: 8px;
   color: var(--uvalib-grey-darkest);
   font-weight: bold;
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
