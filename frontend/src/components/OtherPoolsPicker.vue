<template>
   <Select v-model="selectedPoolID" :class="{active: selectedPoolID}"
      :options="pools" optionLabel="pool.name" optionValue="pool.id"
      @change="emit('selected', selectedPoolID)"
   >
      <template #value>
         <div v-if="selectedPoolID" class="more-selection">
            <div class="poolname">{{ selection.pool.name }}</div>
            <div class="total">({{  selection.total }})</div>
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
import { ref, computed, watch } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useResultStore } from "@/stores/result"
import Select from 'primevue/select'
import { storeToRefs } from "pinia"
import * as utils from '../utils'

const resultStore = useResultStore()
const systemStore = useSystemStore()

const selectedPoolID = ref("")

const emit = defineEmits( ['selected' ] )

const { selectedResultsIdx } = storeToRefs(resultStore)
watch( selectedResultsIdx, (newValue) => {
   if (newValue < systemStore.maxPoolTabs) {
      selectedPoolID.value = ""
   }
})

const pools = computed(()=>{
   let opts = []
   let others = resultStore.results.slice(systemStore.maxPoolTabs).sort( (a,b) => {
      if (a.pool.name < b.pool.name) return -1
      if (a.pool.name > b.pool.name) return 1
      return 0
   })

   others.forEach( r=>{
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
   return opts
})

const selection = computed (() => {
   return resultStore.results.find( r => r.pool.id == selectedPoolID.value)
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
   border-radius: 4px 4px 0 0;
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
      border-color: var(--uvalib-grey-light);
   }
}
.p-select.p-component.active {
   background-color: var(--uvalib-brand-blue);
   color: white;
   border: 1px solid var(--uvalib-brand-blue);
   :deep(.p-select-dropdown) {
      color: white;
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