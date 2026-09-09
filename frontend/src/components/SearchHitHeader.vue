<template>
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
      <div class="icon-wrap">
         <Citations :itemURL="props.hit.itemURL" />
         <BookmarkButton :pool="props.pool" :data="props.hit" />
      </div>
   </div>
   <div v-if="props.hit.header.author_display" class="author-wrapper">
      <span v-if="props.expand" :id="`${props.hit.identifier}-author`" v-html="props.hit.header.author_display"></span>
      <TruncatedText v-else :id="`${props.hit.identifier}-author`"
         :text="props.hit.header.author_display" :limit="authorTruncateLength" />
   </div>
</template>

<script setup>
import TruncatedText from "@/components/TruncatedText.vue"
import BookmarkButton from "@/components/BookmarkButton.vue"
import Citations from "@/components/modals/Citations.vue"
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
   width: 100%;
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

   .icon-wrap {
      display: flex;
      flex-flow: row nowrap;
      margin-left: auto;
      justify-content: flex-end;
      align-items: center;
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
         color: $uva-grey;
      }
   }
}

.author-wrapper {
   text-align: left;
   padding:0 0 0 40px;
}
</style>
