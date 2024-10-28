<template>
   <div v-if="userStore.isAdmin" class="libary-admin">
      <h3>
         <span>Pickup Library Management</span>
         <VirgoButton @click="addPickupLibraryClicked" :disabled="editIndex == systemStore.allPickupLibraries.length">Add</VirgoButton>
      </h3>
      <div class="content form">
         <div class="row" v-for="(pl,idx) in systemStore.allPickupLibraries" :key="`pl${pl.primaryKey}`">
            <template v-if="idx == editIndex">
               <input class="edit id" v-model="editRec.id" />
               <input class="edit name" v-model="editRec.name" />
               <div class="actions">
                  <VirgoButton severity="secondary" @click="cancelClicked">Cancel</VirgoButton>
                  <VirgoButton severity="secondary" @click="updateClicked">Update</VirgoButton>
               </div>
            </template>
            <template v-else>
               <div class="col id">{{pl.id}}</div>
               <div class="col name">{{pl.name}}</div>
               <div class="actions">
                  <Checkbox :disabled="editIndex > -1" v-model="pl.enabled" :inputId="`pl${pl.primaryKey}`" :binary="true"  @change="enableClicked(pl)" />
                  <label :for="`pl${pl.primaryKey}`" class="cb-label">Enabled</label>
                  <VirgoButton :disabled="editIndex > -1" severity="secondary" @click="editClicked(idx, pl)" label="Edit" />
                  <VirgoButton :disabled="editIndex > -1" severity="danger" @click="deleteLibrary(pl)" label="Delete" />
               </div>
            </template>
         </div>
         <div class="row add" v-if="editIndex == systemStore.allPickupLibraries.length">
            <input type="text" class="edit id" v-model="editRec.id" />
            <input  type="text" class="edit name" v-model="editRec.name" />
            <div class="actions">
               <VirgoButton severity="secondary" @click="cancelClicked">Cancel</VirgoButton>
               <VirgoButton severity="secondary" @click="addConfirmed">Add</VirgoButton>
            </div>
         </div>
      </div>
   </div>
</template>

<script setup>
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"
import { useConfirm } from "primevue/useconfirm"
import Checkbox from 'primevue/checkbox'
import { ref } from 'vue'

const userStore = useUserStore()
const systemStore = useSystemStore()
const confirm = useConfirm()

const editIndex = ref(-1)
const editRec = ref({primaryKey: 0, id: "", name: "", enabled: false})

const addPickupLibraryClicked = (() => {
   editIndex.value = systemStore.allPickupLibraries.length
   editRec.value.primaryKey = 0
   editRec.value.id = ""
   editRec.value.name = ""
   editRec.value.enabled = true
})

const addConfirmed = ( async () => {
   await systemStore.addPickupLibrary(editRec.value)
   cancelClicked()
})

const deleteLibrary = ( (library) => {
   confirm.require({
      message: `Delete pickup library <b>${library.id}</b>?<br/>This cannot be reversed.<br/><br/>Continue?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
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

const updateClicked = ( async () => {
   await systemStore.updatePickupLibrary(editRec.value)
   cancelClicked()
})

const cancelClicked = (() => {
   editIndex.value = -1
   editRec.value = {primaryKey: 0, id: "", name: "", enabled: false}
})

const enableClicked = ((pl) => {
   systemStore.updatePickupLibrary(pl)
})

const editClicked = ( (idx, rec) => {
   editIndex.value = idx
   editRec.value.primaryKey = rec.primaryKey
   editRec.value.id = rec.id
   editRec.value.name = rec.name
   editRec.value.enabled = rec.enabled
})
</script>

<style lang="scss" scoped>
.libary-admin {
   h3 {
      margin: 0;
      padding: 10px 15px;
      background: var(--uvalib-grey-lightest);
      border-bottom: 1px solid var(--uvalib-grey-light);
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
      padding: 5px 20px 20px 20px;
      display: flex;
      flex-flow: column;
      justify-content: flex-start;

      .row.add {
         margin-top: 20px;
      }
      .row {
         display: flex;
         flex-flow: row nowrap;
         justify-content: flex-start;
         align-items: stretch;
         margin: 5px 0;
         gap: 10px;
         input.edit.name {
            width: 100%;
         }
         .col.id {
            width: 150px;
         }
         .actions {
            display: flex;
            flex-flow: row nowrap;
            justify-content: flex-end;
            align-items: center;
            flex-grow: 1;
            gap: 10px;
         }
      }
   }
}
</style>