<template>
   <div class="item-view">
      <div class="detail-header">
         <span v-if="resultStore.selectedHitIdx > -1" class="hidden-spacer"></span>
         <span class="paging" v-if="resultStore.selectedHitIdx > -1">
            <V4Pager :total="resultStore.selectedResults.total" :page="resultStore.selectedHit.number"
               :prevAvailable="resultStore.prevHitAvailable" :nextAvailable="resultStore.nextHitAvailable"
               @next="nextHitClicked" @prior="priorHitClicked"
            />
            <div class="back">
               <V4Button mode="text" @click="returnToSearch">Return to search results</V4Button>
            </div>
         </span>
      </div>
      <div class="details-content">
         <SearchHitHeader v-bind:link="false" :hit="details" :pool="details.source" from="DETAIL"/>
         <abbr class="unapi-id" :title="details.itemURL"></abbr>
         <div class="info">
            <div v-if="poolStore.itemMessage(details.source)" class="ra-box ra-fiy pad-top" v-html="poolStore.itemMessage(details.source)">
            </div>
            <dl class="fields">
               <template v-if="details.header.author">
                  <dt class="label">{{details.header.author.label}}:</dt>
                  <dd class="value">
                     <V4LinksList id="author-links" :inline="true" :links="getBrowseLinks('author', details.header.author.value)" />
                  </dd>
               </template>
               <template v-for="(field,idx) in allDisplayFields"  :key="`lv${idx}`">
                  <dt class="label">{{field.label}}:</dt>
                  <dd class="value">
                     <V4LinksList v-if="field.type == 'subject'" :id="`${field.type}-links`"
                        :links="getBrowseLinks('subject', field.value)" />
                     <span class="related" v-else-if="field.type=='related-url'">
                        <div class="related-item" v-for="(v,idx) in field.value" :key="`related-${idx}`">
                           <a :id="`rl-${idx}`" class="link-button" :href="v.url" target="_blank">{{v.label}}</a>
                        </div>
                     </span>
                     <span class="copyright" v-else-if="field.type=='copyright'">
                        <img :aria-label="`${field.item} icon`" :src="copyrightIconSrc(field)">
                        <a :href="field.value" target="_blank">{{field.item}}</a>
                        <a  v-if="field.name == 'copyright_and_permissions'" class="cr-note"
                           href="https://www.library.virginia.edu/policies/use-of-materials" target="_blank"
                        >
                           More about Rights and Permissions<i style="margin-left:5px;" class="fal fa-external-link-alt"></i>
                        </a>
                     </span>
                     <TruncatedText v-else :id="`${details.identifier}-${field.label}`"
                        :text="utils.fieldValueString(field)" :limit="fieldLimit(field)" />
                  </dd>
               </template>
               <template v-if="accessURLField && !system.isKiosk">
                  <dt class="label">{{accessURLField.label}}:</dt>
                  <dd class="value">
                     <AccessURLDetails mode="full" :title="details.header.title" :pool="details.source" :urls="accessURLField.value" />
                  </dd>
               </template>
               <dt class="label">Citations:</dt>
               <dd class="value">
                  <CitationsList />
               </dd>
               <template v-if="hasExtLink">
                  <dd></dd>
                  <dt class="value more">
                     <a :href="extDetailURL" target="_blank" @click="extDetailClicked">
                        Full metadata<i style="margin-left:5px;" class="fal fa-external-link-alt"></i>
                     </a>
                  </dt>
               </template>
            </dl>
            <template v-if="marcXML">
               <AccordionContent class="marc" id="maxc-xml">
                  <template v-slot:title>MARC XML</template>
                  <pre class="xml">{{marcXML}}</pre>
               </AccordionContent>
            </template>
         </div>
      </div>
      <DigitalContent />
      <template v-if="details.source != 'images'">
         <!-- <Availability v-if="poolStore.hasAvailability(details.source)" :titleId="details.identifier" /> -->
         <InterLibraryLoan v-if="poolStore.hasInterLibraryLoan(details.source)" />
         <ShelfBrowse v-if="!details.searching" :hit="details" :pool="details.source" :target="browseTarget"/>
      </template>
   </div>
</template>

<script setup>
import SearchHitHeader from "@/components/SearchHitHeader.vue"
// import Availability from "@/components/details/Availability.vue"
import InterLibraryLoan from "@/components/details/InterLibraryLoan.vue"
import AccordionContent from "@/components/AccordionContent.vue"
import beautify from 'xml-beautifier'
import AccessURLDetails from "@/components/AccessURLDetails.vue"
import TruncatedText from "@/components/TruncatedText.vue"
import V4LinksList from "@/components/V4LinksList.vue"
import V4Pager from "@/components/V4Pager.vue"
import CitationsList from "@/components/details/CitationsList.vue"
import ShelfBrowse from "@/components/details/ShelfBrowse.vue"
import DigitalContent from "@/components/details/DigitalContent.vue"
import analytics from '@/analytics'
import * as utils from '@/utils'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useItemStore } from "@/stores/item"
import { usePoolStore } from "@/stores/pool"
import { useResultStore } from "@/stores/result"
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"

const router = useRouter()
const route = useRoute()
const item = useItemStore()
const poolStore = usePoolStore()
const resultStore = useResultStore()
const system = useSystemStore()
const user = useUserStore()
const browseTarget = ref("")

// details : state => state.item.details,
const details = computed(()=>{
   return item.details
})
const allFields = computed(()=>{
   return [...details.value.basicFields.concat(details.value.detailFields)]
})
const allDisplayFields = computed(()=>{
   return allFields.value.filter(f => shouldDisplay(f))
})
const accessURLField = computed(()=>{
   return allFields.value.find(f => f.name=="access_url")
})
const hasExtLink = computed(()=>{
   let idx = allFields.value.findIndex( f=> f.name=="sirsi_url")
   if (idx == -1) {
         idx = allFields.value.findIndex( f=> f.name=="worldcat_url")
   }
   return idx > -1
})
const extDetailURL = computed(()=>{
   let extLink = allFields.value.find( f=> f.name=="sirsi_url")
   if (!extLink) {
         extLink = allFields.value.find( f=> f.name=="worldcat_url")
   }
   return extLink.value
})
const marcXML = computed(()=>{
   if ( !user.isAdmin ) return ""
   let xml = allFields.value.find( f => f.type == "marc-xml")
   if ( !xml) return ""
   return beautify(xml.value).trim()
})

function returnToSearch() {
   router.push( resultStore.lastSearchURL )
}
async function nextHitClicked() {
   await resultStore.nextHit()
   let url = route.fullPath
   let lastSlash = url.lastIndexOf("/")
   url = url.substring(0,lastSlash )+"/"+resultStore.selectedHit.identifier
   router.push(url)
}
async function priorHitClicked() {
   await resultStore.priorHit()
   let url = route.fullPath
   let lastSlash = url.lastIndexOf("/")
   url = url.substring(0,lastSlash )+"/"+resultStore.selectedHit.identifier
   router.push(url)
}
function copyrightIconSrc( info ) {
   let poolDetail = poolStore.poolDetails(details.value.source)
   return poolDetail.url+info.icon
}
function extDetailClicked() {
   analytics.trigger('Results', 'MORE_DETAILS_CLICKED', details.value.identifier)
}
function getBrowseLinks( name, values ) {
   let out = []
   values.forEach( v => {
      let qp = `${name}: {"${encodeURIComponent(v)}"}`
      let link = {label: v, url: `/search?mode=advanced&q=${qp}`}
      out.push(link)
   })
   return out
}
function shouldDisplay(field) {
   if ( field.display == 'availability') return false
   if (field.display == 'optional' || field.type == "iiif-image-url" || field.type == "url" ||
         field.type == "access-url" || field.type == "sirsi-url" ||
         field.name.includes("_download_url")  ) {
      return false
   }

   if ( system.isKiosk &&  field.type == "related-url" ) return false
   return true
}
function fieldLimit( field ) {
   if (field.name == "subject_summary" ) {
      return 900
   }
   return 300
}
</script>
<style lang="scss" scoped>
.item-view {
   div.details-content  {
      width: 95%;
      margin: 0 auto;
      a.link-button {
         background-color: var(--uvalib-brand-blue-light);
         border: 1px solid var(--uvalib-brand-blue-light);
         color: white !important;
         padding: .5em 1em;
         border-radius: 5px;
         display: inline-block;
         margin: 0px 5px 5px 0 ;

         &:hover {
            background-color: var(--uvalib-brand-blue-lighter);
            border: 1px solid var(--uvalib-brand-blue-lighter);
            transition: all 0.3s ease;
            text-decoration: none !important;
         }
      }
   }

   .ra-box.ra-fiy.pad-top {
      margin-top: 20px;
   }

   dl.fields {
      grid-template-columns: 0.5fr 2fr;
      dt.label {
         white-space: normal;
      }
   }
   .detail-header {
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      align-content: center;
      padding-bottom: 15px;
      .hidden-spacer, .paging {
         flex:1;
      }
      .paging {
         flex: 1;
         display: flex;
         flex-flow: column;
         justify-content: flex-end;
         margin: 0 15px;
      }
      .back {
         text-align: right;
         margin: 5px 0;
      }
   }
   .icon {
      margin-left: 5px;
   }
   :deep(p) {
      margin: 8px 0;
   }
   .info {
      margin: 15px 0;
      border-top: 4px solid var(--color-brand-blue);
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
      max-width: 750px;
      text-align: left;
      word-break: break-word;
      -webkit-hyphens: auto;
      -moz-hyphens: auto;
      hyphens: auto;
      padding: 4px 0px;
   }
   .value.more {
      margin-top: 15px;
      padding: 15px 0 10px 0;
      text-align: left;
   }
   #marc.accordion-content {
      margin-left: -6em;
   }
   .xml {
      font-weight: normal;
      font-size: 0.8em;
      border: 1px solid var(--uvalib-grey-light);
      padding: 10px;
      margin: 0;
      border-top: 0;
   }
   .copyright {
      display: flex;
      flex-flow: row wrap;
      align-content: center;
      align-items: center;
      img {
         height: 20px;
         margin-right: 5px;
      }
      .cr-note {
         margin-left: 25px;
      }
   }
}
</style>
