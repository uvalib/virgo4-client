<template>
   <div class="results-panel">
      <h2 class="query-summary" v-if="reserveStore.query == ''">
         Course reserves for course '{{reserveStore.query}}'
      </h2>
      <div class="course" v-for="(c,cidx) in reserveStore.courseReserves" :key="`C${cidx}${c.courseID}`">
         <div class="course-name">
            <h3 class="value">{{c.courseName}}</h3>
            <p class="value-id">{{c.courseID}}</p>
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
import { copyText } from 'vue3-clipboard'
import { useToast } from "primevue/usetoast"

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
   let URL = `${window.location.href}/${encodeURIComponent(courseID)}?instructor=${encodeURIComponent(instructor)}`
   copyText(URL, undefined, (error, _event) => {
      if (error) {
         toast.add({severity:'error', summary: "Copy Error", detail: `Unable to copy reserves URL: ${error}`, life: 5000})
      } else {
         toast.add({severity:'success', summary: "URL Copied", detail: "Reserves URL copied to clipboard.", life: 3000})
      }
   })
})
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
      box-shadow: var(--uvalib-box-shadow);

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
