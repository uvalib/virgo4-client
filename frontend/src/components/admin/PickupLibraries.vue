<template>
   <div v-if="userStore.isAdmin" class="libary-admin">
      <h3>
         <span>Pickup Library Management</span>
         <VirgoButton @click="addPickupLibraryClicked">Add</VirgoButton>
      </h3>
      <div class="content form">
         <DataTable :value="systemStore.allPickupLibraries" size="small" dataKey="primaryKey"
            editMode="row" @row-edit-save="saveChanges" @row-edit-cancel="editCanceled" v-model:editingRows="editRec"
         >
            <Column field="enabled" header="Enabled" style="width: 6rem">
               <template #body="slotProps">
                  <span class="enabled" v-if="slotProps.data.enabled">Yes</span>
                  <span class="disabled" v-else>No</span>
               </template>
               <template #editor="{ data, field }">
                  <ToggleButton v-model="data[field]"onLabel="Yes" offLabel="No" />
               </template>
            </Column>
            <Column field="id" header="ID">
               <template #editor="{ data, field }">
                  <InputText v-model="data[field]" fluid />
                </template>
            </Column>
            <Column field="name" header="Name">
               <template #editor="{ data, field }">
                  <InputText v-model="data[field]" fluid />
                </template>
            </Column>
            <Column field="url" header="URL">
               <template #body="slotProps">
                  <a  v-if="slotProps.data.url" :href="slotProps.data.ur" target="_blank">{{ slotProps.data.url }}</a>
                  <span v-else class="none">None</span>
               </template>
               <template #editor="{ data, field }">
                  <InputText v-model="data[field]" fluid />
                </template>
            </Column>
            <Column :rowEditor="true" style="width: 6rem" bodyStyle="text-align:center"></Column>
            <Column style="width: 2rem" bodyStyle="text-align:center">
               <template #body="slotProps">
                  <VirgoButton @click="deleteLibrary(slotProps.data)" rounded text icon="fas fa-trash"/>
               </template>
            </Column>
         </DataTable>
      </div>
   </div>
</template>

<script setup>
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"
import { useConfirm } from "primevue/useconfirm"
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import ToggleButton from 'primevue/togglebutton'
import { ref } from 'vue'

const userStore = useUserStore()
const systemStore = useSystemStore()
const confirm = useConfirm()

const editRec = ref([])

const addPickupLibraryClicked = (() => {
   const newRec = {
      primaryKey:  0,
      id: "",
      name: "",
      enabled: true
   }
   systemStore.allPickupLibraries.push(newRec)
   editRec.value = [newRec]
})

const deleteLibrary = ( (library) => {
   confirm.require({
      message: `Delete pickup library <b>${library.id}</b>?<br/>This cannot be reversed.<br/><br/>Continue?`,
      header: 'Confirm Delete',
      icon: 'fal fa-exclamation-triangle',
      rejectProps: {
         label: 'Cancel',
         severity: 'secondary'
      },
      acceptProps: {
         label: 'Delete'
      },
      accept: () => {
         systemStore.deletePickupLibrary(library)
      }
   })
})

const editCanceled = (event) => {
   let { newData } = event
   if ( newData.primaryKey == 0) {
      systemStore.allPickupLibraries.pop()
   }
}

const saveChanges = ( (event) => {
   let { newData } = event
   if ( newData.primaryKey == 0) {
      systemStore.addPickupLibrary(editRec.value)
   } else {
      systemStore.updatePickupLibrary(newData)
   }
})
</script>

<style lang="scss" scoped>
.libary-admin {
   h3 {
      margin: 0;
      padding: 10px 15px;
      background: $uva-grey-200;
      border-bottom: 1px solid $uva-grey-100;
      font-size: 1.2em;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
      display: flex;
      button {
         font-size: 14px;
         padding: 5px 10px;
      }
   }
   .content.form {
      padding: 20px;
      .none {
         color: $uva-grey-50;
         font-style: italic;
      }
      .enabled {
         background-color: $uva-green-A;
         color: white;
         padding: 6px 10px;
         border-radius: 0.3rem;
         width: 90%;
         display: inline-block;
         text-align: center;
      }
      .disabled {
         background-color: $uva-red-A;
         color: white;
         padding: 6px 10px;
         border-radius: 0.3rem;
         width: 90%;
         display: inline-block;
         text-align: center;
      }
   }
}
</style>