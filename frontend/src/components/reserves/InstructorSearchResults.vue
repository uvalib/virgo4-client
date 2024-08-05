<template>
   <div class="results-panel">
      <h2 v-if="reserveStore.query" class="query-summary">
         Course reserves for instructor '{{reserveStore.query}}'
      </h2>
      <div class="instructor" v-for="(ir,idx) in reserveStore.courseReserves" :key="idx">
         <h3 class="value folder">{{ir.instructorName}}</h3>
         <div class="course" v-for="course in ir.courses" :key="course.id">
            <div class="course-name">
               <span>
                  <p class="value">{{course.courseName}}</p>
                  <p class="value-id">{{course.courseID}}</p>
               </span>
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
      box-shadow: var(--uvalib-box-shadow);
      h3.value {
         margin: 0;
         padding: 10px;
         border-bottom: 4px solid var(--uvalib-teal);
      }
      .course {
         padding-bottom: 15px;
         div.course-name {
            font-weight: bold;
            color: var(--uvalib-grey-darkest);
            padding:  15px 15px 5px 15px;
            border-top: 2px solid var(--uvalib-grey-lightest);
            display: flex;
            flex-flow: row wrap;
            justify-content: space-between;
            align-items: flex-start;
         }
      }
   }
}

div.reserves {
   padding: 0 0 0 35px;
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
</style>
