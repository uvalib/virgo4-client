<template>
   <div class="inner-hit-wrapper" :class="{group: props.hit.grouped}">
      <div class="hit" v-bind:data-identifier="props.hit.identifier">
         <SearchHitHeader :maxLen="60" :count="props.count" :hit="props.hit" :pool="props.pool" from="SEARCH"/>
         <SearchHitDetail :hit="props.hit" :pool="props.pool"/>
      </div>
      <AccordionContent v-if="props.hit.grouped" :id="props.hit.identifier"
         :autoExpandID="results.autoExpandGroupID" :expanded="!preferences.collapseGroups" :heightOffset="5"
         backgroundContent="none" background="var(--uvalib-blue-alt-light)"
         borderColor="var(--uvalib-blue-alt-light)" class="group">
         <template v-slot:title>{{groupTitle}}</template>
         <div v-for="(groupHit,idx) in props.hit.group" :key="`g${idx}`"
            class="group-hit" v-bind:data-identifier="groupHit.identifier"
            :class="{last: idx==props.hit.group.length-1, first: idx==0}"
         >
            <SearchHitHeader :maxLen="60" :count="groupHit.number" :hit="groupHit" :pool="pool" from="SEARCH"/>
            <SearchHitDetail :hit="groupHit" :pool="pool"/>
         </div>
         <template v-slot:footer>{{closeGroupTitle}}</template>
      </AccordionContent>
   </div>
</template>

<script setup>
import { computed } from 'vue'
import SearchHitHeader from "@/components/SearchHitHeader.vue"
import SearchHitDetail from "@/components/SearchHitDetail.vue"
import AccordionContent from "@/components/AccordionContent.vue"
import { useResultStore } from "@/stores/result"
import { usePreferencesStore } from "@/stores/preferences"

const results = useResultStore()
const preferences = usePreferencesStore()

const props = defineProps({
   hit: { type: Object, required: true},
   pool: {type: String, required: true},
   count: {type: Number, required: true}
})

const groupTitle = computed(()=>{
   return `Show this group (${props.hit.group.length})`
})
const closeGroupTitle = computed(()=>{
   return `Collapse this group (${props.hit.group.length})`
})
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

