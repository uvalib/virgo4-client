<template>
   <div class="item-view">
      <div class="detail-controls" v-if="resultStore.selectedHitIdx > -1">
         <V4Pager
            :total="resultStore.selectedResults.total" :page="resultStore.selectedHit.number"
            :prevAvailable="resultStore.prevHitAvailable" :nextAvailable="resultStore.nextHitAvailable"
            @next="nextHitClicked" @prior="priorHitClicked"
         />
         <VirgoButton link @click="returnToSearch" label="Return to search results" />
      </div>
      <div class="details-content">
         <SearchHitHeader v-bind:link="false" :hit="details" :pool="details.source"  :expand="preferences.expandDetails" from="DETAIL"/>
         <abbr class="unapi-id" :title="details.itemURL"></abbr>
         <div class="info">
            <div v-if="poolStore.itemMessage(details.source)" class="ra-box ra-fiy pad-top" v-html="poolStore.itemMessage(details.source)">
            </div>
            <ContentAdvisory v-if="item.hasContentAdvisory" mode="full"/>
            <dl class="fields">
               <template v-if="details.header.author">
                  <dt class="label">{{details.header.author.label}}:</dt>
                  <dd class="value">
                     <V4LinksList id="author-links" :inline="true" :expand="preferences.expandDetails" :links="getBrowseLinks('author', details.header.author.value)" />
                  </dd>
               </template>
               <template v-for="(field,idx) in allDisplayFields"  :key="`lv${idx}`">
                  <dt class="label">{{field.label}}:</dt>
                  <dd class="value">
                     <V4LinksList v-if="field.type == 'subject'" :id="`${field.type}-links`"
                        :expand="preferences.expandDetails" :links="getBrowseLinks('subject', field.value)"
                     />
                     <span class="related" v-else-if="field.type=='related-url'">
                        <div class="related-item" v-for="(v,idx) in field.value" :key="`related-${idx}`">
                           <VirgoButton as="a" :href="v.url" target="_blank" :label="v.label" />
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
                     <template v-else>
                        <span v-if="preferences.expandDetails" class="value" v-html="utils.fieldValueString(field)"></span>
                        <TruncatedText v-else :id="`${details.identifier}-${field.label}`"
                           :text="utils.fieldValueString(field)" :limit="fieldLimit(field)" />
                     </template>
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
               <template v-if="hasExtLink && system.isKiosk == false">
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
         <Availability v-if="poolStore.hasAvailability(details.source)" />
         <InterLibraryLoan v-if="poolStore.hasInterLibraryLoan(details.source)" />
         <template v-if="collection.isBookplate && collection.isAvailable && (item.isCollection || item.isCollectionHead)">
            <h2>Bookplates Fund</h2>
            <CollectionHeader :border="false"/>
         </template>
         <ShelfBrowse v-if="poolStore.shelfBrowseSupport(details.source) && !details.searching" :hit="details" :pool="details.source" />
      </template>
   </div>
</template>

<script setup>
import SearchHitHeader from "@/components/SearchHitHeader.vue"
import Availability from "@/components/details/Availability.vue"
import InterLibraryLoan from "@/components/details/InterLibraryLoan.vue"
import AccordionContent from "@/components/AccordionContent.vue"
import CollectionHeader from "@/components/details/CollectionHeader.vue"
import ContentAdvisory from "@/components/ContentAdvisory.vue"
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useItemStore } from "@/stores/item"
import { usePoolStore } from "@/stores/pool"
import { useResultStore } from "@/stores/result"
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import { useCollectionStore } from "@/stores/collection"
import { usePreferencesStore } from "@/stores/preferences"

const preferences = usePreferencesStore()
const collection = useCollectionStore()
const router = useRouter()
const route = useRoute()
const item = useItemStore()
const poolStore = usePoolStore()
const resultStore = useResultStore()
const system = useSystemStore()
const user = useUserStore()

// details : state => state.item.details,
const details = computed(()=>{
   return item.details
})
const allDisplayFields = computed(()=>{
   return details.value.fields.filter(f => shouldDisplay(f))
})
const accessURLField = computed(()=>{
   return details.value.fields.find(f => f.name=="access_url")
})
const hasExtLink = computed(()=>{
   let idx = details.value.fields.findIndex( f=> f.name=="sirsi_url")
   if (idx == -1) {
         idx = details.value.fields.findIndex( f=> f.name=="worldcat_url")
   }
   return idx > -1
})
const extDetailURL = computed(()=>{
   let extLink = details.value.fields.find( f=> f.name=="sirsi_url")
   if (!extLink) {
         extLink = details.value.fields.find( f=> f.name=="worldcat_url")
   }
   return extLink.value
})
const marcXML = computed(()=>{
   if ( !user.isAdmin ) return ""
   let xml = details.value.fields.find( f => f.type == "marc-xml")
   if ( !xml) return ""
   return beautify(xml.value).trim()
})

const returnToSearch = (() => {
   analytics.trigger('Details', 'RETURN_TO_RESULTS_CLICKED', details.value.identifier)
   router.push( resultStore.lastSearchURL )
})

const nextHitClicked = ( async () => {
   analytics.trigger('Details', 'NEXT_HIT_CLICKED', details.value.identifier)
   await resultStore.nextHit()
   let url = route.fullPath
   let lastSlash = url.lastIndexOf("/")
   url = url.substring(0,lastSlash )+"/"+resultStore.selectedHit.identifier
   router.push(url)
})

const priorHitClicked = ( async () => {
   analytics.trigger('Details', 'PRIOR_HIT_CLICKED', details.value.identifier)
   resultStore.priorHit()
   let url = route.fullPath
   let lastSlash = url.lastIndexOf("/")
   url = url.substring(0,lastSlash )+"/"+resultStore.selectedHit.identifier
   router.push(url)
})

const copyrightIconSrc = (( info ) => {
   let poolDetail = poolStore.poolDetails(details.value.source)
   return poolDetail.url+info.icon
})

const extDetailClicked = (() => {
   analytics.trigger('Results', 'MORE_DETAILS_CLICKED', details.value.identifier)
})

const getBrowseLinks = ( ( name, values ) => {
   let out = []
   values.forEach( v => {
      let qp = `${name}: {"${encodeURIComponent(v)}"}`
      let link = {label: v, url: `/search?mode=advanced&q=${qp}`}
      out.push(link)
   })
   return out
})

const shouldDisplay =((field) => {
   if ( field.display == 'availability') return false
   if (field.display == 'optional' || field.type == "iiif-image-url" || field.type == "url" ||
         field.type == "access-url" || field.type == "sirsi-url" ||
         field.name.includes("_download_url")  ) {
      return false
   }

   if ( system.isKiosk &&  field.type == "related-url" ) return false
   return true
})

const fieldLimit = (( field ) => {
   if (field.name == "subject_summary" ) {
      return 900
   }
   return 300
})
</script>
<style lang="scss" scoped>
.item-view {
   h2 {
      color: var(--color-primary-orange);
      text-align: center;
      margin: 50px 0 30px 0;
   }
   div.details-content  {
      width: 95%;
      margin: 0 auto;
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
   .detail-controls {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: flex-end;
      padding: 0 10px 5px 0;
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
