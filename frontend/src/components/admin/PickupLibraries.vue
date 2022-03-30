<template>
   <div v-if="userStore.isAdmin" class="libary-admin">
      <h2>
         <span>Pickup Library Management</span>
         <V4Button class="edit-pl" mode="primary" @click="addClicked">Add</V4Button>
      </h2>
      <div class="content form">
         <div class="row" v-for="(pl,idx) in systemStore.allPickupLibraries" :key="`pl${pl.primaryKey}`">
            <template v-if="idx == editIndex">
               <input class="edit id" v-model="editRec.value.id" />
               <input class="edit name" v-model="editRec.value.name" />
               <div class="actions">
                  <V4Button class="edit-pl" mode="tertiary" @click="cancelClicked">Cancel</V4Button>
                  <V4Button class="edit-pl" mode="tertiary" @click="updateClicked">Update</V4Button>
               </div>
            </template>
            <template v-else>
               <div class="col id">{{pl.id}}</div>
               <div class="col name">{{pl.name}}</div>
               <div class="actions">
                  <V4Checkbox :disabled="editIndex > -1" :checked="pl.enabled" @click="enableClicked(pl)" label="Enabled"/>
                  <V4Button :disabled="editIndex > -1" class="edit-pl" mode="tertiary" @click="editClicked(idx, pl)">Edit</V4Button>
                  <Confirm class="delete" title="Confirm Delete" v-on:confirmed="deleteLibrary(pl)"
                     :id="`delete-${pl.id}`" style="margin-right: 10px"
                     :ariaLabel="`delete pickup library ${pl.name}`">
                     <div>
                        Delete pickup library '<b>{{pl.name}}</b>'?
                        <br />This cannot be reversed.
                     </div>
                  </Confirm>
               </div>
            </template>
         </div>
         <div class="row" v-if="editIndex == systemStore.allPickupLibraries.length">
            <input class="edit id" v-model="editRec.value.id" />
            <input class="edit name" v-model="editRec.value.name" />
            <div class="actions">
               <V4Button class="edit-pl" mode="tertiary" @click="cancelClicked">Cancel</V4Button>
               <V4Button class="edit-pl" mode="tertiary" @click="addConfirmed">Add</V4Button>
            </div>
         </div>
      </div>
   </div>
</template>

<script setup>
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"
import { ref } from 'vue'

const userStore = useUserStore()
const systemStore = useSystemStore()

const editIndex = ref(-1)
const editRec = ref({primaryKey: 0, id: "", name: "", enabled: false})

function addClicked() {
   editIndex.value = systemStore.allPickupLibraries.length
   editRec.value.primaryKey = 0
   editRec.value.id = ""
   editRec.value.name = ""
   editRec.value.enabled = true
}
async function addConfirmed() {
   await systemStore.addPickupLibrary(editRec)
   cancelClicked()
}
function deleteLibrary(library) {
   systemStore.deletePickupLibrary(library)
}
async function updateClicked() {
   await systemStore.updatePickupLibrary(editRec)
   cancelClicked()
}
function cancelClicked() {
   editIndex.value = -1
   editRec.value = {primaryKey: 0, id: "", name: "", enabled: false}
}
function enableClicked(pl) {
   pl.enabled = !pl.enabled
   systemStore.updatePickupLibrary(pl)
}
function editClicked(idx, rec) {
   editIndex.value = idx
   editRec.value.primaryKey = rec.primaryKey
   editRec.value.id = rec.id
   editRec.value.name = rec.name
   editRec.value.enabled = rec.enabled
}
</script>

<style lang="scss" scoped>
.libary-admin {
   h2 {
      margin: 0;
      padding: 10px 15px;
      background: var(--uvalib-grey-lightest);
      border-bottom: 1px solid var(--uvalib-grey-light);
      font-size: 1.2em;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
      display: flex;
      button.v4-button.edit-pl {
         font-size: 14px;
      }
   }
   button.v4-button.edit-pl {
      margin: 0 0 0 20px;
      font-size: 0.85em;
      padding: 5px 10px;
   }
   .content.form {
      padding: 5px 20px 20px 20px;
      display: flex;
      flex-flow: column;
      justify-content: flex-start;
      .row {
         display: flex;
         flex-flow: row nowrap;
         justify-content: flex-start;
         align-items: center;
         margin: 5px 0;
         input.edit {
            margin-right: 15px;
            border: 1px solid var(--uvalib-grey-light);
            border-radius: 5px;
            padding: 5px;
         }
         input.edit.name {
            width: 100%;
         }
         .col.id {
            width: 150px;
         }
         .actions {
            margin-left: auto;
            display: flex;
            flex-flow: row nowrap;
            justify-content: space-between;
            align-items: center;
            .delete {
               margin: 0 0 0 25px;
            }
         }
      }
   }
}
</style>