<template>
   <div class="item-header" >
      <div class="title-wrap">
         <h1 class="title">{{ details.header.title }}</h1>
         <div v-if="details.header.subtitle" class="subtitle">{{ details.header.subtitle }}</div>

      </div>
      <span class="nav-wrap"  v-if="resultStore.selectedHitIdx > -1">
         <V4Pager
            :total="resultStore.selectedResults.total" :page="resultStore.selectedHit.number"
            :prevAvailable="resultStore.prevHitAvailable" :nextAvailable="resultStore.nextHitAvailable"
            @next="nextHitClicked" @prior="priorHitClicked"
         />
         <VirgoButton link @click="returnToSearch" label="Return to search results" />
      </span>
   </div>
   <div class="details-content">
      <abbr class="unapi-id" :title="details.itemURL"></abbr>
      <div class="info">
         <div v-if="poolStore.itemMessage(details.source)" class="ra-box ra-fiy pad-top" v-html="poolStore.itemMessage(details.source)">
         </div>
         <ContentAdvisory v-if="item.hasContentAdvisory" mode="full"/>
         <dl class="fields" id="detail-fields">
            <template v-if="details.header.author">
               <dt class="label">{{details.header.author.label}}:</dt>
               <dd class="value">
                  <V4LinksList id="author-links" :inline="true" label="authors"
                     :expand="preferences.expandDetails" :links="getBrowseLinks('author', details.header.author.value)" />
               </dd>
            </template>
            <template v-for="(field) in allDisplayFields">
               <dt class="label">{{field.label}}:</dt>
               <dd class="value">
                  <V4LinksList v-if="field.type == 'subject'" :id="`${field.type}-links`" label="subjects"
                     :expand="preferences.expandDetails" :links="getBrowseLinks('subject', field.value)"
                  />
                  <span class="related" v-else-if="field.type=='related-url'">
                     <div class="related-item" v-for="(v,idx) in field.value" :key="`related-${idx}`">
                        <VirgoButton as="a" :href="v.url" target="_blank" :label="v.label" />
                     </div>
                  </span>
                  <span class="copyright" v-else-if="field.type=='copyright'">
                     <img :aria-label="`${field.item} icon`" :src="copyrightIconSrc(field)">
                     <template v-if="system.isKiosk == false">
                        <a :href="field.value" target="_blank">{{field.item}}</a>
                        <a  v-if="field.name == 'copyright_and_permissions'" class="cr-note"
                           href="https://www.library.virginia.edu/policies/use-of-materials" target="_blank"
                        >
                           More about Rights and Permissions<i style="margin-left:5px;" class="fal fa-external-link-alt"></i>
                        </a>
                     </template>
                     <span v-else>{{field.item}}</span>
                  </span>
                  <template v-else>
                     <span v-if="preferences.expandDetails" class="value" v-html="utils.fieldValueString(field)"></span>
                     <TruncatedText v-else :id="`${details.identifier}-${field.label}`" :label="field.label.toLowerCase()"
                        :text="utils.fieldValueString(field)" :limit="fieldLimit(field)" />
                  </template>
               </dd>
            </template>
            <template v-if="hasExtLink && system.isKiosk == false && detailExpanded">
               <dt class="label">Full metadata:</dt>
               <dd class="value">
                  <a :href="extDetailURL" target="_blank" @click="extDetailClicked">
                     View<i style="margin-left:5px;" class="fal fa-external-link-alt"></i>
                  </a>
               </dd>
            </template>
            <template v-if="hasMarcXML && detailExpanded && system.isKiosk == false">
               <dt class="label marc">MARC XML:</dt>
               <dd class="value"><MarcMetadata :xml="marcXML" /></dd>
            </template>
            <dt class="toggle" v-if="showFieldsToggle">
               <VirgoButton :label="expandLabel" @click="toggleExpandedView" severity="info" size="small"
                  :aria-expanded="detailExpanded.toString()" aria-controls="detail-fields"/>
            </dt>
            <dd></dd>
         </dl>
      </div>
   </div>
   <ActionsPanel :hit="details" :pool="details.source" from="DETAIL"/>
   <DigitalContent />
   <template v-if="details.source != 'images'">
      <InterLibraryLoan v-if="system.isKiosk == false && poolStore.hasInterLibraryLoan(details.source)" /> <!-- pools that support ILL (WorldCat) should not show any other availabilty UI-->
      <Availability v-else-if="hasAvailability" />
      <BoundWithItems v-if="item.hasBoundWithItems"/>
      <template v-if="collection.isBookplate && collection.isAvailable && (item.isCollection || item.isCollectionHead)">
         <h2>Bookplates Fund</h2>
         <CollectionPanel />
      </template>
      <div v-else-if="item.isCollectionHead" class="collection-head">
         <CollectionPanel />
      </div>
      <ShelfBrowse v-if="poolStore.shelfBrowseSupport(details.source) && !details.searching" :hit="details" :pool="details.source" />
   </template>
</template>

<script setup>
import ActionsPanel from "@/components/details/ActionsPanel.vue"
import Availability from "@/components/details/Availability.vue"
import InterLibraryLoan from "@/components/details/InterLibraryLoan.vue"
import BoundWithItems from "@/components/details/BoundWithItems.vue"
import MarcMetadata from "@/components/modals/MarcMetadata.vue"
import CollectionPanel from "@/components/details/CollectionPanel.vue"
import ContentAdvisory from "@/components/ContentAdvisory.vue"
import TruncatedText from "@/components/TruncatedText.vue"
import V4LinksList from "@/components/V4LinksList.vue"
import V4Pager from "@/components/V4Pager.vue"
import ShelfBrowse from "@/components/details/ShelfBrowse.vue"
import DigitalContent from "@/components/details/DigitalContent.vue"
import analytics from '@/analytics'
import * as utils from '@/utils'
import { computed, ref } from 'vue'
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

const detailExpanded = ref(false)

// details : state => state.item.details,
const details = computed(()=>{
   return item.details
})

const expandLabel = computed (() => {
   if ( detailExpanded.value ) return "Show less"
   return "Show more details"
})

const showFieldsToggle = computed( () => {
   if ( item.isCollectionHead ) return false
   if ( preferences.expandDetails ) return false
   let filteredFields = details.value.fields.filter(f => shouldDisplay(f))
   return filteredFields.length > item.primaryFields.length
})

const allDisplayFields = computed(()=> {
   let filteredFields = details.value.fields.filter(f => shouldDisplay(f))
   if ( filteredFields.length < item.primaryFields.length || item.isCollectionHead || preferences.expandDetails) {
      return filteredFields
   }

   if ( detailExpanded.value ) {
      return filteredFields
   }
   return details.value.fields.filter( f => item.primaryFields.includes(f.name))
})

const hasAvailability = computed(() => {
   if (poolStore.hasAvailability(details.value.source) && item.availability.libraries.length > 0) return true
   if (accessURLField.value != null && !system.isKiosk) return true
   return false
})

const shouldDisplay =((field) => {
   if ( field.display == 'optional' || field.type == "iiif-image-url" || field.type == "url" ||
         field.type == "access-url" || field.type == "sirsi-url" || field.display == 'availability' ||
         field.name.includes("_download_url") || (system.isKiosk && field.type == "related-url")  ) {
      return false
   }
   return true
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
const hasMarcXML = computed(()=>{
   if ( !user.isAdmin ) return false
   let xml = details.value.fields.find( f => f.type == "marc-xml")
   if (xml) return true
   return false
})
const marcXML = computed(()=>{
   let xml = details.value.fields.find( f => f.type == "marc-xml")
   if ( !xml) return ""
   return xml.value
})

const toggleExpandedView = (() => {
   detailExpanded.value = !detailExpanded.value
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

const fieldLimit = (( field ) => {
   if (field.name == "subject_summary" ) {
      return 900
   }
   return 300
})
</script>
<style lang="scss" scoped>
.item-header {
   display: flex;
   flex-flow: row wrap;
   justify-content: space-between;
   align-items: flex-start;
   gap: 30px;
   .title-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
      gap: 10px;
      text-align: left;
      h1.title {
         font-size: 1.5rem;
      }
      .subtitle {
         font-weight: normal;
      }
   }
}
.nav-wrap {
   margin-top: 30px;
}

.collection-head {
   margin-top: 50px;
}

h2 {
   margin: 50px 0 30px 0;
}

.ra-box.ra-fiy.pad-top {
   margin-top: 20px;
}


.detail-controls {
   display: flex;
   flex-direction: column;
   justify-content: flex-end;
   align-items: flex-end;
   width: 95%;
   margin: 0 auto;
}
.info {
   margin: 15px 0;
}
dl.fields {
   grid-template-columns: max-content 2fr;
   display: inline-grid;
   grid-column-gap: 20px;
   width: 100%;
   dt {
      font-weight: bold;
      text-align: left;
      padding: 5px 8px;
      white-space: nowrap;
      vertical-align: top;
   }
   dt.toggle {
      margin-top: 20px;
   }
   dd {
      margin: 0;
      width: 100%;
      // max-width: 750px;
      text-align: left;
      word-break: break-word;
      -webkit-hyphens: auto;
      -moz-hyphens: auto;
      hyphens: auto;
      padding: 4px 0px;
      :deep(p) {
         padding: 0;
         margin: 5px 0;
      }
      .related {
         display: flex;
         flex-direction: column;
         gap: 5px;
      }
   }
}

.value.more {
   margin-top: 15px;
   padding: 15px 0 10px 0;
   text-align: left;
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
</style>
