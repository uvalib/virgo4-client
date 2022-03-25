<template>
   <V4Modal :id="props.id" :title="props.title" ref="citationsdlg" :buttonID="`${props.id}-open`" @opened="opened" :lastFocusID="`${props.id}-dismissbtn`" >
      <template v-slot:button>
         <V4Button v-if="props.buttonLabel" :mode="props.buttonMode" @click="citationsdlg.value.show()" :id="`${props.id}-open`"
            class="citations-text-button" :class="{toolbar: props.toolbarButton}"
             :icon="citationIcon" :aria-label="props.ariaLabel"
         >
            {{props.buttonLabel}}<i class="icon-inline" :class="citationIcon" v-if="props.iconInline || props.toolbarButton"></i>
         </V4Button>
         <V4Button v-else mode="icon" @click="citationsdlg.value.show()" :id="`${props.id}-open`"
             :icon="citationIcon" :aria-label="props.ariaLabel"
         >
         </V4Button>
      </template>
      <template v-slot:content>
         <div class="citations-content">
            <div class="working" v-if="loading" >
               <V4Spinner message="Gathering citations..."/>
            </div>
            <template v-else-if="failed">
               <p class="error">{{citations}}</p>
            </template>
            <template v-else>
               <div class="citations" v-if="props.format=='all'">
                  <label>Choose a citation format</label>
                  <ul class="list">
                     <li v-for="(citation,idx) in citations" :key="citation.label">
                        <V4Button
                           mode="text" class="citation" :class="{selected: idx == selectedIdx}"
                           :focusBackOverride="true" @tabback="backTabCitation(idx)"
                           @click="citationSelected(idx)"
                           :id="`citation-tab${idx}`"
                        >
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
         </div>
      </template>
      <template v-slot:controls>
         <V4DownloadButton v-if="props.format == 'all'" style="padding-left:0" label="Download RIS" :url="risURL"
            @click="downloadRISClicked" id="download-citation"
            icon="fas fa-file-export" :iconInline="true" mode="button"
            aria-label="download RIS citation"
         />
         <V4Button mode="primary" id="copy-citation"
            :focusBackOverride="true" @tabback="backTabCopy"
            @click="copyCitation()">
            Copy Citation
         </V4Button>
         <V4Button mode="primary" :id="`${props.id}-dismissbtn`" @click="dismissClicked"
            :focusNextOverride="true" @tabnext="nextTabClose">
            Close
         </V4Button>
      </template>
   </V4Modal>
</template>

<script setup>
import V4DownloadButton from "@/components/V4DownloadButton.vue"
import { useItemStore } from "@/stores/item"
import { useSystemStore } from "@/stores/system"
import { ref, nextTick, computed} from 'vue'
import analytics from '@/analytics'
import { copyText } from 'vue3-clipboard'

const props = defineProps({
   title: {
      type: String,
      required: true
   },
   id: {
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
   icon: {
      type: String,
      default: ""
   },
   iconInline: {
      type: Boolean,
      default: false
   },
   toolbarButton: {
      type: Boolean,
      default: false
   },
   buttonLabel: {
      type: String,
      default: ""
   },
   buttonMode: {
      type: String,
      default: "text"
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
const citationsdlg = ref("")

const itemID = computed(()=>{
   let parts = props.itemURL.split("/")
   return parts[parts.length - 1]
})
const risURL = computed(()=>{
   if (system.citationsURL == "") return ""
   return `${system.citationsURL}/format/ris?item=${encodeURI(props.itemURL)}`
})
const citationIcon = computed(()=>{
   let icon = props.icon
   if (icon == "") {
      icon = "fas fa-quote-right"
   }
   return icon
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

function citationSelected(idx) {
   selectedIdx.value = idx
}
function opened() {
   error.value = ""
   message.value = ""
   loading.value = true
   failed.value = false
   citations.value = null

   itemStore.getCitations({format: props.format, itemURL: props.itemURL}).then( (response) => {
      var citations = response.data
      loading.value = false
      failed.value = false
      citations.value = citations
   }).catch((error) => {
      loading.value = false
      failed.value = true
      citations.value = error
   }).finally( ()=> {
      setInitialFocus()
   })
}
function setInitialFocus() {
   let btn = document.getElementById("copy-citation")
   if ( props.format == 'all') {
      btn = document.getElementById("citation-tab0")
   }
   if ( !btn ) {
      btn = document.getElementById(`${props.id}-dismissbtn`)
   }
   btn.focus()
}
function nextTabClose() {
   citationsdlg.value.lastFocusTabbed()
}
function backTabCitation( idx ) {
   if ( idx == 0 ) {
      citationsdlg.value.lastFocusTabbed()
   } else {
      idx--
      let btn = document.getElementById(`citation-tab${idx}`)
      btn.focus()
   }
}
function backTabCopy() {
   let btn = document.getElementById(`${props.id}-dismissbtn`)
   if ( props.format == 'all') {
      btn = document.getElementById("download-citation")
      if ( !btn ) {
         document.getElementById(`${props.id}-dismissbtn`)
      }
   }
   btn.focus()
}
function dismissClicked() {
   citationsdlg.value.hide()
}
function downloadRISClicked() {
   analytics.trigger('Export', risFrom.value, itemID.value)
}
function copyCitation() {
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
}
</script>

<style lang="scss" scoped>
button.v4-button.citations-text-button .icon-inline {
   margin-left: 6px;
   font-size: 0.95em;
   display: inline-block;
}
button.v4-button.citations-text-button.toolbar {
   color: #444;
   cursor: pointer;
   .icon-inline {
      margin-left: 5px;
      font-size: 0.95em;
      display: inline-block;
      color: #444;
      cursor: pointer;
      box-sizing: border-box;
      &:hover {
         color:var(--uvalib-brand-blue-light);
      }
   }
   &:hover {
      color:var(--uvalib-brand-blue-light);
      text-decoration: none !important;
      .icon-inline {
         color:var(--uvalib-brand-blue-light);
      }
   }
}
:deep(i.icon) {
   color: var(--uvalib-grey-dark);
   cursor: pointer;
   font-size: 1.2em;
   padding: 2px;
}
.citations-content {
   max-height: 500px;

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
            margin: 0 5px 0 0;
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
@media only screen and (min-width: 768px) {
   .citations-content {
      max-height: 500px !important;
      min-width: 550px;
   }
   .citation-text {
      max-height: 420px !important;
   }
}
@media only screen and (max-width: 768px) {
   .citations-content {
      max-height: 365px !important;
      min-width: 350px;
   }
   .citation-text {
      max-height: 260px !important;
      width: 95%;
   }
}
</style>
