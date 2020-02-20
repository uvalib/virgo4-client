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
                  <tr v-if="poolMode=='image'">
                     <td class="label top">Image:</td> 
                     <td class="image">
                        
                        <div class="img-view clearfix" v-viewer="{
                           inline: false,backdrop:true, navbar:false, button:true, title:false, toolbar:false}"
                        >
                           <img :src="imageURL" class="pure-img thumb">
                           <p class="hint">Click image to zoom</p>
                        </div>
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

export default {
   name: "sources",
   components: {
      SearchHitHeader, AvailabilityTable, V4Spinner
   },
   computed: {
      ...mapState({
         details : state => state.item.details,
      }),
      ...mapGetters({
         isSignedIn: 'user/isSignedIn',
         isKiosk: 'system/isKiosk',
         isUVA: 'pools/isUVA',
         poolDetails: 'pools/poolDetails'
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
      imageURL() {
         let iiifField = this.allFields.find( f => f.type=="iiif-base-url")
         return [`${iiifField.value}/full/1500,/0/default.jpg`]
      },
      manifestURL() {
         let iiifField = this.allFields.find( f => f.type=="iiif-manifest-url")
         return iiifField.value
      },
   },
   methods: {
      getSubjectLink(subj) {
         return `/browse/subjects?q=${encodeURI(subj)}`
      },
      shouldDisplay(field) {
         if (field.display == 'optional' || field.type=="iiif-manifest-url" || field.type=="iiif-base-url") return false
         if ( this.isKiosk && field.type == "url" || field.type=="iiif-manifest-ur") return false
         return true
      },
      fieldValueString( field ) {
         if ( Array.isArray(field.value)) {
            if (field.type == "url") {
               let out = []
               field.value.forEach( (v,idx) => {
                  let url = `<a href="${v}" target="_blank">`
                  if ( idx === 0) {
                     url += `<i style="margin-right: 5px;" class="more fas fa-link"></i>`
                  }
                  url += `External Link #${idx+1}</a>`
                  out.push( url )
               })
               return out.join(",&nbsp;&nbsp;")
            }
            return field.value.join(",&nbsp;")
         }
         if (field.type == "url") {
            return `<a href="${field.value}" target="_blank"><i style="margin-right:5px;" class="more fas fa-link"></i>External Link</a>`
         }
         return field.value
      },
   },
   created() {
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
#app td.value >>> a.pure-button.pure-button-primary.ext {
   background-color:var(--color-pale-blue);
   color: white;
   padding: 3px 0px;
   width: 100%;
   border-radius: 5px;
}
#app td.value >>> a.pure-button.pure-button-primary.ext:hover {
   text-decoration: none;
}
td.label {
   font-weight: bold;
   text-align: right;
   padding: 4px 8px;
   width:1%;
   white-space: nowrap;
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
.bookmark-container {
   float:left;
}
.sep {
   margin: 0 5px;
}
div.img-view {
   text-align: left;
   display: inline-block
}
p.hint {
   margin: 0;
   text-align: center;
   font-size: 0.9em;
   background: var(--uvalib-brand-blue-light);
   padding: 5px;
   color: white;
   font-weight: bold;
   border-top: 1px solid var(--uvalib-grey-darkest);
   box-sizing: border-box;
}
img.pure-img.thumb {
   border: 1px solid var(--uvalib-grey);
   box-sizing: border-box;
}
img.pure-img.thumb:hover {
   cursor:pointer;
}
@media only screen and (min-width: 768px) {
   img.pure-img.thumb,p.hint {
      max-width: 70%;
   }
}
</style>
