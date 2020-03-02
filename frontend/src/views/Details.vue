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
                     <dt class="label">{{accessURLField.label}}</dt>
                     <dd class="value" v-html="accessURLs()"></dd>
                  </template>
                  <template v-if="marcXML">
                     <dt class="label">MARC XML</dt>
                     <dd class="value">
                        <AccordionContent id="marc" class="marc" border-width="0" layout="narrow" title="View XML">
                           <pre class="xml">{{marcXML}}</pre>
                        </AccordionContent>
                     </dd>
                  </template>
                  <template v-if="sirsiLink">
                     <dd></dd>
                     <dt class="value more"  v-html="sirsiLink"></dt>
                  </template>
                  <template v-if="poolMode=='image'">
                     <dt class="label">Image:</dt> 
                     <dd class="image">
                        <ImageDetails :mode="mode"/>
                     </dd>
                  </template>
               </dl>
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
import V4Spinner from "@/components/V4Spinner"
import AccordionContent from "@/components/AccordionContent"
import beautify from 'xml-beautifier'

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
      SearchHitHeader, AvailabilityTable, V4Spinner, 
      ImageDetails, AccordionContent
   },
   computed: {
      ...mapState({
         details : state => state.item.details,
      }),
      ...mapGetters({
         isAdmin: 'user/isAdmin',
         isSignedIn: 'user/isSignedIn',
         isKiosk: 'system/isKiosk',
         isUVA: 'pools/isUVA',
         poolDetails: 'pools/poolDetails',
         findProvider: 'pools/findProvider'
      }),
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
      manifestURL() {
         let iiifField = this.allFields.find( f => f.type=="iiif-manifest-url")
         return iiifField.value
      },
      sirsiLink() {
         let sl = this.allFields.find( f=> f.name=="sirsi_url")
         if (!sl) return ""
         return `<a href="${sl.value}" target="_blank">More Details<i style="margin-left:5px;"class="fas fa-external-link-alt"></i></a>`
      },
      marcXML() {
         if ( !this.isAdmin ) return ""
         let xml = this.allFields.find( f => f.type == "marc-xml")
         return beautify(xml.value).trim()
      }
   },
   methods: {
      getDetails() {
         this.mode = this.$route.query.mode
         let src = this.$route.params.src
         let id= this.$route.params.id
         if (src == "course-reserves") {
            this.$store.dispatch("item/lookupCatalogKeyDetail", id )
         } else {
            this.$store.dispatch("item/getDetails", {source:src, identifier:id})
            if ( this.isSignedIn) {
               this.$store.dispatch("bookmarks/getBookmarks")
            }
         }
      },
      getSubjectLink(subj) {
         return `/browse/subjects?q=${encodeURI(subj)}`
      },
      shouldDisplay(field) {
         if (field.display == 'optional' || field.type=="iiif-manifest-url" || 
            field.type=="iiif-base-url" || field.type=="iiif-base-url" || 
            field.name=="sirsi_url" || field.name=="iiif_image_url" || field.name == "access_url") {
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
      accessURLs() {
         // NOTE: access URLs are special. instead value being an array of strings,
         // it is an array of objects: {url, provider}
         let out = []
         this.accessURLField .value.forEach( v => {
            let url = this.generateURLCode(v.provider, v.url)
            out.push( url )
         })
         return out.join("<br/>")
      },
      generateURLCode( provider, tgtURL) {
         let url =`<a href="${tgtURL}" target="_blank">`
         if (provider) {
            let pDetail = this.findProvider(this.details.source, provider)
            let pName = provider 
            if (pDetail.label) {
               pName = pDetail.label   
            }
            url += `${pName}`
         } else {
            url += `${tgtURL}`
         }
         url += `</a>`
         return url
      }
   },
   created() {
      this.getDetails()
   },
}
</script>
<style scoped>
.details {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
.details-content {
   width: 80%;
   margin: 0 auto;
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
.sep {
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
    padding: 15px 0 10px 0;
    text-align: left;
}
.xml {
   font-weight: normal;
   font-size: 0.8em;
   border: 1px solid var(--uvalib-grey-light);
   padding: 10px;
   border-radius: 5px;
}
</style>
