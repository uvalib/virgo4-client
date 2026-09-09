<template>
   <h2>Bound With</h2>
   <div class="items">
      <div class="parent"  v-for="boundIn in item.availability.boundWith">
         <div><strong>Bound in Parent</strong></div>
         <router-link class="info"  :to="'/items/u' + boundIn.titleID" :class="{current: isCurrent(boundIn)}">
            <div>{{ boundIn.callNumber }}</div>
            <div>{{ boundIn.title }}</div>
         </router-link>
         <DataTable :value="boundIn.children" dataKey="titleID" :alwaysShowPaginator="true" size="small"
               :paginator="true" :rows="10" :rowsPerPageOptions=[10,50,100] showGridlines stripedRows 
               paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
               currentPageReportTemplate="Page {currentPage} of {totalPages}" paginatorPosition="top"
               sortField="callNumber" :sortOrder="1" :rowStyle="rowStyle" 
               :pt="{
                  pcPaginator: {
                     pcRowPerPageDropdown: {
                        label: {
                           'aria-controls': null
                        }
                     }
                  }
               }"
         >
            <template #paginatorstart>
               <strong>Children</strong>
            </template>
            <Column field="callNumber" header="Call Number" sortable>
               <template #body="slotProps">
                  <router-link :to="'/items/u' + slotProps.data.titleID">{{ slotProps.data.callNumber }}</router-link>
               </template>
            </Column>
            <Column field="title" header="Title" sortable>
               <template #body="slotProps">
                  <router-link :to="'/items/u' + slotProps.data.titleID">{{ slotProps.data.title }}</router-link>
               </template>
            </Column>
         </DataTable>
      </div>
   </div>
</template>

<script setup>
import { useItemStore } from "@/stores/item"
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const item = useItemStore()

const isCurrent = ((data) => {
   const tgtIdentifer = "u"+data.titleID
   return (tgtIdentifer == item.details.identifier)
})

const rowStyle = (data) => {
   const tgtIdentifer = "u"+data.titleID
   if (tgtIdentifer == item.details.identifier) {
        return { background: "#E6F2F7" }
   }
};
</script>

<style lang="scss" scoped>
.items {
   display: flex;
   flex-direction: column;
   gap: 20px;
   .parent {
      display: flex;
      flex-direction: column;
      border: 1px solid $uva-grey-100;
      border-radius: 0.3rem;
      padding: 15px;
      gap: 10px;
      .info {
         display: flex;
         flex-flow: row wrap;
         gap: 15px;

      }
      .info.current {
         background-color: $uva-blue-alt-400;
         padding: 5px 10px;
         border-radius: 0.3rem;
      }
      :deep(.p-paginator) {
         padding: 0 0 5px 0;
         border-bottom: 1px solid $uva-grey-100;;
         border-radius: 0;
         margin-bottom: 10px;
      }

   }
}
</style>