<template>
   <V4Popover class="rename inline" :id="id" ref="pop" title="Rename Bookmark Folder" :alabel="`Rename bookmark folder ${original.folder}`"
      firstFocusID="rename" lastFocusID="rename-ok" triggerType="icon" @opened="popoverOpened">
      <template v-slot:trigger>
         <i class="rename fas fa-edit"></i>
      </template>
      <template v-slot:content>
         <div class="message pure-form">
            <input  @keyup.enter="enterPressed"  id="rename" type="text" v-model="folderName" @keydown.shift.tab.stop.prevent="backTabInput"
               aria-required="true" aria-label="new folder name" required="required"/>
         </div>
         <p class="error" v-if="error">{{error}}</p>
      </template>
      <template v-slot:controls>
         <V4Button mode="tertiary" id="rename-cancel" @click="cancelClicked">
            Cancel
         </V4Button>
         <V4Button mode="primary" id="rename-ok" @click="okClicked" :focusNextOverride="true" @tabnext="nextTabOK">
            OK
         </V4Button>
      </template>
   </V4Popover>
</template>

<script>
export default {
   props: {
      alabel: String,
      original: {
         type: Object,
         required: true
      },
      id: {
         type: String,
         required: true
      }
   },
   data: function()  {
      return {
         folderName: this.original.folder,
         error: ""
      }
   },
   methods: {
      popoverOpened() {
         this.folderName = this.original.folder
         this.error = ""
      },
      backTabInput() {
         this.$refs.pop.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.pop.lastFocusTabbed()
      },
      enterPressed() {
         this.okClicked()
      },
      okClicked() {
         this.error = ""
         if ( this.folderName == "") {
           this.error =  "A folder name is required"
         } else {
            this.$emit('rename-approved', {id: this.original.id, name: this.folderName})
            this.$refs.pop.hide()
         }
      },
      cancelClicked() {
         this.$refs.pop.hide()
      }
   }
};
</script>

<style lang="scss" scoped>
.rename {
   i.rename {
      color: var(--uvalib-grey-dark);
      cursor: pointer;
      font-size: 1.2em;
      padding: 2px;
   }
}
p.error {
   font-size: 0.9em;
   color: var(--uvalib-red-emergency);
   text-align: center;
   padding: 0;
   margin: 10px 0 0 0;
}
</style>
