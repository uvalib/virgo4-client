<template>
   <div v-if="isAdmin" class="libary-admin">
      <h2>Pickup Library Management</h2>
      <div class="content form">
         <div class="row" v-for="(pl,idx) in pickupLibraries" :key="`pl${pl.primaryKey}`">
            <template v-if="idx == editIndex">
               <input class="edit id" v-model="editRec.id" />
               <input class="edit name" v-model="editRec.name" />
               <div class="actions">
                  <V4Button class="edit-pl" mode="tertiary" @click="cancelClicked">Cancel</V4Button>
                  <V4Button class="edit-pl" mode="tertiary" @click="updateClicked">Update</V4Button>
               </div>
            </template>
            <template v-else>
               <div class="col id">{{pl.id}}</div>
               <div class="col name">{{pl.name}}</div>
               <div class="actions">
                  <V4Checkbox :disabled="editIndex > -1" :checked="pl.enabled" @click="enableClicked(pl)">Enabled</V4Checkbox>
                  <V4Button :disabled="editIndex > -1" class="edit-pl" mode="tertiary" @click="editClicked(idx, pl)">Edit</V4Button>
               </div>
            </template>
         </div>
      </div>
   </div>
</template>
<script>
import { mapState, mapGetters } from "vuex";

export default {
   data: function()  {
      return {
         editIndex: -1,
         editRec: {primaryKey: 0, id: "", name: "", enabled: false}
      }
   },
   computed: {
      ...mapState({
          pickupLibraries : state => state.system.allPickupLibraries,
      }),
      ...mapGetters({
         isAdmin: "user/isAdmin",
      })
   },
   methods: {
      async updateClicked() {
         await this.$store.dispatch("system/updatePickupLibrary", this.editRec)
         this.cancelClicked()
      },
      cancelClicked() {
         this.editIndex = -1
         this.editRec = {primaryKey: 0, id: "", name: "", enabled: false}
      },
      enableClicked(pl) {
         pl.enabled = !pl.enabled
         this.$store.dispatch("system/updatePickupLibrary", pl)
      },
      editClicked(idx, rec) {
         this.editIndex = idx
         this.editRec.primaryKey = rec.primaryKey
         this.editRec.id = rec.id
         this.editRec.name = rec.name
         this.editRec.enabled = rec.enabled
      },
   },
};
</script>
<style lang="scss" scoped>
.libary-admin {
   h2 {
      margin: 0;
      padding: 10px 15px;
      background: var(--uvalib-grey-lightest);
      border-bottom: 1px solid var(--uvalib-grey-light);
      font-size: 1.2em;
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
            button.v4-button.edit-pl {
               margin: 0 0 0 20px;
               font-size: 0.85em;
               padding: 5px 10px;
            }
         }
      }
   }
}
</style>