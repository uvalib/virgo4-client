<template>
   <VirgoButton text rounded @click="showDialog = true" :aria-label="props.ariaLabel"
      ref="trigger" :class="{toolbar: props.format=='all'}">
      <span>{{ props.buttonLabel }}</span><i class="fas fa-quote-right"></i>
   </VirgoButton>

   <Dialog v-model:visible="showDialog" :modal="true" position="top" :header="props.title" @hide="closeDialog" @show="opened">
      <div class="citations-content">
         <div class="working" v-if="loading" >
            <V4Spinner message="Gathering citations..."/>
         </div>
         <p v-else-if="failed" class="error">{{citations}}</p>
         <template v-else>
            <div class="citations" v-if="props.format=='all'">
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
            <div v-else class="citation">
               <span v-html="citations[0].value"></span>
            </div>
         </template>
         <div class="messagebox" aria-live="polite">
            <span v-if="message" class="info">{{message}}</span>
         </div>
         <div class="citation-controls" >
            <VirgoButton v-if="props.format == 'all'" @click="downloadRISClicked" aria-label="download RIS citation"
               label="Download RIS" icon="fal fa-download" iconPos="right" severity="secondary"/>
            <VirgoButton @click="copyCitation" label="Copy Citation" v-focus severity="secondary"/>
            <VirgoButton @click="closeDialog" label="Close" severity="secondary" class="close"/>
         </div>
      </div>
   </Dialog>
</template>

<script setup>
import { useItemStore } from "@/stores/item"
import { useSystemStore } from "@/stores/system"
import { ref, computed} from 'vue'
import analytics from '@/analytics'
import { copyText } from 'vue3-clipboard'
import Dialog from 'primevue/dialog'
import { useToast } from "primevue/usetoast"

const props = defineProps({
   title: {
      type: String,
      required: true
   },
   itemURL: {
      type: String,
      required: true
   },
   format: {
      type: String,
      required: true
   },
   from: {
      type: String,
      default: ""
   },
   buttonLabel: {
      type: String,
      default: ""
   },
   ariaLabel: {
      type: String,
      default: ""
   }
})

const system = useSystemStore()
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
const singleFormat = computed(()=>{
   if (props.format == "all") {
      return false
   }
   return true
})
const risFrom = computed(()=>{
   if (singleFormat.value) {
      return ""
   }

   let from = props.from.toUpperCase()
   if (from == "") {
      from = 'MODAL'
   }

   return 'RIS_FROM_' + from
})

const citationSelected =((idx) => {
   selectedIdx.value = idx
})

const opened = (() => {
   message.value = ""
   loading.value = true
   failed.value = false
   citations.value = null

   itemStore.getCitations({format: props.format, itemURL: props.itemURL}).then( (response) => {
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

const downloadRISClicked = (() => {
   analytics.trigger('Export', risFrom.value, itemID.value)
   window.location.href=`${system.citationsURL}/format/ris?item=${encodeURI(props.itemURL)}`
})

const copyCitation = (() => {
   // strip html from citation.  this is safe since the source of the citation is trusted
   let citation = citations.value[selectedIdx.value]
   var div = document.createElement("div")
   div.innerHTML = citation.value
   let text = div.textContent

   copyText(text, undefined, (error, _event) => {
      if (error) {
         toast.add({severity:'error', summary: "Copy Error", detail: "Unable to copy "+citation.label+" citation: "+error.toString(), life: 5000})
      } else {
         toast.add({severity:'success', summary: "Citation Copied", detail: citation.label+" citation copied to clipboard.", life: 3000})
      }
   })
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
      color: var( --uvalib-blue-alt-dark);
      font-style: italic;
      display: inline-block;
      width:100%;
   }
   .error {
      display: inline-block;
      padding: 10px 0 0 0;
      text-align: center;
      color: var( --uvalib-red-emergency);
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
      .citation-text {
         outline: 0;
         min-height: 75px;
         max-height: 420px;
         overflow: scroll;
      }
   }
   .citation-controls {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      margin: 20px 0 0 0;
      padding: 0;
      gap: 5px 10px;
      .close {
         margin-left: auto;
      }
   }

   .working {
      text-align: center;
      font-size: 1.25em;
   }
}
</style>
