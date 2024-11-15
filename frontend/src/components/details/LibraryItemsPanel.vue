<template>
   <section class="library-items">
      <div class="panel">
         <div class="gutter"></div>
         <div class="content">
            <h4>
               <template v-if="libraryURL">
                  <a :href="libraryURL" target="_blank" :aria-describedby="`${props.library.id}-link`">{{ props.library.name }}<i class="fal fa-external-link-alt"></i></a>
                  <span :id="`${props.library.id}-link`" class="screen-reader-text">(opens in a new window)</span>
               </template>
               <span v-else>{{props.library.name}}</span>
            </h4>
            <DataTable :value="library.items" dataKey="barcode" columnResizeMode="expand"
               :alwaysShowPaginator="false" size="small" ref="libdata"
               :paginator="true" :rows="10" :rowsPerPageOptions=pageSizes
               paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
               currentPageReportTemplate="Page {currentPage} of {totalPages}" paginatorPosition="bottom"
               v-model:filters="filters" :globalFilterFields="['call_number', 'barcode']" @update:first="firstChanged" @update:rows="pageSizeChanged"
            >
               <template #paginatorstart>
                  <span>{{ countDetails }}</span>
               </template>
               <template #paginatorend>
                  <div class="filter" v-if="library.items.length > 7">
                     <label>
                        Filter {{ props.library.name }} items
                        <InputText v-model="filters['global'].value" />
                     </label>
                  </div>
               </template>
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
const currFirst = ref(0)
const pageSize = ref(10)


const pageSizes = computed(() => {
   let out = [10]
   if ( props.library.items.length >= 25 ) {
      out.push(25)
   }
   if ( props.library.items.length >= 50 ) {
      out.push(50)
   }
   if ( props.library.items.length >= 100 ) {
      out.push(100)
   }
   return out
})
const countDetails = computed( () => {
   let last = currFirst.value+pageSize.value
   last = Math.min(last,props.library.items.length)
   return `${currFirst.value+1}-${last} of ${props.library.items.length}`

})
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

const pageSizeChanged = (( newSize) => {
   console.log("size: "+newSize)
   pageSize.value = newSize
})
const firstChanged = (( newFirst) => {
   console.log("first: "+newFirst)
   currFirst.value = newFirst
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
      border-radius: 0.3rem;
      .gutter {
         flex: 0 0 17px;
         border-radius: 0.3rem  0 0 0.3rem;
         background-color: $uva-blue-alt-300;
      }
      .content {
         flex: 1;
         padding: 1rem;
         border: 1px solid $uva-grey-100;
         border-radius:  0 0.3rem  0.3rem 0;
         border-left: 0;
         h4{
            font-weight: bold;
            padding-bottom: 1rem;
            border-bottom: 1px solid $uva-grey-100;
            margin: 0 0 1rem 0;
            display: flex;
            flex-flow: row wrap;
            justify-content: space-between;
            align-items: flex-end;
            a {
               font-weight: bold;
               i {
                  display: inline-block;
                  margin-left: 10px;
               }
            }
         }
      }
   }
}
</style>
