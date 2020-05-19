<template>
   <div class="hit" v-bind:data-identifier="hit.identifier">
      <SearchHitHeader :maxLen="60" :count="count" :hit="hit" :pool="pool"/>
      <SearchHitDetail :hit="hit" :pool="pool"/>
      <AccordionContent v-if="hit.grouped" :title="groupTitle" :id="hit.identifier" :autoExpandID="autoExpandGroupID"
         class="group" :autoCollapseOn="searching">
         <template v-for="(groupHit,idx) in hit.group">
            <div class="group-item-wrapper" :key="`g${idx}`">
               <SearchHitHeader :maxLen="60" :count="-1" :hit="hit" :pool="pool"/>
               <SearchHitDetail :hit="groupHit" :pool="pool"/>
            </div>
         </template>
      </AccordionContent>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import SearchHitHeader from '@/components/SearchHitHeader'
import SearchHitDetail from '@/components/SearchHitDetail'
import AccordionContent from '@/components/AccordionContent'
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true},
      count: {type: Number, required: true}
   },
   components: {
      SearchHitHeader, SearchHitDetail, AccordionContent
   },
   computed: {
      hasDigitalContent() {
         if (this.isKiosk) return false
         let dc = this.hit.basicFields.find(f => f.name=="pdf_download_url")   
         return dc
      },
      digitalContentLinks() {
         let dc = this.hit.basicFields.find(f => f.name=="pdf_download_url")  
         return `<a href="${dc.value}"><i class="icon far fa-file-pdf"></i><label>Download PDF</label></a>`
      },
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
         if (field.display == 'optional' || field.type == "url" || field.name.includes("_download_url") ) return false
         if ( this.isKiosk && field.type == "url") return false
         return true
      },
      fieldValueString(field) {
         if ( Array.isArray(field.value)) {
            return field.value.join(", ")
         }
         return field.value
      },
   }
};
</script>

<style lang="scss" scoped>
.hit {
   width: 100%;
   padding: 10px;
   box-sizing: border-box;
   text-align: left;
   background-color: white;
}
.group-item-wrapper {
   padding: 0;
   margin: 10px 10px 15px 10px;
   border-bottom: 1px solid #ccc;
}
.group-item-wrapper:last-of-type {
    border-bottom: none;
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
