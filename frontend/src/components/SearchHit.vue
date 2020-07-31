<template>
   <div class="inner-hit-wrapper">
      <div class="hit" v-bind:data-identifier="hit.identifier">
         <SearchHitHeader :maxLen="60" :count="count" :hit="hit" :pool="pool"/>
         <SearchHitDetail :hit="hit" :pool="pool"/>
      </div>
      <AccordionContent v-if="hit.grouped" :id="hit.identifier" 
         :autoExpandID="autoExpandGroupID" :expanded="!collapseGroups" :heightOffset="20"
         backgroundContent="none" background="var(--uvalib-teal-lightest)"
         borderColor="var(--uvalib-teal-light)" class="group">
         <template v-slot:title>{{groupTitle}}</template>
         <template v-if="!collapseGroups" v-slot:collapse>{{closeGroupTitle}}</template>
         <template v-for="(groupHit,idx) in hit.group">
            <div class="group-hit" v-bind:data-identifier="groupHit.identifier" 
               :class="{last: idx==hit.group.length-1, first: idx==0}" :key="`g${idx}`">
               <SearchHitHeader :maxLen="60" :count="count" :subcount="idx+1" :hit="groupHit" :pool="pool"/>
               <SearchHitDetail :hit="groupHit" :pool="pool"/>
            </div> 
         </template>
         <template v-if="collapseGroups" v-slot:footer>{{closeGroupTitle}}</template>
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
         return `Show More (${this.hit.group.length})`
      },
      closeGroupTitle() {
         return `Show Fewer (${this.hit.group.length})`
      },
      ...mapState({
         searching: state => state.searching,
         autoExpandGroupID: state => state.autoExpandGroupID,
         collapseGroups: state => state.preferences.collapseGroups,
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
   box-shadow:  $v4-box-shadow-light;
}
.group-hit {
   padding: 10px;
   margin: 10px 0px 20px 0px;
   box-shadow:  $v4-box-shadow-light;
   background-color: white;
}
.group-hit.first {
   margin-top: 20px;
}
</style>

