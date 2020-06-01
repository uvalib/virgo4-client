<template>
   <div class="details">
      <h1>Item Details</h1>
      <div class="details-content">
         <div class="working" v-if="details.searching" >
            <V4Spinner message="Looking up details..."/>
         </div>
         <template v-else-if="notFound">
            <div class="not-found">
               <p><b>Sorry!</b></p>
               <p>The requested item was not found</p>
            </div>
         </template>
         <template v-else>
            <SearchHitHeader v-bind:link="false" :hit="details" :pool="details.source"/>
            <div class="info">
               <dl class="fields">
                  <template v-if="details.header.author">
                     <dt class="label">{{details.header.author.label}}:</dt>
                     <dd class="value">{{details.header.author.value.join("; ")}}</dd>
                  </template>
                  <template v-for="(field,idx) in allDisplayFields">
                     <dt class="label" :key="`l${idx}`">{{field.label}}:</dt>
                     <template v-if="field.type == 'subject'" >
                        <dd class="value" :key="`v${idx}`">
                           <template v-if="Array.isArray(field.value)">
                              <template  v-for="(val,idx) in field.value">
                                 <span v-if="idx>0" class="sep" :key="idx+'s'">|</span>
                                 <router-link  :key="idx" :to="getSubjectLink(val)">
                                    <span class="subject-link">{{val}}</span>
                                 </router-link>
                              </template>
                           </template>
                           <router-link  v-else :to="getSubjectLink(field.value)">
                              <span class="subject-link">{{field.value}}</span>
                           </router-link>
                        </dd>
                     </template>
                     <dd v-else class="value" v-html="fieldValueString(field)" :key="`v${idx}`"></dd>
                  </template>
                  <template v-if="accessURLField">
                     <dt class="label">{{accessURLField.label}}:</dt>
                     <dd class="value">
                        <AccessURLDetails mode="full" :title="details.header.title" :pool="details.source" :urls="accessURLField.value" />
                     </dd>
                  </template>
                  <template v-if="hasPDFContent">
                     <dt class="label">PDF Download:</dt>
                     <dd class="value">
                        <template v-for="(dc,idx) in pdfs">
                           <span class="sep" v-if="idx>0" :key="`pdfsep${idx}`">|</span>
                           <a v-if="dc.status=='READY'" :href="dc.url" :key="`pdf${idx}`" 
                              :aria-label="`download pdf for ${dc.name}`"
                           >
                              {{dc.name}}
                           </a>
                           <DownloadProgress v-else :name="dc.name" :key="`pdf${idx}`" 
                              :aria-label="`download pdf for ${dc.name}`"
                           />
                        </template>
                     </dd>
                  </template>
                  <dt class="label">Citation:</dt>
                  <dd class="value">
                     <V4DownloadButton label="Export RIS Citation" :url="risURL" @click="triggerMatomoEvent"
                        :aria-label="`export citation for ${details.header.title}`"
                     />
                  </dd>
                  <template v-if="extDetailLink">
                     <dd></dd>
                     <dt class="value more"  v-html="extDetailLink"></dt>
                  </template>
                  <template v-if="poolMode=='image'">
                     <dt class="label">Image:</dt>
                     <dd class="image">
                        <ImageDetails :mode="mode"/>
                     </dd>
                  </template>
               </dl>
               <template v-if="marcXML">
                  <AccordionContent class="marc" id="maxc-xml">
                     <template v-slot:title>MARC XML</template>
                     <pre class="xml">{{marcXML}}</pre>
                  </AccordionContent>
               </template>
            </div>
            <AvailabilityTable v-if="hasAvailability" :titleId="details.identifier" />
         </template>
      </div>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import SearchHitHeader from '@/components/SearchHitHeader'
import ImageDetails from '@/components/ImageDetails'
import AvailabilityTable from "@/components/AvailabilityTable"
import AccordionContent from "@/components/AccordionContent"
import beautify from 'xml-beautifier'
import AccessURLDetails from '@/components/AccessURLDetails'
import DownloadProgress from '@/components/popovers/DownloadProgress'
import V4DownloadButton from '@/components/V4DownloadButton'

export default {
   name: "sources",
   data: function() {
      return {
         viewerOpts: {
            title: false, url: 'data-src', inline: false,
            backdrop:true, navbar:false, button:true,
            toolbar:false, loop: false, fullScreen: true,
            zIndex: 9999
         },
         mode: 'grouped'
      };
   },
   watch: {
      $route() {
         this.getDetails()
      }
   },
   components: {
      SearchHitHeader, AvailabilityTable, DownloadProgress,
      ImageDetails, AccordionContent, AccessURLDetails, V4DownloadButton
   },
   computed: {
      risURL() {
         if (this.citationsURL == "") return ""
         let poolObj = this.pools.find( p => p.id == this.details.source)
         let itemURL = `${poolObj.url}/api/resource/${this.details.identifier}`
         return `${this.citationsURL}/format/ris?item=${encodeURI(itemURL)}`
      },
      ...mapState({
         details : state => state.item.details,
         activeRequest: state => state.restore.activeRequest,
         citationsURL: state => state.system.citationsURL,
         pools: state => state.pools.list
      }),
      ...mapGetters({
         isAdmin: 'user/isAdmin',
         isSignedIn: 'user/isSignedIn',
         isKiosk: 'system/isKiosk',
         isUVA: 'pools/isUVA',
         poolDetails: 'pools/poolDetails',
      }),
      hasPDFContent() {
         return this.details.digitalContent.filter( dc => dc.type == "PDF").length > 0
      },
      pdfs() {
         return this.details.digitalContent.filter( dc => dc.type == "PDF")
      },
      poolMode() {
         let details = this.poolDetails(this.details.source)
         return details.mode
      },
      hasAvailability() {
         return this.isUVA(this.details.source)
      },
      notFound() {
         return this.details.identifier.length == 0
      },
      allFields() {
         return [...this.details.basicFields.concat(this.details.detailFields)]
      },
      allDisplayFields() {
         return this.allFields.filter(f => this.shouldDisplay(f))
      },
      accessURLField() {
         return this.allFields.find(f => f.name=="access_url")
      },
      extDetailLink() {
         let extLink = this.allFields.find( f=> f.name=="sirsi_url")
         if (!extLink) {
             extLink = this.allFields.find( f=> f.name=="worldcat_url")
         }
         if (!extLink) return ""
         return `<a href="${extLink.value}" target="_blank">More Details<i style="margin-left:5px;"class="fas fa-external-link-alt"></i></a>`
      },
      marcXML() {
         if ( this.isUVA(this.details.source) === false ) return ""
         if ( !this.isAdmin ) return ""
         let xml = this.allFields.find( f => f.type == "marc-xml")
         if ( !xml) return ""
         return beautify(xml.value).trim()
      }
   },
   methods: {
      triggerMatomoEvent() {
         if (window._paq ) {
            window._paq.push(['trackEvent', 'Export', 'RIS_FROM_DETAIL', this.details.identifier])
         } else {
            console.error("_PAQ IS NOT AVAILABLE; CANNOT TRIGGER EVENT")
         }
      },
      getDetails() {
         this.mode = this.$route.query.mode
         let src = this.$route.params.src
         let id= this.$route.params.id
         if (src) {
            this.$store.dispatch("item/getDetails", {source:src, identifier:id})
         } else {
            this.$store.dispatch("item/lookupCatalogKeyDetail", id )
         }
         if ( this.isSignedIn) {
            this.$store.dispatch("bookmarks/getBookmarks")
         }
      },
      getSubjectLink(subj) {
         return `/browse/subjects?q=${encodeURI(subj)}`
      },
      shouldDisplay(field) {
         if (field.display == 'optional' || field.name=="iiif_manifest_url" ||
             field.name=="iiif_image_url" || field.type == "url" ||
             field.name.includes("_download_url")  ) {
            return false
         }
         if ( this.isKiosk && field.type == "url") return false
         return true
      },
      fieldValueString( field ) {
         if ( Array.isArray(field.value)) {
            return field.value.join(",&nbsp;")
         }
         return field.value
      },
   },
   created() {
      this.getDetails()
      if ( this.activeRequest ) {
         this.$store.commit('requests/activePanel', this.activeRequest )
         this.$store.commit('restore/clear')
      }
   },
}
</script>
<style lang="scss" scoped>
.details {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
   
   .details-content {
      width: 80%;
      margin: 0 auto;
   }

   .icon {
      margin-left: 5px;
   }
}
@media only screen and (min-width: 768px) {
   div.details-content  {
      width: 80%;
   }
}
@media only screen and (max-width: 768px) {
   div.details-content  {
      width: 95%;
   }
}
.info {
   margin: 15px 0;
   border-top: 4px solid var(--color-brand-blue);
}
.cover-img {
   max-width: 300px;
   margin: 10px;
   border-radius: 5px;
}
.working {
   text-align: center;
   font-size: 0.9em;
}
.working img {
   margin: 30px 0;
}
.bookmark-container {
   float:left;
}
::v-deep .sep {
   margin: 0 5px;
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
</style>
