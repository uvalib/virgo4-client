<template>
   <Select v-model="selectedPoolID" :class="{active: selectedPoolID}"
      :options="pools" optionLabel="pool.name" optionValue="pool.id"
      @change="emit('selected', selectedPoolID)"
   >
      <template #value>
         <div v-if="selectedPoolID" class="more-selection">
            <button :aria-label="`exclude ${selection.pool.name}`" :title="`exclude ${selection.pool.name}`" 
               class="exclude" @click="excludePoolClicked($event, selection.pool)"
            >
               <i  class="fal fa-xmark"></i>
            </button>
            <div class="identity">
               <div class="poolname">{{ selection.pool.name }}</div>
               <div class="total">({{  selection.total }})</div>
            </div>
         </div>
         <div v-else class="more">More</div>
      </template>
      <template #option="slotProps">
         <div class="more-opt">
            <div class="other-src">{{ slotProps.option.pool.name }}</div>
            <div v-if="slotProps.option.falied" class='total error'>Failed</div>
            <div v-else-if="slotProps.option.skipped" class='total error'>Skipped</div>
            <div v-else class="total">({{slotProps.option.total}})</div>
         </div>
      </template>
   </Select>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useResultStore } from "@/stores/result"
import { usePreferencesStore } from "@/stores/preferences"
import { useQueryStore } from "@/stores/query"
import Select from 'primevue/select'
import { storeToRefs } from "pinia"
import * as utils from '../utils'
import { useConfirm } from "primevue/useconfirm"
import { useRouter, useRoute } from 'vue-router'
import { useRouteUtils } from '@/composables/routeutils'

const router = useRouter()
const route = useRoute()
const confirm = useConfirm()
const routeUtils = useRouteUtils(router, route)
const resultStore = useResultStore()
const preferences = usePreferencesStore()
const queryStore = useQueryStore()

const selectedPoolID = ref("")

const emit = defineEmits( ['selected' ] )

const { selectedResultsIdx } = storeToRefs(resultStore)
watch( selectedResultsIdx, () => {
   const newPool = resultStore.selectedResults.pool
   if ( pools.value.findIndex( p => p.pool.id == newPool.id) == -1 ) {
      selectedPoolID.value = ""
   }
})

onMounted( () =>{
   let selResults = resultStore.selectedResultsIdx
   if ( selResults > 2 && selResults < (resultStore.results.length-1)) {
      selectedPoolID.value = resultStore.results[selResults].pool.id    
   } 
})

const pools = computed(()=>{
   let opts = []
   resultStore.results.filter( r => r.pool.primary == false).forEach( r => {
      let opt = {  pool: {id: r.pool.id, name: r.pool.name}, failed: false, skipped: false, total: 0}
      if (poolFailed(r)) {
         opt.failed = true
      } else if (poolSkipped(r)) {
         opt.skipped = true
      } else {
         opt.total = utils.formatNum(r.total)
      }
      opts.push(opt)
   })

   return opts.sort( (a,b) => {
      if (a.pool.name < b.pool.name) return -1
      if (a.pool.name > b.pool.name) return 1
      return 0
   })
})

const selection = computed (() => {
   return resultStore.results.find( r => r.pool.id == selectedPoolID.value)
})

const excludePoolClicked = ( (event, pool) => {
   event.stopPropagation()
   event.preventDefault()
   
   confirm.require({
      message: `Exclude <b>${pool.name}</b> from this and future searches?</br>You can restore it at any time using your account preferences.`,
      header: 'Confirm Exclude',
      icon: 'fal fa-exclamation-triangle',
      rejectProps: {
         label: 'Cancel',
         severity: 'secondary'
      },
      acceptProps: {
         label: 'Exclude'
      },
      accept: ( ) => {
         preferences.toggleSearchExclusion(pool.id)
         queryStore.userSearched = true
         resultStore.selectPoolResults(0) // catalog is always 0
         queryStore.targetPool = resultStore.results[0].pool.id
         routeUtils.poolChanged()
      }
   })
})

const poolFailed = ((p) => {
   return (p.statusCode != 408 && p.total == 0 && p.statusCode != 200)
})

const poolSkipped = ((p) => {
   return p.statusCode == 408 && p.total == 0
})

</script>

<style scoped lang="scss">
.p-select.p-component {
   text-align: left;
   flex: 1 1 auto;
   padding: 8px 8px 10px 8px;
   border-radius: 0.3rem 0.3rem 0 0;
   :deep(span.p-select-label) {
      font-size: .85em;
      font-weight: normal;
      padding: 0;
      .poolname {
         color: white;
      }
      .total {
         font-size: 0.9em;
         color: white
      }
   }
   &:hover {
      background: #f6f6f6;
      border-color: $uva-grey-100;
   }
}
.p-select.p-component.active {
   background-color: $uva-brand-blue;
   color: white;
   border: 1px solid $uva-brand-blue;
   :deep(.p-select-dropdown) {
      color: white;
   }
}
.more-selection {
   display: flex;
   flex-flow: row nowrap;
   gap: 10px;
   .exclude {
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0;
      border-radius: 25px;
      background: none;
      border: 2px dotted transparent;
      &:focus, &:hover {
         border-color: white;
         outline: none;
      }
   }
   .identity {
      display: flex;
      flex-direction: column;
   }
}
.more-opt {
   width: 100%;
   display: flex;
   flex-flow: row nowrap;
   justify-content: space-between;
   gap: 20px;
   padding: 2px 0;
   .total {
      font-size: 0.9em;
   }

   .total.error {
      color: $uva-text-color-dark;
      font-weight: bold;
   }
}
</style>