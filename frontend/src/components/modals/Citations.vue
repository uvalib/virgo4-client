<template>
   <VirgoButton link @click="showDialog = true" class="citations-text-button" icon="fas fa-quote-right"
      :aria-label="props.ariaLabel" ref="trigger" :label="props.buttonLabel" iconPos="right" :class="{toolbar: props.format=='all'}"/>

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
         <div class="form-controls" >
            <VirgoButton v-if="props.format == 'all'" @click="downloadRISClicked" aria-label="download RIS citation"
               label="Download RIS" icon="fas fa-file-export" iconPos="right"/>
            <VirgoButton @click="copyCitation" label="Copy Citation" v-focus/>
            <VirgoButton @click="closeDialog" label="Close"/>
         </div>
      </div>
   </Dialog>
</template>

<script setup>
import { useItemStore } from "@/stores/item"
import { useSystemStore } from "@/stores/system"
import { ref, nextTick, computed} from 'vue'
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
.ris-icon {
   display: inline-block;
   padding-left: 10px;
}

button.citations-text-button {
   padding-top: 2px !important;
   margin-right: 10px  !important;
   &.toolbar {
      :deep(span) {
         color:  var(--uvalib-text);
      }
      &:hover {
         :deep(span) {
            text-decoration: none !important;
            color: var(--uvalib-brand-blue-light);
         }
      }
   }
   &:hover {
      :deep(span) {
         text-decoration: underline !important;
         color: var(--uvalib-link);
      }
   }
}

.citations-content {
   max-height: 500px;
   max-width: 500px;

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

         button.citation {
            margin: 0 10px 0 0;
         }
      }
      .citation-text {
         outline: 0;
         min-height: 75px;
         max-height: 420px;
         overflow: scroll;
      }
   }

   .working {
      text-align: center;
      font-size: 1.25em;
   }
}
</style>
