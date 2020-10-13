<template>
   <V4Modal :id="id" :title="title" ref="citationsdlg"
      :firstFocusID="`${id}-dismissbtn`" :buttonID="`${id}-open`" @opened="opened"
   >
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
               <table class="citations">
                  <tr v-for="(citation,idx) in citations" :key="`cval-${idx}`">
                     <template v-if="citation.label">
                        <td v-if="!singleFormat" class="label">{{citation.label}}:</td>
                        <td class="value"><span v-html="citation.value"></span></td>
                        <td class="copy-button">
                           <V4Button mode="text-button" @click="copyCitation(citation,idx)">{{citation.copyButtonText}}</V4Button>
                        </td>
                     </template>
                  </tr>
               </table>
               <V4DownloadButton v-if="!singleFormat" icon="fas fa-file-export" label="Download RIS Citation" :url="risURL"
                  @click="downloadRISClicked" :aria-label="`export RIS citation for ${itemID}`"
               />
            </template>
         </div>
      </template>
      <template v-slot:controls>
         <V4Button mode="primary" :id="`${id}-dismissbtn`" @click="dismissClicked"
            :focusNextOverride="true">
            Dismiss
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
         citations: null
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
      opened() {
         this.loading = true
         this.failed = false
         this.citations = null

         this.$store.dispatch("item/getCitations", {format: this.format, itemURL: this.itemURL}).then( (response) => {
            var citations = response.data

            citations.forEach(c => {
               c.copyButtonText = "Copy"
            })

            this.loading = false
            this.failed = false
            this.citations = citations
         }).catch((error) => {
            this.loading = false
            this.failed = true
            this.citations = error
         })
      },
      dismissClicked() {
         this.$emit('dismissed')
         setTimeout( () => {
            if ( this.$refs.citationsdlg ) {
               this.$refs.citationsdlg.hide()
            }
         }, 300)
      },
      downloadRISClicked() {
         this.$analytics.trigger('Export', this.risFrom, this.itemID)
      },
      copyCitation(citation, idx) {
         // strip html from citation.  this is safe since the source of the citation is trusted
         var div = document.createElement("div")
         div.innerHTML = citation.value
         let text = div.textContent

         // message/errors pop up behind the citation modal on details page, so only show one if we have to
         this.$copyText(text).then( ()=> {
            //this.$store.commit("system/setMessage", citation.label+" citation copied to clipboard.")
            this.citations.forEach((c, i) => {
              c.copyButtonText = (i == idx) ? "Copied" : "Copy"
            })
         }, e => {
            this.$store.commit("system/setError", "Unable to copy "+citation.label+" citation: "+e)
         })
      },
   }
}
</script>

<style lang="scss" scoped>
i.icon-inline {
   margin-left: 5px;
   font-size: 0.8em;
}

i.icon {
   color: var(--uvalib-grey-dark);
   cursor: pointer;
   font-size: 1.2em;
   padding: 2px;
}

td.label {
   font-weight: bold;
   text-align: right;
   padding: 4px 8px;
   white-space: nowrap;
   vertical-align: top;
}

td.value {
   margin: 0;
   width: 100%;
   text-align: left;
   word-break: break-word;
   -webkit-hyphens: auto;
   -moz-hyphens: auto;
   hyphens: auto;
   padding: 4px 0px;
}

.working {
   text-align: center;
   font-size: 1.25em;
}

.copy-button {
   text-align: right;
}
</style>
