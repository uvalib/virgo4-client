<template>
   <div class="results-panel">
      <h2 class="query-summary" v-if="tgtInstructor == ''">
         Course reserves for course '{{query}}'
      </h2>
      <div class="course" v-for="(c,cidx) in results" :key="`C${cidx}${c.courseID}`">
         <div class="course-name">
            <h3 class="value">{{c.courseName}}</h3>
            <p class="value-id">{{c.courseID}}</p>
         </div>
         <div class="instructor" v-for="(inst,idx) in c.instructors" :key="idx">
            <p class="value folder">
               <span>{{inst.instructorName}}</span>
               <V4Button mode="text" v-if="!isExactLookup" @click="copyURL(c.courseID, inst.instructorName )">Copy link to reserves</V4Button>
            </p>
            <div class="reserves" v-for="reserve in inst.items" :key="reserve.id">
               <ReserveDetail :reserve="reserve" />
            </div>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import ReserveDetail from "@/components/reserves/ReserveDetail.vue"
export default {
   components: {
      ReserveDetail
   },
   computed: {
      ...mapState({
         results: state => state.reserves.courseReserves,
         query: state => state.reserves.query,
         tgtInstructor: state => state.reserves.targetInstructor,
      }),
      isExactLookup() {
         if (this.$route.params.id) {
            return true
         }
         return false
      }
   },
   methods: {
      copyURL( courseID, instructor ) {
         let URL = `${window.location.href}/${encodeURIComponent(courseID)}?instructor=${encodeURIComponent(instructor)}`
         this.$copyText(URL, undefined, (error, _event) => {
            if (error) {
               this.$store.commit("system/setError", "Unable to copy reserves URL: "+error)
            } else {
               this.$store.commit("system/setMessage", "Reserves URL copied to clipboard.")
            }
         })
      },
   }
}
</script>

<style scoped lang="scss">
.results-panel {
   margin: 15px 0;
   color: var(--uvalib-grey-dark);
   h2 {
      text-align: left;
      margin: 30px 0 5px 0;
      font-size: 1.2em;
      font-weight: normal;
   }
   div.course {
      margin: 10px 0 25px 0;
      text-align: left;
      box-shadow: $v4-box-shadow-light;

      div.course-name {
         font-weight: bold;
         color: var(--uvalib-grey-darkest);
         padding: 0;
         padding: 10px;
         background: var(--uvalib-teal-lightest);
         border-bottom: 4px solid var(--uvalib-teal);
      }
      div.instructor {
         font-weight: bold;
         color: var(--uvalib-grey-dark);
         padding: 0 0 10px 0;
         background: white;
         border-top: 2px solid var(--uvalib-grey-lightest);
         div.reserves {
            padding: 0 0 0 25px;
         }
      }
      div.instructor .value.folder {
         padding: 15px 15px 5px 15px;
         color: var(--uvalib-grey-darkest);
         display: flex;
         flex-flow: row wrap;
         justify-content: space-between;
         align-items: flex-start;
      }
   }
}

.value, .value-id {
   margin: 0;
}
.value-id {
  font-weight: normal;
}
</style>
