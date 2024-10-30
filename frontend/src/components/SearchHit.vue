<template>
   <div class="inner-hit-wrapper" :class="{group: props.hit.grouped}">
      <div class="hit" :id="props.hit.identifier">
         <SearchHitHeader :count="props.count" :hit="props.hit" :pool="props.pool" from="SEARCH"/>
         <ContentAdvisory v-if="hasContentAdvisory" mode="brief"/>
         <SearchHitDetail :hit="props.hit" :pool="props.pool"/>
      </div>
      <AccordionContent v-if="props.hit.grouped" :id="`group-${props.hit.identifier}`"
         :autoExpandID="results.autoExpandGroupID" :expanded="!preferences.collapseGroups"
         backgroundContent="none" :background=colors.blueAlt300
         :borderColor=colors.blueAlt300 class="group">
         <template v-slot:title>{{groupTitle}}</template>
         <div v-for="(groupHit,idx) in props.hit.group" :key="`g${idx}`"
            class="group-hit" :id="groupHit.identifier"
            :class="{last: idx==props.hit.group.length-1, first: idx==0}"
         >
            <SearchHitHeader :count="groupHit.number" :hit="groupHit" :pool="pool" from="SEARCH"/>
            <ContentAdvisory v-if="hasContentAdvisory" mode="brief"/>
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
import ContentAdvisory from "@/components/ContentAdvisory.vue"
import { useResultStore } from "@/stores/result"
import { usePreferencesStore } from "@/stores/preferences"
import colors from '@/assets/theme/colors.module.scss'

const results = useResultStore()
const preferences = usePreferencesStore()

const props = defineProps({
   hit: { type: Object, required: true},
   pool: {type: String, required: true},
   count: {type: Number, required: true}
})

const hasContentAdvisory = computed(() => {
   let idx = props.hit.fields.findIndex( f=> f.name=="content_advisory")
   return idx > -1
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
   border: 2px solid $uva-blue-alt-A;

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
      display: flex;
      flex-direction: column;
      gap: 5px;
      align-items: flex-start;
      justify-content: stretch;
   }
}
</style>

