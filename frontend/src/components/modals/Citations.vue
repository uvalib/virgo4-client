<template>
   <V4Button mode="text" @click="showDialog = true" class="citations-text-button" icon="fas fa-quote-right" :aria-label="props.ariaLabel" ref="trigger">
      <span class="button-text" :class="{toolbar: props.toolbarButton}">{{props.buttonLabel}}<i class="icon-inline fas fa-quote-right"></i></span>
   </V4Button>

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
                     <V4Button mode="text" :id="`citation-tab${idx}`" class="citation" :class="{selected: idx == selectedIdx}" @click="citationSelected(idx)">
                        {{citation.label}}
                     </V4Button>
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
            <span v-if="error" class="error">{{error}}</span>
         </div>
         <div class="form-controls" >
            <V4DownloadButton v-if="props.format == 'all'" style="padding-left:0" label="Download RIS" :url="risURL"
               @click="downloadRISClicked" id="download-citation"
               icon="fas fa-file-export" :iconInline="true" mode="button"
               aria-label="download RIS citation"
            />
            <V4Button mode="primary" id="copy-citation" @click="copyCitation()">Copy Citation</V4Button>
            <V4Button mode="primary" @click="closeDialog">Close</V4Button>
         </div>
      </div>
   </Dialog>
</template>

<script setup>
import V4DownloadButton from "@/components/V4DownloadButton.vue"
import { useItemStore } from "@/stores/item"
import { useSystemStore } from "@/stores/system"
import { ref, nextTick, computed} from 'vue'
import analytics from '@/analytics'
import { copyText } from 'vue3-clipboard'
import Dialog from 'primevue/dialog'

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
   toolbarButton: {
      type: Boolean,
      default: false
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
const loading = ref(true)
const failed = ref(false)
const citations = ref(null)
const selectedIdx = ref(0)
const error = ref("")
const message = ref("")
const showDialog = ref(false)
const trigger = ref(null)

const itemID = computed(()=>{
   let parts = props.itemURL.split("/")
   return parts[parts.length - 1]
})
const risURL = computed(()=>{
   if (system.citationsURL == "") return ""
   return `${system.citationsURL}/format/ris?item=${encodeURI(props.itemURL)}`
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
   error.value = ""
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
   }).finally( ()=> {
      setInitialFocus()
   })
})

const closeDialog = (() => {
   showDialog.value = false
   trigger.value.$el.focus()
})

function setInitialFocus() {
   let btn = document.getElementById("copy-citation")
   if ( props.format == 'all') {
      btn = document.getElementById("citation-tab0")
   }
   if ( btn ) {
      btn.focus()
   }
}

const downloadRISClicked = (() => {
   analytics.trigger('Export', risFrom.value, itemID.value)
})

const copyCitation = (() => {
   // strip html from citation.  this is safe since the source of the citation is trusted
   let citation = citations.value[selectedIdx.value]
   var div = document.createElement("div")
   div.innerHTML = citation.value
   let text = div.textContent

   // message/errors pop up behind the citation modal on details page, so only show one if we have to
   copyText(text, undefined, (error, _event) => {
      if (error) {
         error.value =  "Unable to copy "+citation.label+" citation: "+error.toString()
      } else {
         message.value = citation.label+" citation copied to clipboard."
      }
   })
   nextTick( () => {document.getElementById("copy-citation").focus()} )
   setTimeout( () => {
      error.value = ""
      message.value = ""
   }, 5000)
})
</script>

<style lang="scss" scoped>
button.v4-button.citations-text-button {
   cursor: pointer;
   margin-right: 10px;
   display: block;
   &:hover {
      text-decoration: none;
   }
   .button-text {
      color:var(--color-link);
      display: block;
      .icon-inline {
         margin-left: 5px;
         display: inline-block;
         color:var(--color-link);
         padding: 2px;
         cursor: pointer;
         box-sizing: border-box;
      }
      &:hover {
         text-decoration: underline;
      }
   }
   .button-text.toolbar {
      color: #444;
      display: flex;
      flex-flow: row nowrap;

      .icon-inline {
         color: #444;
         font-size: .95em;
      }
      &:hover {
         color: var(--uvalib-brand-blue-light);
         text-decoration: none;
         .icon-inline {
            color: var(--uvalib-brand-blue-light);
         }
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

         .v4-button.citation {
            margin: 0 5px 10px 0;
            padding: 8px 15px;
            border-radius: 5px;
            color: var(--uvalib-text-dark);
            border: 1px solid var(--uvalib-grey);
            text-align: left;
            // border-bottom: 0;
            background: var(--uvalib-grey-lightest);
         }
         .v4-button.citation.selected {
            background: var(--uvalib-brand-blue-light);
            color: white;
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
