<template>
   <div class="details-wrap">
      <div class="details">
         <div class="basic">
            <div v-if="hit.header.author" class="author">
               <TruncatedText :title="hit.header.author.label" 
                  :text="hit.header.author.value.join('; ')" :limit="truncateLength" />
            </div>
            <dl class="fields">
               <template v-for="(field,idx) in hit.basicFields">
                  <template v-if="shouldDisplay(field)">
                     <dt :key="getKey(field,`k${idx}`)">{{field.label}}:</dt>
                     <dd :key="getKey(field,`v${idx}`)" >
                        <TruncatedText :title="field.label" :text="fieldValueString(field)" :limit="truncateLength" />
                     </dd>
                  </template>
               </template>
               <template v-if="accessURLField">
                  <dt class="label">{{accessURLField.label}}:</dt>
                  <dd class="value">
                     <AccessURLDetails mode="brief" :pool="pool" :urls="accessURLField.value" />
                  </dd>
               </template>
            </dl>
         </div>
         <router-link v-if="hasCoverImages(pool)" class="img-link" :to="detailsURL">
            <img class="cover-img" v-if="hit.cover_image" :src="hit.cover_image"/>
         </router-link>
      </div>
      <div class="digital-content">
         <V4DownloadButton v-if="pdfDownloadURL" icon="far fa-file-pdf" label="Download PDF" :url="pdfDownloadURL"/>
         <V4DownloadButton v-if="ocrDownloadURL" icon="far fa-file-alt" label="Download OCR" :url="ocrDownloadURL"/>
         <V4DownloadButton icon="fas fa-file-export" label="Export Citation" :url="risURL" @click="triggerMatomoEvent"/>
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
      risURL() {
         if (this.citationsURL == "") return ""
         let poolObj = this.pools.find( p => p.id == this.pool)
         let itemURL = `${poolObj.url}/api/resource/${this.hit.identifier}`
         return `${this.citationsURL}/format/ris?item=${encodeURI(itemURL)}`
      },
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
         hasCoverImages: 'pools/hasCoverImages',
      }),
      truncateLength() {
         if ( this.hasCoverImages(this.pool)) return 60
         return 80
      }
   },
   methods: {
      triggerMatomoEvent() {
         if (window._paq ) {
            window._paq.push(['trackEvent', 'Export', 'RIS_FROM_SEARCH', this.hit.identifier])
         } else {
            console.error("_PAQ IS NOT AVAILABLE; CANNOT TRIGGER EVENT")
         }
      },
      getKey(field,idx) {
         return this.hit.identifier+field.value+idx
      },
      shouldDisplay(field) {
         if (field.display == 'optional' || field.type == "url" || field.name.includes("_download_url") ) return false
         if ( this.isKiosk && field.type == "url") return false
         return true
      },
      fieldValueString(field) {
         if ( Array.isArray(field.value)) {
            return field.value.join(", ")
         }
         return field.value
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
      padding: 5px 10px 10px 10px;
      flex-grow: 1;

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
      }

      .author {
         margin-bottom: 10px;
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

@media only screen and (min-width: 600px) {
   a.img-link {
      margin-left: auto;
   }
}
@media only screen and (max-width: 600px) {
   .details {
      justify-content: center
   }
   a.img-link {
      margin-left: initial;
   }
}
</style>