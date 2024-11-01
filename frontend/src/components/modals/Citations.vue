<template>
   <VirgoButton text rounded label="Cite" icon="fas fa-quote-right"
      @click="showDialog = true" :aria-label="props.ariaLabel" ref="trigger" />
   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Citations" @hide="closeDialog" @show="opened">
      <div class="citations-content">
         <div class="working" v-if="loading" >
            <V4Spinner message="Gathering citations..."/>
         </div>
         <p v-else-if="failed" class="error">{{citations}}</p>
         <template v-else>
            <div class="citations">
               <label>Choose a citation format</label>
               <ul class="list">
                  <li v-for="(citation,idx) in citations" :key="citation.label">
                     <VirgoButton :severity="citationType(idx)" @click="citationSelected(idx)" :label="citation.label" class="citation"/>
                  </li>
               </ul>
               <div aria-live="polite">
                  <label>{{citations[selectedIdx].label}} Citation</label>
                  <div class="citation-text">
                     <span v-html="citations[selectedIdx].value"></span>
                  </div>
               </div>
            </div>
         </template>
         <div class="messagebox" aria-live="polite">
            <span v-if="message" class="info">{{message}}</span>
         </div>
         <div class="citation-controls" >
            <VirgoButton @click="closeDialog" label="Close" severity="secondary" class="close"/>
            <VirgoButton @click="copyCitation" label="Copy Citation" v-focus/>
         </div>
      </div>
   </Dialog>
</template>

<script setup>
import { useItemStore } from "@/stores/item"
import { ref, computed} from 'vue'
import { useClipboard } from '@vueuse/core'
import Dialog from 'primevue/dialog'
import { useToast } from "primevue/usetoast"

const props = defineProps({
   itemURL: {
      type: String,
      required: true
   },
   from: {
      type: String,
      default: ""
   },
   ariaLabel: {
      type: String,
      default: ""
   }
})

const { copy } = useClipboard()
const itemStore = useItemStore()
const toast = useToast()

const loading = ref(true)
const failed = ref(false)
const citations = ref(null)
const selectedIdx = ref(0)
const message = ref("")
const showDialog = ref(false)
const trigger = ref(null)

const citationType =((idx) => {
   if ( idx == selectedIdx.value ) {
      return "primary"
   }
   return "secondary"
})

const itemID = computed(()=>{
   let parts = props.itemURL.split("/")
   return parts[parts.length - 1]
})

const citationSelected =((idx) => {
   selectedIdx.value = idx
})

const opened = (() => {
   message.value = ""
   loading.value = true
   failed.value = false
   citations.value = null

   itemStore.getCitations({format: "all", itemURL: props.itemURL}).then( (response) => {
      loading.value = false
      failed.value = false
      citations.value = response.data
   }).catch((error) => {
      loading.value = false
      failed.value = true
      citations.value = error
   })
})

const closeDialog = (() => {
   showDialog.value = false
   trigger.value.$el.focus()
})

const copyCitation = (() => {
   // strip html from citation.  this is safe since the source of the citation is trusted
   const citation = citations.value[selectedIdx.value]
   var div = document.createElement("div")
   div.innerHTML = citation.value
   const text = div.textContent
   copy(text )
   toast.add({severity:'success', summary: "Citation Copied", detail: citation.label+" citation copied to clipboard.", life: 3000})
})
</script>

<style lang="scss" scoped>
.citations-content {
   max-height: 500px;
   width: 500px;

   .messagebox {
      min-height: 30px;
   }
   .info {
      padding: 10px 0 0 0;
      text-align: center;
      color: $uva-blue-alt-A;
      font-style: italic;
      display: inline-block;
      width:100%;
   }
   .error {
      display: inline-block;
      padding: 10px 0 0 0;
      text-align: center;
      color: $uva-red-A;
      width:100%;
   }

   label {
      display: block;
      margin: 10px 0 5px 0;
      font-weight: bold;
   }

   .citations {
      .list {
         list-style: none;
         padding: 0;
         font-weight: bold;
         margin: 0 0 20px 0;
         text-align: left;
         display: flex;
         flex-flow: row wrap;
         justify-content: flex-start;
         gap: 5px 10px;
      }
   }
   .citation-controls {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-end;
      margin: 20px 0 0 0;
      padding: 0;
      gap: 5px 10px;
   }

   .working {
      text-align: center;
      font-size: 1.25em;
   }
}
</style>
