<template>
   <V4Modal :id="id" title="Rename Bookmark Folder" ref="renamemodal" 
      firstFocusID="rename" :buttonID="`${id}-open`" @opened="opened" >
      <template v-slot:button>
         <V4Button mode="icon" @click="$refs.renamemodal.show()" :id="`${id}-open`"
             :aria-label="`rename bookmark folder ${folderInfo.folder}`"
             style="margin: 0 5px"
         >
            <i class="rename fas fa-edit"></i>
         </V4Button>
      </template>
      <template v-slot:content>
         <div class="message pure-form">
            <input @keyup.enter="okClicked"  id="rename" type="text" v-model="folderName" 
               @keydown.shift.tab.stop.prevent="backTabInput"
               aria-required="true" aria-label="new folder name" required="required"/>
         </div>
         <p class="error" v-if="error">{{error}}</p>
       </template>
       <template v-slot:controls>
         <V4Button mode="tertiary" id="rename-cancel" @click="$refs.renamemodal.hide()">
            Cancel
         </V4Button>
         <V4Button mode="primary" id="rename-ok" @click="okClicked" :focusNextOverride="true" @tabnext="nextTabOK">
            OK
         </V4Button>
      </template>
   </V4Modal>
</template>

<script>
export default {
   props: {
      id: {
         type: String,
         required: true
      },
      folderInfo: {
         type: Object,
         required: true
      },
   },
   data: function()  {
      return {
         folderName: this.folderInfo.folder,
         error: ""
      }
   },
   methods: {
      opened() {
         this.folderName = this.folderInfo.folder
         this.error = ""
      },
      async okClicked() {
         this.error = ""
         if ( this.folderName == "") {
           this.error =  "A folder name is required"
         } else {
            await this.$store.dispatch("bookmarks/renameFolder",  {id: this.folderInfo.id, name: this.folderName})
            this.$refs.renamemodal.hide()
         }
      },
      nextTabOK() {
         this.$refs.pop.lastFocusTabbed()
      },
      backTabInput() {
         this.$refs.renamemodal.firstFocusBackTabbed()
      }
   }
}
</script>

<style lang="scss" scoped>
i.rename {
   color: var(--uvalib-grey-dark);
   cursor: pointer;
   font-size: 1.2em;
   padding: 2px;
}
p.error {
   font-size: 0.9em;
   color: var(--uvalib-red-emergency);
   text-align: center;
   padding: 0;
   margin: 10px;
}
.message {
   margin: 10px 5px 0 5px;
   input {
      box-sizing: border-box;
      width:100%;
   }
}
</style>
