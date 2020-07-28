<template>
   <V4Modal :id="id" title="Select Search Template" ref="templatemodal" 
      firstFocusID="searchsel" lastFocusID="select-ok" :buttonID="`${id}-open`" @opened="opened">
      <template v-slot:button>
         <V4Button mode="tertiary" @click="$refs.templatemodal.show()" :id="`${id}-open`"
            aria-label="select search template"
         >
            Select Search Template
         </V4Button>
      </template>
      <template v-slot:content>
         <div class="move message pure-form">
            <select tabindex="0" id="searchsel" ref="searchsel" 
               v-model="selectedTemplate" @keydown.shift.tab.stop.prevent="backTabSelect">
               <option value="">Select an advanced search template</option>
               <option v-for="(template,idx) in templates"
                  :key="`t${idx}`" :value="template.id ">
                  {{ template.name }}
               </option>
            </select>
         </div>
      </template>
      <template v-slot:controls>
         <V4Button mode="tertiary" id="move-cancel" @click="cancelClicked">
            Cancel
         </V4Button>
      </template>
   </V4Modal>
</template>

<script>
export default {
   props: {
      templates: {
         type: Array,
         required: true
      },
      id: {
         type: String,
         required: true
      }
   },
   data: function()  {
      return {
         selectedTemplate: "",
      }
   },
   watch: {
      selectedTemplate() {
         if (this.selectedTemplate != "" ) {
            let tpl = this.templates.find( t => t.id == this.selectedTemplate)
            this.$store.commit("query/restoreTemplate", tpl.template)
            this.$refs.templatemodal.hide()
            setTimeout( ()=> {
               let terms = document.getElementsByClassName("term")
               if (terms.length > 0) {
                  terms[0].focus()
                  terms = document.getElementsByClassName("search-term")
                  if (terms.length > 0) {
                     this.$utils.scrollToItem(terms[0])
                  }
               }
            }, 150)
         }
      }
   },
   methods: {
      opened() {
         this.selectedTemplate = ""
      },
      cancelClicked() {
         this.$refs.templatemodal.hide()
      },
      backTabSelect() {
         this.$refs.templatemodal.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.templatemodal.lastFocusTabbed()
      },
   }
};
</script>

<style lang="scss" scoped>
.move.message.pure-form {
   select {
      width: 100%;
   }
}
</style>
