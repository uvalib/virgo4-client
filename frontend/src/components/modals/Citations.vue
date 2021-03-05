<template>
   <V4Modal :id="id" :title="title" ref="citationsdlg" :buttonID="`${id}-open`" @opened="opened">
      <template v-slot:button>
         <V4Button v-if="buttonLabel" :mode="buttonMode" @click="$refs.citationsdlg.show()" :id="`${id}-open`"
             :icon="citationIcon" :aria-label="ariaLabel"
         >
            {{buttonLabel}}<i class="icon-inline" :class="citationIcon" v-if="iconInline"></i>
         </V4Button>
         <V4Button v-else mode="icon" @click="$refs.citationsdlg.show()" :id="`${id}-open`"
             :icon="citationIcon" :aria-label="ariaLabel"
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
               <div class="citations" v-if="format=='all'">
                  <div class="list">
                     <V4Button v-for="(citation,idx) in citations" :key="citation.label"
                        mode="text" class="citation" :class="{selected: idx == selectedIdx}"
                        :focusBackOverride="true" @tabback="backTabCitation(idx)"
                        @click="citationSelected(idx)" :id="`citation-tab${idx}`">
                        {{citation.label}}
                     </V4Button>
                  </div>
                  <div class="citation-text">
                      <span v-html="citations[selectedIdx].value"></span>
                  </div>
               </div>
               <div v-else class="citation">
                  <span v-html="citations[0].value"></span>
               </div>
            </template>
            <div class="messagebox">
               <span v-if="message" class="info">{{message}}</span>
               <span v-if="error" class="error">{{error}}</span>
            </div>
         </div>
      </template>
      <template v-slot:controls>
         <V4DownloadButton v-if="format == 'all'" style="padding-left:0" label="Download RIS" :url="risURL"
            @click="downloadRISClicked" id="download-citation"
            icon="fas fa-file-export" :iconInline="true" mode="button"
            :aria-label="`download RIS citation for ${itemID}`"
         />
         <V4Button mode="primary" id="copy-citation"
            :focusBackOverride="true" @tabback="backTabCopy"
            @click="copyCitation()">
            Copy Citation
         </V4Button>
         <V4Button mode="primary" :id="`${id}-dismissbtn`" @click="dismissClicked"
            :focusNextOverride="true" @tabnext="nextTabClose">
            Close
         </V4Button>
      </template>
   </V4Modal>
</template>

<script>

import { mapState } from "vuex"
import V4DownloadButton from '@/components/V4DownloadButton'

export default {
   props: {
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
   },
   data: function() {
      return {
         loading: true,
         failed: false,
         citations: null,
         selectedIdx: 0,
         error: "",
         message: ""
      };
   },
   components: {
      V4DownloadButton
   },
   computed: {
      ...mapState({
         citationsURL: state => state.system.citationsURL,
      }),
      itemID() {
         let parts = this.itemURL.split("/")
         return parts[parts.length - 1]
      },
      risURL() {
         if (this.citationsURL == "") return ""
         return `${this.citationsURL}/format/ris?item=${encodeURI(this.itemURL)}`
      },
      citationIcon() {
         let icon = this.icon
         if (icon == "") {
            icon = "fas fa-quote-right"
         }
         return icon
      },
      singleFormat() {
         if (this.format == "all") {
            return false
         }
         return true
      },
      risFrom() {
         if (this.singleFormat) {
            return ""
         }

         let from = this.from.toUpperCase()
         if (from == "") {
            from = 'MODAL'
         }

         return 'RIS_FROM_' + from
      },
   },
   methods: {
      citationSelected(idx) {
         this.selectedIdx = idx
      },
      opened() {
         this.error = ""
         this.message = ""
         this.loading = true
         this.failed = false
         this.citations = null

         this.$store.dispatch("item/getCitations", {format: this.format, itemURL: this.itemURL}).then( (response) => {
            var citations = response.data
            this.loading = false
            this.failed = false
            this.citations = citations
         }).catch((error) => {
            this.loading = false
            this.failed = true
            this.citations = error
         }).finally( ()=> {
            this.setInitialFocus()
         })
      },
      setInitialFocus() {
         let btn = document.getElementById("copy-citation")
         if ( this.format == 'all') {
            btn = document.getElementById("citation-tab0")
         }
         if ( !btn ) {
            btn = document.getElementById(`${id}-dismissbtn`)
         }
         btn.focus()
      },
      nextTabClose() {
         this.setInitialFocus()
      },
      backTabCitation( idx ) {
         if ( idx == 0 ) {
            document.getElementById(`${this.id}-dismissbtn`).focus()
         } else {
            idx--
            let btn = document.getElementById(`citation-tab${idx}`)
            btn.focus()
         }
      },
      backTabCopy() {
         let btn = document.getElementById(`${this.id}-dismissbtn`)
         if ( this.format == 'all') {
            btn = document.getElementById("download-citation")
            if ( !btn ) {
               document.getElementById(`${this.id}-dismissbtn`)
            }
         }
         btn.focus()
      },
      dismissClicked() {
         this.$refs.citationsdlg.hide()
      },
      downloadRISClicked() {
         this.$analytics.trigger('Export', this.risFrom, this.itemID)
      },
      copyCitation() {
         // strip html from citation.  this is safe since the source of the citation is trusted
         let citation = this.citations[this.selectedIdx]
         var div = document.createElement("div")
         div.innerHTML = citation.value
         let text = div.textContent

         // message/errors pop up behind the citation modal on details page, so only show one if we have to
         this.$copyText(text).then( ()=> {
            this.message = citation.label+" citation copied to clipboard."
         }, e => {
            this.error =  "Unable to copy "+citation.label+" citation: "+e.toString()
         })
         this.$nextTick( () => {document.getElementById("copy-citation").focus()} )
         setTimeout( () => {
            this.error = ""
            this.message = ""
         }, 5000)
      },
   }
}
</script>

<style lang="scss" scoped>
::v-deep  .icon-inline {
   margin-left: 6px;
   font-size: 0.95em;
   display: inline-block;
}
::v-deep  i.icon {
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

   .citations {
      .list {
         font-weight: bold;
         margin: 0;
         text-align: left;
         display: flex;
         flex-flow: row wrap;
         justify-content: flex-start;
         .v4-button.citation {
            margin: 0;
            padding: 8px 15px;
            border-radius: 5px 5px 0 0;
            color: var(--uvalib-text-dark);
            border: 1px solid var(--uvalib-grey);
            text-align: left;
            border-bottom: 0;
            background: var(--uvalib-grey-lightest);
         }
         .v4-button.citation.selected {
            background: var(--uvalib-brand-blue-light);
            color: white;
         }
      }
      .citation-text {
         padding: 20px;
         border-radius: 0 5px 5px 5px;
         border: 1px solid var(--uvalib-grey);
         outline: 0;
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
      min-width: 450px;
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
   }
}
</style>
