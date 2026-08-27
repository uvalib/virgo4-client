<template>
   <div class="date-wrapper">
      <div class="date-section">
         <label>Date Published</label>
         <div class="date-entry">
            <select v-model="dateType" name="date-type" @change="dateTypeChanged" aria-label="date range type">
               <option value="AFTER">AFTER</option>
               <option value="BEFORE">BEFORE</option>
               <option value="BETWEEN">BETWEEN</option>
               <option value="EQUAL">IN</option>
            </select>
            <input v-model="startDate" placeholder="YYYY" aria-label="start data"/>
            <template v-if="dateType == 'BETWEEN'">
               <span>and</span>
               <input v-model="endDate" placeholder="YYYY"  aria-label="end data"/>
            </template>
         </div>
         <div class="date-acts">
            <VirgoButton severity="secondary" :label="dateLabel" size="small" @click="applyDateFilterClicked"/>
         </div>
      </div>
      <div class="error" v-if="dateErr">{{ dateErr }}</div>
   </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from "pinia"
import { useRouteUtils } from '@/composables/routeutils'
import { useQueryStore } from "@/stores/query"
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"
import { useRouter, useRoute } from 'vue-router'
import { watchDeep } from '@vueuse/core'
import analytics from '@/analytics'
import { useWindowSize } from '@vueuse/core'

const { width } = useWindowSize()
const route = useRoute()
const router = useRouter()
const routeUtils = useRouteUtils(router, route)
const queryStore = useQueryStore()
const resultStore = useResultStore()
const filters = useFilterStore()

const dateType = ref("BETWEEN")
const startDate = ref("")
const endDate = ref("")
const dateErr = ref("")

const { targetPool } = storeToRefs(queryStore)
watch( targetPool, () => {
   updateDateFilter()
})

// normal watch doesn't always catch chages to the Map used to hold date filter
const { poolDateFilters } = storeToRefs(queryStore)
watchDeep( poolDateFilters, () => {
   updateDateFilter()
})

const dateLabel = computed(() => {
   if ( queryStore.dateFilter ) {
      return "Update Date Filter"
   }
   return "Apply Date Filter"
})

onMounted( () => {
   updateDateFilter()
})

const autoCloseSidebar = (() => {
   if (width.value < 810) {
      // sidebar covers results, so close the panel after applying the filter
      filters.closed = true
   }
})

const updateDateFilter = (() => {
   if ( queryStore.dateFilter ) {
      dateType.value = queryStore.dateFilter.comparison
      startDate.value = queryStore.dateFilter.startDate
      endDate.value = queryStore.dateFilter.endDate
   } else {
      dateType.value = "BETWEEN"
      startDate.value = ""
      endDate.value = ""
      dateErr.value = ""
   }
})

const dateTypeChanged = (() => {
   dateErr.value = ""
   if ( dateType.value != "BETWEEN" ) {
      endDate.value = ""
   }   
})

const applyDateFilterClicked = (() => {
   dateErr.value = ""
   var year1 = parseInt(startDate.value, 10)
   if ( (""+year1) !=  startDate.value || startDate.value.length != 4) {
      dateErr.value = "Please enter all dates as a four digit year"
      return
   }

   let dateTxt = dateType.value
   if ( dateType.value == "BETWEEN") {
      var year2 = parseInt(endDate.value, 10)
      if ( (""+year2) !=  endDate.value || endDate.value.length != 4) {
         dateErr.value = "Please enter all dates as a four digit year"
         return
      } 
      if (year2 <= year1) {
         dateErr.value = "End date must be greater than the start date"
         return   
      } 
      dateTxt = `${year1} TO ${year2}` 
   } else {
       dateTxt += ` ${year1}`   
   } 

   analytics.trigger('Filters', 'DATE_FILTER_ADDED', dateTxt)
   queryStore.setDateFilter( resultStore.selectedResults.pool.id, dateType.value, startDate.value, endDate.value )
   queryStore.userSearched = true
   routeUtils.searchChanged()
   autoCloseSidebar()
})

</script>

<style lang="scss" scoped>
.date-wrapper  {
   flex-direction: column;
   color: $uva-grey-B;
   background: white;
   border-bottom: 1px solid $uva-grey-100;
   padding: 0 0 15px 0;
   margin-bottom: 5px;
   display: flex;
   gap: 10px;
   
   .error {
      color: $uva-red-A;
      font-style: italic;
   }
   .date-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      .date-entry {
         display: flex;
         flex-flow: row wrap;
         justify-content: flex-start;
         align-items: center;
         gap: 8px;
         input {
            width: 90px;
         }
      }
      .date-acts {
         display: flex;
         flex-flow: row nowrap;
         gap: 10px;
         button {
            flex-grow: 1;
         }
      }
   }
 }
</style>