<template>
   <div class="results-panel">
      <div class="query-summary" v-if="reserveStore.query != ''">
         Course reserves for instructor '{{reserveStore.query}}'
      </div>
      <div class="instructor" v-for="(ir,idx) in reserveStore.courseReserves" :key="idx">
         <div class="instructor-name">{{ir.instructorName}}</div>
         <div class="course" v-for="course in ir.courses" :key="course.id">
            <div class="course-header">
               <div class="course-name">
                  <span class="name">{{course.courseName}}</span>
                  <span>{{course.courseID}}</span>
               </div>
               <VirgoButton v-if="!isExactLookup" severity="secondary" class="small" @click="copyURL(course.courseID, ir.instructorName )" label="Copy link to reserves"/>
            </div>
           <div class="reserves" v-for="reserve in course.items" :key="reserve.id">
               <ReserveDetail :reserve="reserve" />
            </div>
         </div>
      </div>
   </div>
</template>

<script setup>
import ReserveDetail from "@/components/reserves/ReserveDetail.vue"
import { useReserveStore } from "@/stores/reserve"
import { useSystemStore } from "@/stores/system"
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useClipboard } from '@vueuse/core'

const { copy } = useClipboard()
const route = useRoute()
const reserveStore = useReserveStore()
const system = useSystemStore()

const isExactLookup = computed(() => {
   if (route.params.id) {
      return true
   }
   return false
})

const copyURL = (( courseID, instructor ) => {
   copy( `${window.location.href}/${encodeURIComponent(courseID)}?instructor=${encodeURIComponent(instructor)}` )
   system.setToast("URL Copied", "Reserves URL copied to clipboard.")
})
</script>

<style scoped lang="scss" >
.results-panel {
   display: flex;
   flex-direction: column;
   gap: 20px;
   text-align: left;

   div.instructor {
      border: 1px solid $uva-grey-100;
      .instructor-name {
         padding: 10px;
         background: $uva-teal-200;
         border-bottom: 1px solid $uva-teal-100;
         font-weight: bold;
      }
      .course {
         div.course-header {
            padding:  15px 15px 5px 15px;
            display: flex;
            flex-flow: row wrap;
            justify-content: space-between;
            align-items: flex-start;
            .course-name {
               display: flex;
               flex-direction: column;
               .name {
                  font-weight: bold;
               }
            }

         }
         div.reserves {
            padding-left: 20px;
         }
      }
   }
}
</style>
