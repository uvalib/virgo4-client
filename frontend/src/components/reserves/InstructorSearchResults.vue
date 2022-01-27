<template>
   <div class="results-panel">
      <h2 v-if="query" class="query-summary">
         Course reserves for instructor '{{query}}'
      </h2>
      <div class="instructor" v-for="(ir,idx) in results" :key="idx">
         <h3 class="value folder">{{ir.instructorName}}</h3>
         <div class="course" v-for="course in ir.courses" :key="course.id">
            <div class="course-name">
               <p class="value">{{course.courseName}}</p>
               <p class="value-id">{{course.courseID}}</p>
            </div>
           <div class="reserves" v-for="reserve in course.items" :key="reserve.id">
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

<style scoped lang="scss" >
.results-panel {
   margin: 15px 0 25px 0;
   color: var(--uvalib-grey-dark);
   h2 {
      text-align: left;
      margin: 30px 0 5px 0;
      font-size: 1.2em;
      font-weight: normal;
   }
   div.instructor {
      margin: 10px 0 25px 0;
      text-align: left;
      border: 1px solid var(--uvalib-grey-lightest);
      box-shadow: $v4-box-shadow-light;
      h3.value {
         margin: 0;
         padding: 10px;
      }
      .course {
         padding-bottom: 15px;
         div.course-name {
            font-weight: bold;
            color: var(--uvalib-grey-darkest);
            padding:  15px 15px 5px 15px;
            border-top: 4px solid var(--uvalib-teal-light);
         }
      }
   }
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
