<template>
   <div class="hit" v-bind:data-identifier="hit.identifier">
      <SearchHitHeader :maxLen="60" :count="count" :hit="hit" :pool="pool"/>
      <div class="top">
         <div class="basic">
            <div v-if="hit.header.author" class="author">
               <TruncatedText :title="hit.header.author.label" 
                  :text="hit.header.author.value.join('; ')" :limit="truncateLength" />
            </div>
            <dl class="fields">
               <template v-for="(field) in hit.basicFields">
                  <template v-if="shouldDisplay(field)">
                     <dt :key="getKey(field,'k')">{{field.label}}:</dt>
                     <dd :key="getKey(field,'v')" >
                        <TruncatedText :title="field.label" :text="fieldValueString(field)" :limit="truncateLength" />
                     </dd>
                  </template>
               </template>
               <template v-if="accessURLField">
                  <dt class="label">{{accessURLField.label}}:</dt>
                  <dd class="value" v-html="accessURLs()"></dd>
               </template>
            </dl>
         </div>
         <router-link v-if="hasCoverImages(pool)" class="img-link" :to="detailsURL">
            <img class="cover-img" v-if="hit.cover_image" :src="hit.cover_image"/>
         </router-link>
      </div>
      <AccordionContent v-if="hit.grouped" :title="groupTitle" :id="hit.identifier" :autoExpandID="autoExpandGroupID"
         class="group" :autoCollapseOn="searching">
         <div class="group-item-wrapper" v-for="(groupHit,idx) in hit.group" :key="idx">
            <GroupedSearchHit :pool="pool" :hit="groupHit" :key="idx"/>
         </div>
      </AccordionContent>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import SearchHitHeader from '@/components/SearchHitHeader'
import AccordionContent from '@/components/AccordionContent'
import GroupedSearchHit from '@/components/GroupedSearchHit'
import TruncatedText from '@/components/TruncatedText'
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true},
      count: {type: Number, required: true}
   },
   components: {
      SearchHitHeader, AccordionContent, GroupedSearchHit, TruncatedText
   },
   computed: {
      accessURLField() {
         return this.hit.basicFields.find(f => f.name=="access_url")
      },
      detailsURL() {
         return `/sources/${this.pool}/items/${this.hit.identifier}`
      },
      groupTitle() {
         return `Show other versions (${this.hit.group.length})`
      },
      ...mapState({
         searching: state => state.searching,
         autoExpandGroupID: state => state.autoExpandGroupID
      }),
      ...mapGetters({
         isKiosk: "system/isKiosk",
         hasCoverImages: 'pools/hasCoverImages',
         findProvider: 'pools/findProvider'
      }),
      truncateLength() {
         if ( this.hasCoverImages(this.pool)) return 60
         return 80
      }
   },
   methods: {
      getKey(field,idx) {
         return this.hit.identifier+field.value+idx
      },
      shouldDisplay(field) {
         if (field.display == 'optional' || field.type == "url") return false
         if ( this.isKiosk && field.type == "url") return false
         return true
      },
      fieldValueString(field) {
         if ( Array.isArray(field.value)) {
            return field.value.join(", ")
         }
         return field.value
      },
      accessURLs() {
         // the access_url value is an array of {provider:name, links:[]}
         let out = ""
         let urlField = this.accessURLField
         urlField.value.forEach( p => {
            let pDetail = this.findProvider(this.pool, p.provider)
            if (p.links.length == 1) {
                out += `<div class='provider'>`
                out += `<a href='${p.links[0].url}' target='_blank'>${pDetail.label}</a>`
                out += `</div>`
            } else {
               out += `<div class='provider'><span class='provider'>${pDetail.label}</span><div class='links'>`
               let pUrls = []
               p.links.slice(0,10).forEach( l => {
                  let url =`<a href="${l.url}" target="_blank">`
                  if ( l.label ) {
                     url += `${l.label}</a>`
                  } else {
                     url += `${l.url}</a>`
                  }
                  pUrls.push(url)
               })   
               if (p.links.length > 10 ) {
                  pUrls.push(`see ${p.links.length -10} more on details page`)   
               }
               out += pUrls.join(" | ")
               out += '</div></div>' 
            }
         })
         return out
      },
   }
};
</script>

<style scoped>
div.details {
   padding: 10px;
}
.top {
   display:flex;
   flex-flow: row wrap;
   align-items: flex-start;
}
@media only screen and (min-width: 600px) {
   a.img-link {
      margin-left: auto;
   }
}
@media only screen and (max-width: 600px) {
   .top {
      justify-content: center
   }
   a.img-link {
      margin-left: initial;
   }
}
.author {
   margin-bottom: 10px;
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
div.basic {
   padding: 5px 10px 10px 10px;
   flex-grow: 1;
}
.hit {
   width: 100%;
   padding: 10px;
   box-sizing: border-box;
   text-align: left;
   background-color: white;
}
.cover-img.small {
   max-height: 124px;
   max-width: 100px;
}
dl {
   margin-top: 0;
   margin-left: 15px;
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
}
.group-item-wrapper {
   padding: 15px;
   border: 1px solid #ccc;
   border-radius: 5px;
   margin: 10px;
}
dd.value >>> span.provider {
   color: var(--uvalib-grey);
   font-weight:  bold;
}
dd.value >>> .links {
   margin: 10px 0;
   word-break: break-word;
   -webkit-hyphens: auto;
   -moz-hyphens: auto;
   hyphens: auto;
   max-width: 400px;
}
</style>
<style>
#app .accordion.group .title {
   padding: 5px 10px;
   font-weight: bold;
   border-radius: 5px;
   border: 1px solid var(--uvalib-brand-orange) !important;
   width: 100%;
   box-sizing: border-box;
}
#app .accordion.group {
   display: inline-block;
   width: 100%;
   box-sizing: border-box;
}
#app .group .title .text {
  color: var(--uvalib-text);
}
@media only screen and (max-width: 600px) {
  #app .accordion.group .title {
     width: inherit;
  }
  #app .accordion.group {
     display: inherit;
  }
}
</style>
