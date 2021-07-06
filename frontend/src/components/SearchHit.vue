<template>
   <div class="inner-hit-wrapper" :class="{group: hit.grouped}">
      <div class="hit" v-bind:data-identifier="hit.identifier">
         <SearchHitHeader :maxLen="60" :count="count" :hit="hit" :pool="pool" from="SEARCH"/>
         <SearchHitDetail :hit="hit" :pool="pool"/>
      </div>
      <AccordionContent v-if="hit.grouped" :id="hit.identifier"
         :autoExpandID="autoExpandGroupID" :expanded="!collapseGroups" :heightOffset="5"
         backgroundContent="none" background="var(--uvalib-blue-alt-light)"
         borderColor="var(--uvalib-blue-alt-light)" class="group">
         <template v-slot:title>{{groupTitle}}</template>
         <div v-for="(groupHit,idx) in hit.group" :key="`g${idx}`"
            class="group-hit" v-bind:data-identifier="groupHit.identifier"
            :class="{last: idx==hit.group.length-1, first: idx==0}"
         >
            <SearchHitHeader :maxLen="60" :count="groupHit.number" :hit="groupHit" :pool="pool" from="SEARCH"/>
            <SearchHitDetail :hit="groupHit" :pool="pool"/>
         </div>
         <template v-slot:footer>{{closeGroupTitle}}</template>
      </AccordionContent>
   </div>
</template>

<script>
import { mapState } from "vuex"
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
      groupTitle() {
         return `Show this group (${this.hit.group.length})`
      },
      closeGroupTitle() {
         return `Collapse this group (${this.hit.group.length})`
      },
      ...mapState({
         autoExpandGroupID: state => state.autoExpandGroupID,
         collapseGroups: state => state.preferences.collapseGroups,
      })
   }
};
</script>

<style lang="scss" scoped>
.inner-hit-wrapper {
   padding: 3px;
   border: 2px solid var(--uvalib-blue-alt-dark);

   .hit {
      width: 100%;
      padding: 10px;
      box-sizing: border-box;
      text-align: left;
      background-color: white;
      box-shadow: none;
   }

   .group-hit {
      padding: 10px;
      margin: 5px 0px 5px 0px;
      background-color: white;
   }
}
.group {
   margin-top: 5px;
}
</style>

