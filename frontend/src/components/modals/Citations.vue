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
               <p class="error">{{data}}</p>
            </template>
            <template v-else-if="singleFormat">
               <div class="citation"><span v-html="data[0].value"></span></div>
            </template>
            <template v-else>
               <dl class="citations">
                  <template v-for="(citation,idx) in data">
                     <template v-if="citation.label">
                        <dt class="label" :key="`cl${idx}`">{{citation.label}}:</dt>
                        <dd class="value" :key="`cv${idx}`"><span v-html="citation.value"></span></dd>
                     </template>
                  </template>
               </dl>
               <V4DownloadButton icon="fas fa-file-export" label="Download RIS Citation" :url="risURL"
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
         data: null
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
         this.data = null

         this.$store.dispatch("item/getCitations", {format: this.format, itemURL: this.itemURL}).then( (response) => {
            this.loading = false
            this.failed = false
            this.data = response.data
         }).catch((error) => {
            this.loading = false
            this.failed = true
            this.data = error
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

dl {
   margin-top: 15px;
   display: inline-grid;
   grid-template-columns: max-content 2fr;
   grid-column-gap: 10px;
   width: 100%;
}
dt {
   font-weight: bold;
   text-align: right;
   padding: 4px 8px;
   white-space: nowrap;
   vertical-align: top;
}
dd {
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

.citation {
   margin: 15px;
}
</style>
