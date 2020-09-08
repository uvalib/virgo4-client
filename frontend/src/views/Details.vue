<template>
   <div class="details">
      <div class="detail-header">
         <span v-if="selectedHitIdx > -1 && selectedResults.total > 1" class="hidden-spacer"></span>
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
            <SearchHitHeader v-bind:link="false" :hit="details" :pool="details.source"/>
            <abbr class="unapi-id" :title="itemURL"></abbr>
            <div class="info">
               <div v-if="hasExternalHoldings(details.source)" class="ext-warn">
                  This resource is not held by UVA Libraries,
                  <a :href="owningInstitution" target="_blank">contact the owning institution<i style="margin:0 5px;" class="fas fa-external-link-alt"></i></a>
                  to determine how to gain access to them, or disable searching of these materials in your preferences.
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
                              <label class="link-label" :for="`rl-${idx}`">{{v.label}}</label>
                              <a :id="`rl-${idx}`" :href="v.url" target="_blank">{{v.url}}</a>
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
                  <template v-if="hasPDFContent">
                     <dt class="label">Download PDF:</dt>
                     <dd class="value">
                        <template v-for="(dc,idx) in pdfs">
                           <a v-if="dc.status=='READY'" :key="`pdf${idx}`" :href="dc.url" :aria-label="`download pdf for ${dc.name}`" class="pdf-download">
                              <img v-if="dc.thumbnail" :src="dc.thumbnail"/>
                              <span class="label">{{dc.name}}</span>
                           </a>
                           <DownloadProgress v-else :name="dc.name" :id="`${details.identifier}-pdf${idx}`" :key="`pdf${idx}`"
                              :ariaLabel="`download pdf for ${dc.name}`"
                           />
                        </template>
                     </dd>
                  </template>
                  <dt class="label">Download Citation:</dt>
                  <dd class="value">
                     <V4DownloadButton style="padding-left:0" label="RIS" :url="risURL" @click="downloadRISCliecked"
                        :aria-label="`export citation for ${details.header.title}`"
                     />
                  </dd>
                  <template v-if="googleBooksURL">
                     <dt class="label">Google Preview:</dt>
                     <dd class="value">
                        <a :href="googleBooksURL" target="_blank" aria-label="google books preview">
                           <img alt="Google Books Preview" src="//books.google.com/intl/en/googlebooks/images/gbs_preview_button1.gif"/>
                        </a>
                     </dd>
                  </template>
                  <template v-if="hasExtLink">
                     <dd></dd>
                     <dt class="value more">
                        <a :href="extDetailURL" target="_blank" @click="extDetailClicked">
                           More Details<i style="margin-left:5px;" class="fas fa-external-link-alt"></i>
                        </a>
                     </dt>
                  </template>
                  <template v-if="poolMode=='image'">
                     <dt class="label">Image:</dt>
                     <dd class="image">
                        <ImageDetails :mode="mode"/>
                     </dd>
                  </template>
               </dl>
               <template v-if="hasEmbeddedMedia">
                  <span v-for="(iframe,idx) in details.embeddedMedia" :key="`embed${idx}`" v-html="iframe"></span>
               </template>
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
import AvailabilityTable from "@/components/details/AvailabilityTable"
import AccordionContent from "@/components/AccordionContent"
import beautify from 'xml-beautifier'
import AccessURLDetails from '@/components/AccessURLDetails'
import DownloadProgress from '@/components/modals/DownloadProgress'
import V4DownloadButton from '@/components/V4DownloadButton'
import TruncatedText from '@/components/TruncatedText'
import V4LinksList from '@/components/V4LinksList'
import V4Pager from '@/components/V4Pager'

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
         // this is needed to load details when a grouped image thumb has been clicked; new content
         // needs to be loaded, but the page remains the same (create not called)
         this.getDetails()
      }
   },
   components: {
      SearchHitHeader, AvailabilityTable, DownloadProgress, TruncatedText,V4Pager,
      ImageDetails, AccordionContent, AccessURLDetails, V4DownloadButton, V4LinksList
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
      }),
      ...mapGetters({
         isAdmin: 'user/isAdmin',
         isSignedIn: 'user/isSignedIn',
         isKiosk: 'system/isKiosk',
         isUVA: 'pools/isUVA',
         hasExternalHoldings: 'pools/hasExternalHoldings',
         poolDetails: 'pools/poolDetails',
         nextHitAvailable: 'nextHitAvailable',
         prevHitAvailable: 'prevHitAvailable',
         selectedHit: 'selectedHit',
         selectedResults: 'selectedResults'
      }),
      itemURL() {
         let poolObj = this.pools.find( p => p.id == this.details.source)
         return `${poolObj.url}/api/resource/${this.details.identifier}`
      },
      risURL() {
         if (this.citationsURL == "") return ""
         return `${this.citationsURL}/format/ris?item=${encodeURI(this.itemURL)}`
      },
      hasEmbeddedMedia() {
         return this.details.embeddedMedia.length > 0
      },
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
      owningInstitution() {
         let details = this.poolDetails(this.details.source)
         let attr = details.attributes.find( a=> a.name=='external_hold')
         return attr.value
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
         if ( this.isUVA(this.details.source) === false ) return ""
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
      downloadRISCliecked() {
         this.$analytics.trigger('Export', 'RIS_FROM_DETAIL', this.details.identifier)
      },
      getDetails() {
         this.mode = this.$route.query.mode
         let src = this.$route.params.src
         let id= this.$route.params.id
         if (this.$route.path.includes("/catalog/")) {
            this.$analytics.trigger('Bookmarks', 'FOLLOW_V3_BOOKMARK', id)
         }

         if (src) {
            this.$store.dispatch("item/getDetails", {source:src, identifier:id})
             this.$store.commit("hitSelected", id)
         } else {
            this.$store.dispatch("item/lookupCatalogKeyDetail", id )
         }
         if ( this.isSignedIn) {
            this.$store.dispatch("bookmarks/getBookmarks")
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
         if (field.display == 'optional' || field.type == "iiif-manifest-url" ||
             field.type == "iiif-image-url" || field.type == "url" ||
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
            //console.log(`[zotero] created link tag with url: [${unapiURL}]`)
         }

         // notify zotero connector of an item change
         document.dispatchEvent(new Event('ZoteroItemUpdated', {
            bubbles: true,
            cancelable: true
         }))
         //console.log(`[zotero] dispatched item updated event`)
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
   color: var(--color-primary-text);

   dl.fields {
      grid-template-columns: 1fr 2fr;
      dt.label {
         white-space: normal;
      }
   }

   .pdf-download {
      display: inline-block;
      text-align: center;
      margin: 5px;
      border: 1px solid var(--uvalib-grey-light);
      padding: 5px 10px;
      border-radius: 5px;
      img {
         display: inline-block;
         border-radius: 5px;
      }
      span {
         display: block
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

   .ext-warn {
      margin: 20px 10px 0 10px;
      text-align: left;
      padding: 10px 15px;
      background: var(--uvalib-yellow);
      border-radius: 5px;
      font-weight: bold;
      box-shadow: $v4-box-shadow-light;
   }

   .details-content {
      width: 80%;
      margin: 0 auto;
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
.related {
   label {
      display: block;
      font-weight: 500;
   }
   a {
      display: inline-block;
      margin-bottom: 10px;
   }
}
</style>
