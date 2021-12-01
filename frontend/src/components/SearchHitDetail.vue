<template>
   <div class="details-wrap">
      <div class="details">
         <div class="basic">
            <dl class="fields">
               <template v-for="(field,idx) in hit.basicFields">
                  <template v-if="shouldDisplay(field)">
                     <dt :key="getKey(field,`k${idx}`)">{{field.label}}:</dt>
                     <dd :key="getKey(field,`v${idx}`)" >
                        <TruncatedText :id="`${hit.identifier}-${field.name}`"
                           :text="$utils.fieldValueString(field)" :limit="truncateLength"
                        />
                     </dd>
                  </template>
               </template>
               <template v-if="fullTextSnippet">
                   <dt class="label">Full Text Match:</dt>
                   <dd class="value"><span class="snippet" v-html="fullTextSnippet"></span></dd>
               </template>
               <template v-if="accessURLField && !isKiosk">
                  <dt class="label">{{accessURLField.label}}:</dt>
                  <dd class="value">
                     <AccessURLDetails mode="brief" :title="hit.header.title" :pool="pool" :urls="accessURLField.value" />
                  </dd>
               </template>
            </dl>
         </div>
         <router-link v-if="hit.cover_image" @mousedown="detailClicked"
            class="img-link" :to="detailsURL"  :aria-label="`${hit.header.title}`"
         >
            <img class="cover-img" v-if="hit.cover_image" aria-label=" " :src="hit.cover_image"/>
         </router-link>
      </div>
      <div class="digital-content">
         <V4DownloadButton v-if="pdfDownloadURL"
            icon="far fa-file-pdf" label="Download PDF" :url="pdfDownloadURL"
            :aria-label="`download pdf for ${hit.header.title}`"
         />
         <V4DownloadButton v-if="ocrDownloadURL" icon="far fa-file-alt"
            label="Download OCR" :url="ocrDownloadURL"
            :aria-label="`download ocr for ${hit.header.title}`"
         />
      </div>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import TruncatedText from '@/components/TruncatedText'
import V4DownloadButton from '@/components/V4DownloadButton'
import AccessURLDetails from '@/components/AccessURLDetails'
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true},
   },
   components: {
      TruncatedText, AccessURLDetails, V4DownloadButton
   },
   computed: {
      pdfDownloadURL() {
         let dc = this.hit.basicFields.find(f => f.name=="pdf_download_url")
         if (dc)  {
            return dc.value
         }
         return ""
      },
      ocrDownloadURL() {
         let dc = this.hit.basicFields.find(f => f.name=="ocr_download_url")
         if (dc)  {
            return dc.value
         }
         return ""
      },
      accessURLField() {
         return this.hit.basicFields.find(f => f.name=="access_url")
      },
      detailsURL() {
         return `/sources/${this.pool}/items/${this.hit.identifier}`
      },
      ...mapState({
         citationsURL: state => state.system.citationsURL,
         pools: state => state.pools.list
      }),
      ...mapGetters({
         isKiosk: "system/isKiosk",
      }),
      truncateLength() {
         if ( this.hit.cover_image ) return 60
         return 80
      },
      fullTextSnippet() {
         let sf = this.hit.basicFields.find( f => f.name == "highlighted_match")
         if (sf ) {
            return sf.value
         }
         return ""
      }
   },
   methods: {
      detailClicked() {
         this.$store.commit("hitSelected", this.hit.identifier)
         this.$analytics.trigger('Results', 'DETAILS_CLICKED', this.hit.identifier)
      },
      getKey(field,idx) {
         return this.hit.identifier+field.value+idx
      },
      shouldDisplay(field) {
         if (field.display == 'optional' || field.type == "url" ||
            field.type == "access-url" || field.name.includes("_download_url") ) return false
         return true
      },
   }
};
</script>

<style lang="scss" scoped>
.details {
   display:flex;
   flex-flow: row wrap;
   align-items: flex-start;

   div.basic {
      padding: 5px 10px 10px 40px;
      flex-grow: 1;
      max-width:75%;

      dl {
         margin: 0 0 0 15px;
         display: inline-grid;
         grid-template-columns: max-content 2fr;
         grid-column-gap: 15px;
      }
      dt {
         font-weight: bold;
         text-align: right;
      }
      dd {
         margin: 0 0 10px 0;
         word-break: break-word;
         -webkit-hyphens: auto;
         -moz-hyphens: auto;
         hyphens: auto;
         .snippet {
            font-size: 0.9em;
            :deep(em) {
               font-weight: bold;
            }
         }
      }
   }

   a.img-link {
      display: inline-block;
   }
   .cover-img {
      border-radius: 3px;
      margin: 5px;
      max-height: 140px;
      max-width: 140px;
      display: inline-block;
   }
   .cover-img.small {
      max-height: 124px;
      max-width: 100px;
   }
}

.digital-content {
   padding: 0 5px;
}

@media only screen and (min-width: $breakpoint-mobile) {
   a.img-link {
      margin-left: auto;
   }
}
@media only screen and (max-width: $breakpoint-mobile) {
   .details {
      justify-content: center;
      div.basic {
         max-width: 90%;
         padding: 5px 0px 10px 0px;
      }
   }
   a.img-link {
      margin-left: initial;
   }
}
</style>
