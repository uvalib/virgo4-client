<template>
   <V4Modal :id="id" title="Print Details" ref="printmodal"
      firstFocusID="titleinput" lastFocusID="print-ok" :buttonID="`${id}-open`" @opened="opened">
      <template v-slot:button>
         <V4Button mode="primary" @click="$refs.printmodal.show()" :id="`${id}-open`"
            aria-label="print details about selected bookmarks"
         >
            Print
         </V4Button>
      </template>
      <template v-slot:content>
         <template v-if="bookmarks.length == 0">
            <p>No bookmarks have been selected to print.</p>
         </template>
          <template v-else-if="bookmarks.length > 100">
            <p>
               Printing is currently limted to 100 items.<br/>
               Please limit your selections and try again.
            </p>
         </template>
         <template v-else>
            <div class="print message pure-form">
               <label for="titleinput">Title for Printout (optional)</label>
               <input ref="titleinput" id="titleinput" type="text" v-model="title"
                  @keyup.enter="printClicked"
                  @keydown.shift.tab.stop.prevent="backTabTitle"/>
               <label for="notes">Notes (optional)</label>
               <textarea ref="notes" id="notes" v-model="notes" @keyup.enter="printClicked"></textarea>
               <p class="note">After clicking Print, your printable results will open in another browser tab.</p>
            </div>
         </template>
      </template>
      <template v-if="bookmarks.length > 0" v-slot:controls>
         <V4Button mode="tertiary" id="print-cancel" @click="cancelClicked">
            Cancel
         </V4Button>
         <V4Button mode="primary" id="print-ok" @click="printClicked" :focusNextOverride="true" @tabnext="nextTabOK">
            Print
         </V4Button>
      </template>
   </V4Modal>
</template>

<script>
export default {
   props: {
      bookmarks: {
         type: Array,
         required: true
      },
      srcFolder: {
         type: Number,
         required: true
      },
      id: {
         type: String,
         required: true
      }
   },
   data: function()  {
      return {
         title: "",
         notes: ""
      }
   },
   computed: {
   },
   methods: {
      opened() {
         this.title = ""
         this.notes = ""
         if (this.bookmarks.length == 0 ){
            let btn = document.getElementById(this.id+"-close")
            btn.focus()
         }
      },
      async printClicked() {
         this.$analytics.trigger('Bookmarks', 'PRINT_CLICKED')
         let data = { title: this.title, notes: this.notes, folderID: this.srcFolder, bookmarkIDs: this.bookmarks}
         await this.$store.dispatch("bookmarks/printBookmarks", data )
         this.$refs.printmodal.hide()
      },
      cancelClicked() {
         this.$refs.printmodal.hide()
      },
      backTabTitle() {
         this.$refs.printmodal.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.printmodal.lastFocusTabbed()
      },
   }
};
</script>

<style lang="scss" scoped>
.print.message.pure-form {
   textarea, input {
      width: 100%;
      margin: 5px 0 35px 0;
      min-width: 400px;
   }
   label {
      display: block;
   }
   .note {
      margin: 10px 25px;
   }
}
</style>
