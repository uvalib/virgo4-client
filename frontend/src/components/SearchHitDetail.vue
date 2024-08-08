<template>
   <div class="details-wrap">
      <div class="details">
         <div class="basic">
            <dl class="fields">
               <template v-for="(field,idx) in props.hit.fields">
                  <template v-if="shouldDisplay(field)">
                     <dt :key="getKey(field,`k${idx}`)">{{field.label}}:</dt>
                     <dd :key="getKey(field,`v${idx}`)" >
                        <TruncatedText :id="`${props.hit.identifier}-${field.name}`"
                           :text="utils.fieldValueString(field)" :limit="truncateLength"
                        />
                     </dd>
                  </template>
               </template>
               <template v-if="fullTextSnippet">
                   <dt class="label">Full Text Match:</dt>
                   <dd class="value"><span class="snippet" v-html="fullTextSnippet"></span></dd>
               </template>
               <template v-if="accessURLField && !system.isKiosk">
                  <dt class="label">{{accessURLField.label}}:</dt>
                  <dd class="value">
                     <AccessURLDetails mode="brief" :title="props.hit.header.title" :pool="props.pool" :urls="accessURLField.value" />
                  </dd>
               </template>
            </dl>
         </div>
         <router-link v-if="props.hit.cover_image" @mousedown="detailClicked"
            class="img-link" :to="detailsURL"  :aria-label="`${props.hit.header.title}`"
         >
            <img class="cover-img" v-if="props.hit.cover_image" aria-label=" " :src="props.hit.cover_image"/>
         </router-link>
      </div>
      <div class="digital-content">
         <a v-if="pdfDownloadURL" :href="pdfDownloadURL" class="download-link" :aria-label="`download pdf for ${props.hit.header.title}`">
            <i class="icon far fa-file-pdf"></i><div>Download PDF</div>
         </a>
         <a v-if="ocrDownloadURL" :href="ocrDownloadURL" class="download-link" :aria-label="`download ocr for ${props.hit.header.title}`">
            <i class="icon far fa-file-alt"></i><div>Download OCR</div>
         </a>
      </div>
   </div>
</template>

<script setup>
import TruncatedText from "@/components/TruncatedText.vue"
import AccessURLDetails from "@/components/AccessURLDetails.vue"
import analytics from '@/analytics'
import * as utils from '../utils'
import { computed } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useResultStore } from "@/stores/result"

const props = defineProps({
   hit: { type: Object, required: true},
   pool: {type: String, required: true},
})

const system = useSystemStore()
const resultStore = useResultStore()

const pdfDownloadURL = computed(()=>{
   let dc = props.hit.fields.find(f => f.name=="pdf_download_url")
   if (dc)  {
      return dc.value
   }
   return ""
})
const ocrDownloadURL = computed(()=>{
   let dc = props.hit.fields.find(f => f.name=="ocr_download_url")
   if (dc)  {
      return dc.value
   }
   return ""
})
const accessURLField = computed(()=>{
   return props.hit.fields.find(f => f.name=="access_url")
})
const detailsURL = computed(()=>{
   return `/sources/${props.pool}/items/${props.hit.identifier}`
})
const truncateLength = computed(()=>{
   if ( props.hit.cover_image ) return 60
   return 80
})
const fullTextSnippet = computed(()=>{
   let sf = props.hit.fields.find( f => f.name == "highlighted_match")
   if (sf ) {
      return sf.value.join("<br/><br/>")
   }
   return ""
})

const detailClicked = (() => {
   resultStore.hitSelected(props.hit.identifier)
   analytics.trigger('Results', 'DETAILS_CLICKED', props.hit.identifier)
})

const getKey = ((field,idx) => {
   return props.hit.identifier+field.value+idx
})

const shouldDisplay = ((field) => {
   if (field.display == 'optional' || field.type == "url" ||
      field.type == "access-url" || field.name.includes("_download_url") ) return false
   return true
})
</script>

<style lang="scss" scoped>
.digital-content {
   display: flex;
   flex-flow: row;
   justify-content: flex-start;
   align-items: flex-end;
   padding: 0 5px;

   .download-link {
      text-align: center;
      margin-right: 10px;
      .icon {
         font-size: 1.7em;
         display: block;
         color: var(--uvalib-text);
      }
      div {
         font-size: 0.77em;
         color: var(--uvalib-text);
         cursor: pointer;
         font-weight: normal;
         margin-top: 2px;
      }
   }
}
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

@media only screen and (min-width: 768px) {
   a.img-link {
      margin-left: auto;
   }
}
@media only screen and (max-width: 768px) {
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
