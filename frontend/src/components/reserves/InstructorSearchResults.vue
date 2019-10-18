<template>
   <div class="results-panel">
      <div class="query-summary">
         <span>Course reserves for instructor '{{query}}'</span>
      </div>
      <div class="instructor" v-for="(inst,idx) in results" :key="idx">
         <p class="value folder">{{inst.name}}</p>
         <div class="course" v-for="(course,ci) in inst.courses" :key="course.id">
            <p v-if="ci>0" class="value folder">{{inst.name}}</p>
            <div class="course-name">
               <p class="value">{{course.name}}</p>
               <p class="value">{{course.id}}</p>
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
   color: #444;
}
.query-summary {
   text-align: left;
   font-weight: bold;
   margin-bottom: 10px;
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
.value {
   margin: 0;
}
div.course-name {
   font-weight: bold;
   color: #666;
   border: 1px solid #ccc;
   padding: 4px 8px;
   background: #f5f5f5;
   border-radius: 0 0 0px 5px;
}
.folder {
   background: var(--color-primary-orange);
   margin: 10px 0 0 0;
   padding: 4px 8px;
   color: white;
   font-weight: bold;
   border-radius: 5px 5px 0 0;
}
</style>