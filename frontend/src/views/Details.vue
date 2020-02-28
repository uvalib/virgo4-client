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
               <table class="fields">
                  <tr v-if="details.header.author">
                     <td class="label">{{details.header.author.label}}:</td>
                     <td class="value">{{details.header.author.value.join("; ")}}</td>
                  </tr>
                  <tr v-for="(field,idx) in allFields" :key="idx">
                     <template v-if="shouldDisplay(field)">
                        <td class="label">{{field.label}}:</td>
                        <template v-if="field.type == 'subject'" >
                           <td class="value">
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
                           </td>
                        </template>
                        <td v-else class="value" v-html="fieldValueString(field)"></td>
                     </template>
                  </tr>
                  <tr v-if="sirsiLink">
                     <td></td>
                     <td class="value more"  v-html="sirsiLink"></td>
                  </tr>
                  <tr v-if="poolMode=='image'">
                     <td class="label top">Image:</td> 
                     <td class="image">
                        
                        <template v-if="isGrouped && mode != 'single'">
                           <viewer :images="details.related" class="img-view" ref="viewer" :options="viewerOpts">
                              <template slot-scope="scope">
                                 <template  v-for="(r,idx) in scope.images">
                                    <div class="thumb-wrap" :key="`w${idx}`">
                                       <img :src="relatedImageURL(r,'thumb')" :data-src="relatedImageURL(r,'full')" 
                                          class="thumb small" >
                                       <div class="thumb-toolbar">
                                          <router-link class="img-link" :to="detailsURL(r)">
                                             Details
                                          </router-link>
                                          <span class="iiif-small">
                                             <a :href="manifestURL" target="_blank">
                                                <span class="iiif-icon"></span>
                                             </a>
                                          </span>
                                       </div>
                                    </div>
                                 </template>
                                 <div class="iiif-help">
                                    <span>What is IIIF</span>
                                    <IIIFInfo style="display:inline-block;margin-left: 5px;"/>
                                 </div>
                              </template>
                           </viewer>
                        </template>

                        <template v-else>
                           <viewer class="img-view large" ref="viewer" :options="viewerOpts">
                              <img :src="imageURL('med')" :data-src="imageURL('full')" class="pure-img thumb large">
                           </viewer>
                        
                           <div class="img-toolbar">
                              <span class="hint">Click image to zoom</span>
                              <span class="iiif">
                                 <a :href="manifestURL" target="_blank">
                                    <img src="../assets/iiif_icon.png"/>
                                 </a>
                                 <IIIFInfo style="display:inline-block;margin-left: 5px;"/>
                              </span>
                           </div>
                        </template>
                     </td>
                  </tr>
               </table>
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
import AvailabilityTable from "@/components/AvailabilityTable"
import V4Spinner from "@/components/V4Spinner"
import IIIFInfo from "@/components/popovers/IIIFInfo"

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
      SearchHitHeader, AvailabilityTable, V4Spinner, IIIFInfo
   },
   computed: {
      ...mapState({
         details : state => state.item.details,
      }),
      ...mapGetters({
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
      manifestURL() {
         let iiifField = this.allFields.find( f => f.type=="iiif-manifest-url")
         return iiifField.value
      },
      isGrouped() {
         return this.details.related && this.details.related.length > 1
      },
      sirsiLink() {
         let sl = this.allFields.find( f=> f.name=="sirsi_url")
         if (!sl) return ""
         return `<a href="${sl.value}" target="_blank">More Details<i style="margin-left:5px;"class="fas fa-external-link-alt"></i></a>`
      },
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
      imageURL(size) {
         let iiifField = this.allFields.find( f => f.type=="iiif-base-url")
         if ( size == 'full') {
            return [`${iiifField.value}/full/2000,/0/default.jpg`]
         }
         if ( size == 'med') {
            return [`${iiifField.value}/full/750,/0/default.jpg`]
         }
         return [`${iiifField.value}/square/200,200/0/default.jpg`]
      },
      detailsURL( rel ) {
         return `/sources/${this.details.source}/items/${rel.id}?mode=single`
      },
      relatedImageURL( rel, size ) {
         let baseURL = rel['iiif_base_url']
         if (size == 'full') {
            return [`${baseURL}/full/1200,/0/default.jpg`]
         }
         return [`${baseURL}/square/175,175/0/default.jpg`]
      },
      getSubjectLink(subj) {
         return `/browse/subjects?q=${encodeURI(subj)}`
      },
      shouldDisplay(field) {
         if (field.display == 'optional' || field.type=="iiif-manifest-url" || 
            field.type=="iiif-base-url" || field.type=="iiif-base-url" || 
            field.name=="sirsi_url" ) {
            return false
         }
         if ( this.isKiosk && field.type == "url") return false
         return true
      },
      fieldValueString( field ) {
         if ( Array.isArray(field.value)) {
            if (field.type == "url") {
               let out = []
               field.value.forEach( v => {
                  let url = this.generateURLCode(field.provider, v)
                  out.push( url )
               })
               return out.join(",&nbsp;&nbsp;")
            }
            return field.value.join(",&nbsp;")
         }
         if (field.type == "url") {
            return this.generateURLCode(field.provider, field.value)
         }
         return field.value
      },
      generateURLCode(provider, tgtURL) {
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
table {
   table-layout: auto;
   margin-top: 15px;
}
td.label {
   font-weight: bold;
   text-align: right;
   padding: 4px 8px;
   width:1%;
   white-space: nowrap;
   vertical-align: top;
}
td.label.top {
   vertical-align: top;
}
table td.value, table td.image {
   width: 100%;
   font-weight: normal;
   text-align: left;
   width: 100%;
   padding: 4px 8px;
   word-break: break-word;
   -webkit-hyphens: auto;
   -moz-hyphens: auto;
   hyphens: auto;
   text-align: left;
}
table td.value.more {
    padding: 15px 8px 4px 8px;
}
.bookmark-container {
   float:left;
}
.sep {
   margin: 0 5px;
}
.iiif {
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
}
div.img-view {
   text-align: left;
   display: inline-block;
   position: relative;
   vertical-align: top;
}
div.img-toolbar {
   display: flex;
   flex-flow: row nowrap;
   justify-content: space-between;
   padding: 5px 0;
   box-sizing: border-box;
}
.thumb-wrap {
   display: inline-block;
   border: 1px solid var( --uvalib-grey-light);
   margin: 5px;
   padding: 5px 5px 0 5px;
   border-radius: 5px;
}
.thumb-wrap  img {
   border-radius: 5px;
}
span.hint {
   font-size: 0.9em;
   padding: 5px;
   box-sizing: border-box;
}
img.thumb {
   border: 1px solid var(--uvalib-grey);
   box-sizing: border-box;
}
img.thumb.small {
   background-image: url('~@/assets/spinner2.gif');
   background-repeat:no-repeat;
   background-position: center center;
   min-width: 175px;
   min-height: 175px;
   background-color: var(--uvalib-grey-lightest);
}
img.thumb:hover {
   cursor:pointer;
}
.iiif-help {
   margin-top: 5px;
   font-size: 0.9em;
}
.thumb-toolbar {
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
   justify-content: space-between;
   font-size: 0.9em;
}
.iiif-icon {
   background-image: url('~@/assets/iiif_icon.png');
   background-size: contain;
   display: inline-block;
   width: 35px;
   height: 30px;
}
@media only screen and (min-width: 768px) {
   div.img-toolbar, .img-view.large {
      max-width: 70%;
   }
}
</style>
