<template>
   <VirgoButton style="margin-top: 10px"  severity="secondary" size="small" label="Set filter order" @click="showDialog = true" />
   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Set Filter Order"  @show="opened">
      <div class="help">Select a facet or facets and use the<br/>arrow buttons to change ordering.</div>
      <OrderList v-model="workingFacets" dataKey="id">
         <template #option="{ option, selected }">
            <div>
               <span>{{ option.name }}</span>
            </div>
         </template>
      </OrderList>
      <template #footer>
         <VirgoButton severity="secondary" @click="showDialog = true" label="Cancel"/>
         <VirgoButton @click="applyClicked" label="Apply"/>
      </template>
   </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import OrderList from 'primevue/orderlist'
import { ref } from 'vue'

const showDialog = ref(false)
const workingFacets = ref([])

const emit = defineEmits( ['apply'])
const props = defineProps({
   facets: {
      type: Array,
      reqired: true
   },
})

const applyClicked = (() => {
   emit('apply', workingFacets.value)
   showDialog.value = false
})

const opened = (() => {
   workingFacets.value = props.facets.map( f => ({id: f.id, name: f.name}) )
})


</script>

<style lang="scss" scoped>
.help {
   margin-bottom: 15px;
}
:deep(.p-listbox-list-container) {
   .p-listbox-option {
      color: $uva-grey-B;
      &:hover {
         background-color: $uva-blue-alt-400 !important;
      }
   }
   .p-listbox-option.p-listbox-option-selected {
      background-color: $uva-blue-alt-200 !important;
      color: $uva-grey-B !important;
   }
}
</style>
