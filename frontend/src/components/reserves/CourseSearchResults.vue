<template>
   <div class="results-panel">
      <div class="query-summary">
         <span>Course reserves for course '{{query}}'</span>
      </div>
      <div class="course" v-for="course in results" :key="course.id">
         <div class="course-name">
            <p class="value">{{course.name}}</p>
            <p class="value">{{course.id}}</p>
         </div>
         <div class="instructor" v-for="(inst,idx) in course.instructors" :key="idx">
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
   color: #444;
}
.query-summary {
   text-align: left;
   font-weight: bold;
   margin-bottom: 10px;
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
   color: white;
   padding: 0;
   padding: 4px 8px;
}
div.course {
   background: var(--color-primary-orange);
   margin: 10px 0 0 0;
   color: white;
   font-weight: bold;
   border-radius: 5px 5px 0 5px;
   text-align: left;
   padding:0;
}
div.instructor {
   font-weight: bold;
   color: #666;
   padding: 0;
   border-radius: 0 0 0px 5px;
   background: white;
}
div.instructor .value.folder {
   border: 1px solid #ccc;
   padding: 4px 8px;
   background: #f5f5f5;
   border-radius: 0 0 0px 5px;
}
</style>