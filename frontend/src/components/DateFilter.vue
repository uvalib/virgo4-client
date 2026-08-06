<template>
   <div class="date-wrapper">
      <div class="date-section">
         <label>Date Published</label>
         <div class="date-entry">
            <select v-model="dateType" name="date-type" @change="dateTypeChanged">
               <option value="AFTER">AFTER</option>
               <option value="BEFORE">BEFORE</option>
               <option value="BETWEEN">BETWEEN</option>
               <option value="EQUAL">IN</option>
            </select>
            <input v-model="startDate" placeholder="YYYY"/>
            <template v-if="dateType == 'BETWEEN'">
               <span>and</span>
               <input v-model="endDate" placeholder="YYYY"/>
            </template>
         </div>
         <div class="date-acts">
            <VirgoButton label="Apply Date Filter" size="small" @click="applyDateFilterClicked"/>
            <VirgoButton label="Clear Date Filter" severity="secondary" size="small" @click="clearDateFilterClicked"/>
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
import { useRouter, useRoute } from 'vue-router'

const route = useRoute()
const router = useRouter()
const routeUtils = useRouteUtils(router, route)
const queryStore = useQueryStore()
const resultStore = useResultStore()

const dateType = ref("BETWEEN")
const startDate = ref("")
const endDate = ref("")
const dateErr = ref("")

const { targetPool } = storeToRefs(queryStore)
watch( targetPool, (newVal) => {
   updateDateFilter()
})

const { poolDateFilters } = storeToRefs(queryStore)
watch( poolDateFilters, (newVal) => {
   updateDateFilter()
})

onMounted( () => {
   updateDateFilter()
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

const clearDateFilterClicked = (() => {
   dateType.value = "BETWEEN"
   startDate.value = ""
   endDate.value = ""
   dateErr.value = ""
   queryStore.removeDateFilter( resultStore.selectedResults.pool.id )
   queryStore.userSearched = true
   routeUtils.searchChanged()
})

const applyDateFilterClicked = (() => {
   dateErr.value = ""
   var year1 = parseInt(startDate.value, 10)
   if ( (""+year1) !=  startDate.value || startDate.value.length != 4) {
      dateErr.value = "Please enter all dates as a four digit year"
      return
   }
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
   }
   queryStore.setDateFilter( resultStore.selectedResults.pool.id, dateType.value, startDate.value, endDate.value )
   queryStore.userSearched = true
   routeUtils.searchChanged()
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