<template>
   <div class="results-panel">
      <div class="query-summary" v-if="reserveStore.query != ''">
         Course reserves for course '{{reserveStore.query}}'
      </div>
      <div class="course" v-for="(c,cidx) in reserveStore.courseReserves" :key="`C${cidx}${c.courseID}`">
         <div class="course-name">
            <span class="name">{{c.courseName}}</span>
            <span>{{c.courseID}}</span>
         </div>
         <div class="instructor" v-for="(inst,idx) in c.instructors" :key="idx">
            <p class="value folder">
               <span>{{inst.instructorName}}</span>
               <VirgoButton v-if="!isExactLookup" severity="secondary" class="small" @click="copyURL(c.courseID, inst.instructorName )" label="Copy link to reserves"/>
            </p>
            <div class="reserves" v-for="reserve in inst.items" :key="reserve.id">
               <ReserveDetail :reserve="reserve" />
            </div>
         </div>
      </div>
   </div>
</template>

<script setup>
import ReserveDetail from "@/components/reserves/ReserveDetail.vue"
import { useReserveStore } from "@/stores/reserve"
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import { useToast } from "primevue/usetoast"

const { copy } = useClipboard()
const toast = useToast()
const route = useRoute()
const reserveStore = useReserveStore()
const isExactLookup = computed(() => {
   if (route.params.id) {
      return true
   }
   return false
})

const copyURL = (( courseID, instructor ) => {
   copy( `${window.location.href}/${encodeURIComponent(courseID)}?instructor=${encodeURIComponent(instructor)}` )
   toast.add({severity:'success', summary: "URL Copied", detail: "Reserves URL copied to clipboard.", life: 3000})
})
</script>

<style scoped lang="scss">
.results-panel {
   display: flex;
   flex-direction: column;
   gap: 20px;
   text-align: left;

   div.course {
      border: 1px solid $uva-grey-100;
      div.course-name {
         display: flex;
         flex-direction: column;
         gap: 5px;
         padding: 10px;
         background: $uva-teal-200;
         border-bottom: 1px solid $uva-teal-100;
         .name {
            font-weight: bold;
         }
      }
      div.instructor {
         font-weight: bold;
         padding: 0 0 10px 0;
         background: white;
         div.reserves {
            padding: 0 0 0 25px;
         }
      }
      div.instructor .value.folder {
         padding: 15px 15px 5px 15px;
         display: flex;
         flex-flow: row wrap;
         justify-content: space-between;
         align-items: flex-start;
      }
   }
}
</style>
