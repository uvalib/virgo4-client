<template>
   <div class="header-wrapper">
      <div class="title-wrapper">
         <div class="full-title">
            <span class="count-wrap" v-if="props.count">
               <span class="count">{{props.count}}</span>
            </span>
            <template v-if="props.link == false">
               <span class="hit-title" v-html="props.hit.header.title"></span>
               <span v-if="props.hit.header.subtitle" class="hit-subtitle" v-html="props.hit.header.subtitle"></span>
            </template>
            <router-link @mousedown="detailClicked" v-else :to="detailsURL">
               <span class="hit-title" v-html="props.hit.header.title"></span>
               <span v-if="props.hit.header.subtitle" class="hit-subtitle" v-html="props.hit.header.subtitle"></span>
            </router-link>
         </div>
         <SearchHitActions :hit="props.hit" :pool="props.pool" :from="props.from" />
      </div>
      <div v-if="props.hit.header.author_display" class="author-wrapper">
         <span v-if="props.expand" :id="`${props.hit.identifier}-author`" v-html="props.hit.header.author_display"></span>
         <TruncatedText v-else :id="`${props.hit.identifier}-author`"
            :text="props.hit.header.author_display" :limit="authorTruncateLength" />
      </div>
   </div>
</template>

<script setup>
import TruncatedText from "@/components/TruncatedText.vue"
import SearchHitActions from "@/components/SearchHitActions.vue"
import { computed } from 'vue'
import analytics from '@/analytics'
import { useResultStore } from "@/stores/result"

const props = defineProps({
   hit: {
      type: Object,
      required: true
   },
   pool: {
      type: String,
      required: true
   },
   link: {
      type: Boolean,
      default: true
   },
   count: {
      type: Number,
      default: 0
   },
   from: {
      type: String,
      default: ""
   },
   expand: {
      type: Boolean,
      default: false
   }
})

const resultStore = useResultStore()

const detailsURL = computed(()=>{
      return `/sources/${props.pool}/items/${props.hit.identifier}`
   })
const authorTruncateLength = computed(()=>{
   return 150
})

const detailClicked = (() => {
   resultStore.hitSelected(props.hit.identifier)
   analytics.trigger('Results', 'DETAILS_CLICKED', props.hit.identifier)
})
</script>

<style lang="scss" scoped>

.title-wrapper {
   text-align: left;
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
   .hit-title {
      font-weight: bold;
      display: inline-block;
      margin-right: 5px;
      &:hover {
         text-decoration: underline;
      }
   }
   .hit-subtitle {
      display: inline-block;
      font-weight: normal;
   }
   .full-title {
      font-size: 1.25em;
      display:flex;
      flex-flow: row nowrap;
      align-items: flex-start;
      justify-content: flex-start;
   }

   .count-wrap {
      display: flex;
      flex-flow: row nowrap;
      margin-top: 2px;
      margin-right: 5px;
      align-items: baseline;

      .count {
         display: inline-block;
         font-size: 0.7em;
         color: var( --uvalib-grey );
      }
   }
   .icon-wrap {
      display: flex;
      flex-flow: row nowrap;
      margin-left: auto;
      align-content: center;
      i.share {
         color: #444;
         cursor: pointer;
         font-size: 1.4em;
         display: inline-block;
         box-sizing: border-box;
         margin-right: 5px;
         padding:0;
         &:hover {
            color:var(--uvalib-brand-blue-light);
         }
      }
   }
   .citation-control {
      padding: 5px;
   }
   .bm-control {
      padding: 5px;
   }
}

.author-wrapper {
   text-align: left;
   padding-left: 40px;
   padding-top: 5px;
   padding-bottom: 10px;
}
</style>
