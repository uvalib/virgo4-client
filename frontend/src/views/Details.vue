<template>
   <div class="details">
      <div class="detail-header">
         <span v-if="selectedHitIdx > -1" class="hidden-spacer"></span>
         <h1>Item Details</h1>
         <span class="paging" v-if="selectedHitIdx > -1">
            <V4Pager :total="selectedResults.total" :page="selectedHit.number"
               :prevAvailable="prevHitAvailable" :nextAvailable="nextHitAvailable"
               @next="nextHitClicked" @prior="priorHitClicked"
            />
            <div class="back">
               <V4Button mode="text" @click="returnToSearch">Return to search results</V4Button>
            </div>
         </span>
      </div>
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
            <SearchHitHeader v-bind:link="false" :hit="details" :pool="details.source" from="DETAIL"/>
            <abbr class="unapi-id" :title="details.itemURL"></abbr>
            <div class="info">
               <div v-if="itemMessage(details.source)" class="ra-box ra-fiy pad-top" v-html="itemMessage(details.source)">
               </div>
               <dl class="fields">
                  <template v-if="details.header.author">
                     <dt class="label">{{details.header.author.label}}:</dt>
                     <dd class="value">
                        <V4LinksList id="author-links" :inline="true" :links="getBrowseLinks('author', details.header.author.value)" />
                     </dd>
                  </template>
                  <template v-for="(field,idx) in allDisplayFields">
                     <dt class="label" :key="`l${idx}`">{{field.label}}:</dt>
                     <dd class="value" :key="`v${idx}`">
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
                              More about Rights and Permissions<i style="margin-left:5px;" class="fas fa-external-link-alt"></i>
                           </a>
                        </span>
                        <TruncatedText v-else :id="`${details.identifier}-${field.label}`"
                           :text="$utils.fieldValueString(field)" :limit="fieldLimit(field)" />
                     </dd>
                  </template>
                  <template v-if="accessURLField && !isKiosk">
                     <dt class="label">{{accessURLField.label}}:</dt>
                     <dd class="value">
                        <AccessURLDetails mode="full" :title="details.header.title" :pool="details.source" :urls="accessURLField.value" />
                     </dd>
                  </template>
                  <dt class="label">Citations:</dt>
                  <dd class="value">
                     <Citations title="MLA Citation" :id="`citation-${details.identifier}`" style="margin-right: 10px"
                        :itemURL="details.itemURL" format="mla" buttonLabel="MLA" from="DETAIL" :iconInline="true"
                        :ariaLabel="`show MLA citation for ${details.header.title}`" >
                     </Citations>
                     <Citations title="APA Citation" :id="`citation-${details.identifier}`" style="margin-right: 10px"
                        :itemURL="details.itemURL" format="apa" buttonLabel="APA" from="DETAIL" :iconInline="true"
                        :ariaLabel="`show APA citation for ${details.header.title}`" >
                     </Citations>
                     <Citations title="Chicago Citation" :id="`citation-${details.identifier}`" style="margin-right: 10px"
                        :itemURL="details.itemURL" format="cms" buttonLabel="Chicago" from="DETAIL" :iconInline="true"
                        :ariaLabel="`show Chicago citation for ${details.header.title}`" >
                     </Citations>
                     <V4DownloadButton style="padding-left:0" label="Download RIS" :url="risURL" @click="downloadRISClicked"
                        icon="fas fa-file-export" :iconInline="true"
                        :aria-label="`download RIS citation for ${details.header.title}`"
                     />
                  </dd>
                  <template v-if="hasExtLink">
                     <dd></dd>
                     <dt class="value more">
                        <a :href="extDetailURL" target="_blank" @click="extDetailClicked">
                           More Details<i style="margin-left:5px;" class="fas fa-external-link-alt"></i>
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
         </template>
      </div>
      <Availability v-if="notFound == false" :titleId="details.identifier" />
      <DigitalContent />
      <ShelfBrowse v-if="!details.searching && notFound == false" :hit="details" :pool="details.source" :target="browseTarget"/>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import SearchHitHeader from '@/components/SearchHitHeader'
import Availability from "@/components/details/Availability"
import AccordionContent from "@/components/AccordionContent"
import beautify from 'xml-beautifier'
import AccessURLDetails from '@/components/AccessURLDetails'
import V4DownloadButton from '@/components/V4DownloadButton'
import TruncatedText from '@/components/TruncatedText'
import V4LinksList from '@/components/V4LinksList'
import V4Pager from '@/components/V4Pager'
import Citations from '@/components/modals/Citations'
import ShelfBrowse from "@/components/details/ShelfBrowse"
import DigitalContent from "@/components/details/DigitalContent"

export default {
   name: "detail",
   data: function() {
      return {
         browseTarget: ""
      };
   },
   watch: {
      $route() {
         // this is needed to load details when a grouped image thumb has been clicked; new content
         // needs to be loaded, but the page remains the same (create not called)
         this.getDetails()
      }
   },
   components: {
      SearchHitHeader, Availability, TruncatedText, V4Pager, ShelfBrowse, DigitalContent,
      AccordionContent, AccessURLDetails, V4DownloadButton, V4LinksList, Citations
   },
   computed: {
      ...mapState({
         details : state => state.item.details,
         googleBooksURL : state => state.item.googleBooksURL,
         activeRequest: state => state.restore.activeRequest,
         citationsURL: state => state.system.citationsURL,
         pools: state => state.pools.list,
         selectedHitIdx: state=> state.selectedHitIdx,
         lastSearchURL: state => state.lastSearchURL,
         poolMapping: state=>state.system.poolMapping,
      }),
      ...mapGetters({
         isAdmin: 'user/isAdmin',
         isSignedIn: 'user/isSignedIn',
         isKiosk: 'system/isKiosk',
         poolDetails: 'pools/poolDetails',
         nextHitAvailable: 'nextHitAvailable',
         prevHitAvailable: 'prevHitAvailable',
         selectedHit: 'selectedHit',
         selectedResults: 'selectedResults',
         itemMessage:  'pools/itemMessage'
      }),
      risURL() {
         if (this.citationsURL == "") return ""
         return `${this.citationsURL}/format/ris?item=${encodeURI(this.details.itemURL)}`
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
      hasExtLink() {
         let idx = this.allFields.findIndex( f=> f.name=="sirsi_url")
         if (idx == -1) {
             idx = this.allFields.findIndex( f=> f.name=="worldcat_url")
         }
         return idx > -1
      },
      extDetailURL() {
         let extLink = this.allFields.find( f=> f.name=="sirsi_url")
         if (!extLink) {
             extLink = this.allFields.find( f=> f.name=="worldcat_url")
         }
         return extLink.value
      },
      marcXML() {
         if ( !this.isAdmin ) return ""
         let xml = this.allFields.find( f => f.type == "marc-xml")
         if ( !xml) return ""
         return beautify(xml.value).trim()
      }
   },
   methods: {
      returnToSearch() {
         this.$router.push( this.lastSearchURL )
      },
      async nextHitClicked() {
         await this.$store.dispatch("nextHit")
         let url = this.$route.fullPath
         let lastSlash = url.lastIndexOf("/")
         url = url.substring(0,lastSlash )+"/"+this.selectedHit.identifier
         this.$router.push(url)
      },
      async priorHitClicked() {
         await this.$store.dispatch("priorHit")
         let url = this.$route.fullPath
         let lastSlash = url.lastIndexOf("/")
         url = url.substring(0,lastSlash )+"/"+this.selectedHit.identifier
         this.$router.push(url)
      },
      copyrightIconSrc( info ) {
         let details = this.poolDetails(this.details.source)
         return details.url+info.icon
      },
      extDetailClicked() {
         this.$analytics.trigger('Results', 'MORE_DETAILS_CLICKED', this.details.identifier)
      },
      downloadRISClicked() {
         this.$analytics.trigger('Export', 'RIS_FROM_DETAIL', this.details.identifier)
      },
      async getDetails() {
         this.mode = this.$route.query.mode
         let src = this.$route.params.src
         let id = this.$route.params.id
         let mapping = this.poolMapping[src]
         if (mapping && mapping.pool != src) {
            src = mapping.pool
            let fixed = `/sources/${src}/items/${id}`
            this.$router.replace( fixed )
            return
         }

         if ( this.isSignedIn) {
            await this.$store.dispatch("user/getAccountInfo")
            this.$store.dispatch("bookmarks/getBookmarks")
         }

         let bmTarget = this.$store.getters['restore/bookmarkTarget']
         if (bmTarget.origin == "SHELF_BROWSE"  ) {
            this.browseTarget = bmTarget.id
         }

         if (src) {
            this.$store.commit("hitSelected", id)
            await this.$store.dispatch("item/getDetails", {source:src, identifier:id})
         } else {
            await this.$store.dispatch("item/lookupCatalogKeyDetail", id )
         }

         if ( bmTarget.origin == "DETAIL" ) {
            let bmEle = document.getElementById(`bm-modal-${bmTarget.id}-btn`)
            if (bmEle) {
               bmEle.focus()
               bmEle.click()
            }
         }

         if ( this.notFound == false ) {
            this.$analytics.trigger('Results', 'ITEM_DETAIL_VIEWED', id)
            let collField = this.allFields.find( f => f.name == "digital_collection")
            if (collField) {
               this.$analytics.trigger('Results', 'COLLECTION_ITEM_VIEWED', collField.value)
            }

            document.title = this.details.header.title
         } else {
            document.title = "Virgo: Item Not Found"
         }
      },
      getBrowseLinks( name, values ) {
         let out = []
         values.forEach( v => {
            let qp = `${name}: {"${encodeURIComponent(v)}"}`
            let link = {label: v, url: `/search?mode=advanced&q=${qp}`}
            out.push(link)
         })
         return out
      },
      shouldDisplay(field) {
         if ( field.display == 'availability') return false
         if (field.display == 'optional' || field.type == "iiif-image-url" || field.type == "url" ||
             field.type == "access-url" || field.type == "sirsi-url" ||
             field.name.includes("_download_url")  ) {
            return false
         }

         if ( this.isKiosk &&  field.type == "related-url" ) return false
         return true
      },
      fieldLimit( field ) {
         if (field.name == "subject_summary" ) {
            return 900
         }
         return 300
      },
      zoteroItemUpdated() {
         // add unapi URL to document header for Zotero, if not already present
         let unapiID = 'unapi'
         if (!document.getElementById(unapiID)) {
            let unapiURL = this.citationsURL + '/unapi'
            var link = document.createElement('link')
            link.id = unapiID
            link.rel = 'unapi-server'
            link.type = 'application/xml'
            link.title = 'unAPI'
            link.href = unapiURL
            document.head.appendChild(link)
         }

         // notify zotero connector of an item change
         document.dispatchEvent(new Event('ZoteroItemUpdated', {
            bubbles: true,
            cancelable: true
         }))
      },
   },
   created() {
      this.getDetails()
   },
   updated() {
      this.zoteroItemUpdated()
   }
}
</script>
<style lang="scss" scoped>
.details {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   margin-bottom: 10vh;
   color: var(--color-primary-text);

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
   ::v-deep p {
      margin: 8px 0;
   }
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

.info {
   margin: 15px 0;
   border-top: 4px solid var(--color-brand-blue);
}
.working {
   text-align: center;
   font-size: 0.9em;
}
.working img {
   margin: 30px 0;
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
</style>
