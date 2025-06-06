<template>
   <div class="codes">
      <div class="working" v-if="systemStore.working">
         <V4Spinner message="Looking up codes..." />
      </div>
      <Tabs value="lib-codes">
         <TabList>
            <Tab value="lib-codes">Library Codes</Tab>
            <Tab value="loc-codes">Location Codes</Tab>
         </TabList>
         <TabPanels>
            <TabPanel value="lib-codes">
               <DataTable :value="systemStore.libraryCodes" size="small" exportFilename="libcodes"
                  showGridlines stripedRows ref="libcodes" dataKey="id">
                  <template #header>
                     <VirgoButton severity="secondary" size="small" label="Export CSV" @click="exportLibCodes"/>
                  </template>
                  <Column field="id" header="ID" sortable/>
                  <Column field="key" header="Code" sortable/>
                  <Column field="description" header="Name" sortable/>
                  <Column field="on_shelf" header="On Shelf" sortable>
                     <template #body="slotProps">
                        <span :class="getText(slotProps.data.on_shelf).toLowerCase()">{{ getText(slotProps.data.on_shelf) }}</span>
                     </template>
                  </Column>
                  <Column field="circulating" header="Circulating" sortable>
                     <template #body="slotProps">
                        <span :class="getText(slotProps.data.circulating).toLowerCase()">{{ getText(slotProps.data.circulating) }}</span>
                     </template>
                  </Column>
               </DataTable>
            </TabPanel>
            <TabPanel value="loc-codes">
               <DataTable :value="systemStore.locationCodes" size="small" exportFilename="loccodes"
                  showGridlines stripedRows ref="libcodes" dataKey="id">
                  <template #header>
                     <VirgoButton severity="secondary" size="small" label="Export CSV" @click="exportLocCodes"/>
                  </template>
                  <Column field="id" header="ID" sortable/>
                  <Column field="key" header="Code" sortable/>
                  <Column field="description" header="Name" sortable/>
                  <Column field="online" header="Online" sortable>
                     <template #body="slotProps">
                        <span :class="getText(slotProps.data.online).toLowerCase()">{{ getText(slotProps.data.online) }}</span>
                     </template>
                  </Column>
                  <Column field="shadowed" header="Shadowed" sortable>
                     <template #body="slotProps">
                        <span :class="getText(slotProps.data.shadowed).toLowerCase()">{{ getText(slotProps.data.shadowed) }}</span>
                     </template>
                  </Column>
                  <Column field="on_shelf" header="On Shelf" sortable>
                     <template #body="slotProps">
                        <span :class="getText(slotProps.data.on_shelf).toLowerCase()">{{ getText(slotProps.data.on_shelf) }}</span>
                     </template>
                  </Column>
                  <Column field="circulating" header="Circulating" sortable>
                     <template #body="slotProps">
                        <span :class="getText(slotProps.data.circulating).toLowerCase()">{{ getText(slotProps.data.circulating) }}</span>
                     </template>
                  </Column>
               </DataTable>
            </TabPanel>
         </TabPanels>
      </Tabs>
   </div>
</template>

<script setup>
import { useSystemStore } from "@/stores/system"
import { onMounted,ref } from "vue"
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const systemStore = useSystemStore()

function getText( flag ) {
   if (flag) {
      return 'Yes'
   }
   return 'No'
}

const libcodes = ref()
const loccodes = ref()

onMounted(() => {
  systemStore.getCodes()
})

const exportLibCodes = (() => {
   libcodes.value.exportCSV()
})

const exportLocCodes = (() => {
   loccodes.value.exportCSV()
})

</script>

<style scoped lang="scss">
:deep(td) {
   border: 1px solid $uva-grey-200 !important;
}
:deep(th) {
   padding: 0.5rem 0.75rem !important;
   border: 1px solid $uva-grey-100 !important;
   background-color: $uva-grey-200;
   border-top: 0;
}
.codes {
   min-height: 400px;
   position: relative;
   margin: 2vw auto 0 auto;
   text-align: left;
   padding-bottom: 50px;
}
span.yes {
   background: $uva-green-A;
   padding: 0.5rem 1rem;
   border-radius: 0.3rem;
   display: inline-block;
   color: white;
   font-size: 0.9em;
   width: 50px;
}
span.no {
   background: $uva-red-A;
   padding: 0.5rem 1rem;
   border-radius: 0.3rem;
   display: inline-block;
   color: white;
   font-size: 0.9em;
   width: 50px;
}
@media only screen and (min-width: 768px) {
   div.codes  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.codes  {
       width: 95%;
   }
}
.working {
   text-align: center;
   font-size: 1.25em;
}

</style>
