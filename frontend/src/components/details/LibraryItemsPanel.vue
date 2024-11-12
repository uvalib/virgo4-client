<template>
   <section class="library-items">
      <div class="panel">
         <div class="gutter"></div>
         <div class="content">
            <h4>
               <a v-if="libraryURL" :href="libraryURL" target="_blank">{{ props.library.name }}</a>
               <span v-else>{{props.library.name}}</span>
               <IconField v-if="library.items.length > 7">
                  <InputIcon class="fal fa-search" />
                  <InputText v-model="filters['global'].value" placeholder="Search" />
               </IconField>
            </h4>
            <DataTable :value="library.items" dataKey="barcode" columnResizeMode="expand"
               :alwaysShowPaginator="false" size="small"
               :paginator="true" :rows="10" :rowsPerPageOptions="[10,25,50]"
               paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
               currentPageReportTemplate="{first} - {last} of {totalRecords}" paginatorPosition="bottom"
               v-model:filters="filters" :globalFilterFields="['call_number', 'barcode']"
            >
               <Column field="current_location" header="Location" />
               <Column field="call_number" header="Call Number" />
               <Column field="barcode" header="Barcode">
                  <template #body="slotProps">
                     <AvailabilityNotice v-if="slotProps.data.notice" :label="slotProps.data.barcode" :message="slotProps.data.notice" />
                     <span v-else>{{ slotProps.data.barcode }}</span>
                  </template>
               </Column>
            </DataTable>
         </div>
      </div>
   </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import AvailabilityNotice from "@/components/disclosures/AvailabilityNotice.vue"
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import { FilterMatchMode } from '@primevue/core/api'
import { useSystemStore } from "@/stores/system"

const system = useSystemStore()

const libraryURL = computed( () => {
   const lib = system.allPickupLibraries.find( pl => pl.id == (props.library.id) )
   if ( lib ) {
      return lib.url
   }
   return null
})

const filters = ref({
   global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const props = defineProps({
   library: {
      type: Object,
      required: true
   },
})
</script>

<style lang="scss" scoped>
:deep(td) {
   width: 32%;
}
:deep(.p-datatable-paginator-bottom) {
   margin-top: 5px;
   .p-paginator {
      padding-bottom: 0;
   }
}
.library-items {
   .panel {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: stretch;
      border-radius: 5px;
      .gutter {
         flex: 0 0 17px;
         border-radius: 5px  0 0 5px;
         background-color: $uva-blue-alt-300;
      }
      .content {
         flex: 1;
         padding: 20px;
         border: 1px solid $uva-grey-100;
         border-radius:  0 5px  5px 0;
         border-left: 0;
         h4{
            font-weight: bold;
            padding-bottom: 15px;
            border-bottom: 1px solid $uva-grey-100;
            margin: 0 0 10px 0;
            display: flex;
            flex-flow: row wrap;
            justify-content: space-between;
            align-items: flex-end;
         }
      }
   }
}
</style>
