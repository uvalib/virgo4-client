<template>
   <v-popover class="inline">
      <span class="trigger">
         <i @click="opened" class="edit fas fa-edit"></i>
      </span>
      <div class="confirm-container" slot="popover">
         <div class="popover-header">
            <span>Rename Bookmark Folder</span>
         </div>
         <div class="message pure-form">
            <input  @keyup.enter="enterPressed"  ref="rename" type="text" v-model="folderName"/>
         </div>
         <div class="edit-controls">
            <span v-close-popover class="pure-button pure-button-secondary">Cancel</span>
            <span class="pure-button pure-button-primary"
               @click="okClicked" id="ok-rename" v-close-popover >
               OK
            </span>
         </div>
      </div>
   </v-popover>
</template>

<script>
export default {
   props: {
      original: {
         type: Object,
         required: true
      },
   },
   data: function()  {
      return {
         folderName: this.original.folder,
      }
   },
   computed: {
   },
   methods: {
      opened() {
         setTimeout(()=>{
            this.$refs.rename.focus();
         },500);
      },
      enterPressed() {
         document.getElementById("ok-rename").click()
      },
      okClicked() {
         this.$emit('rename-approved', {id: this.original.id, name: this.folderName})
      }
   }
};
</script>

<style scoped>
i.fas {
   color: #999;
   cursor: pointer;
   font-size: 1.2em;
   margin-right: 10px;
   position: relative;
   top: 2px;
}
div.popover-header {
   padding: 5px 15px;
   color: white;
   background-color: var(--color-primary-orange);
   font-weight: 500;
   text-align: center;
   border-radius: 5px 5px 0 0;
}
.confirm-container {
   background: white;
   box-shadow: 1px 1px 15px #333;
   color: var(--color-primary-text);
   font-size: 0.9em;
   font-weight: 500;
   display: inline-block;
   padding: 0;
   border-radius: 5px;
}
div.message {
   padding: 10px 10px 0 10px;
   border-left: 3px solid var(--color-primary-orange);
   border-right: 3px solid var(--color-primary-orange);
}
.message p {
   margin: 0;
   padding: 5px 0;
   text-align: right;
}
select {
   width: 100%;
}
.edit-controls {
   font-size: 0.9em;
   padding: 10px;
   text-align: right;
   border-left: 3px solid var(--color-primary-orange);
   border-right: 3px solid var(--color-primary-orange);
   border-bottom: 3px solid var(--color-primary-orange);
   border-radius: 0 0 5px 5px;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-end;
}
.edit-controls .pure-button {
   margin-left: 5px;
}
</style>
