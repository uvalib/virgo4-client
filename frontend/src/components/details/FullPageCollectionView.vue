<template>
   <div class="full-page-collection-view">
       <div class="working" v-if="item.loadingDigitalContent">
         <V4Spinner message="Loading digital content..." />
      </div>
      <div v-else class="details-content" v-bind:style="{width: curioWidth }">
         <div class="image-title-bar">
            <span class="image-title">
               <span>{{item.details.header.title}}</span>
               <div class="position-info" v-if="item.collectionPosition">{{item.collectionPosition}}</div>
            </span>
            <SearchHitActions :hit="item.details" :pool="item.details.source" from="COLLECTION" />
         </div>
         <div class="viewer">
            <iframe :src="curioURL" :width="curioWidth"  :height="curioHeight" allowfullscreen frameborder="0"/>
         </div>
      </div>
   </div>
</template>

<script setup>
import SearchHitActions from "@/components/SearchHitActions.vue"
import { useSystemStore } from "@/stores/system"
import { useItemStore } from "@/stores/item"
import { computed } from 'vue'

const item = useItemStore()
const system = useSystemStore()

const curioURL = computed(()=>{
   let selDO = item.digitalContent[0]
   let idx = selDO.oEmbedURL.indexOf("/oembed")
   let url = selDO.oEmbedURL.substring(0, idx)
   url += "/view/" + selDO.pid
   if ( system.isDevServer) {
      url = url.replace("curio", "curio-dev.internal")
   }
   return url
})
const curioWidth = computed(()=>{
   return `${system.displayWidth*0.95}px`
})
const curioHeight = computed(()=>{
   return `${system.displayWidth*0.95*0.75}px`
})
</script>

<style lang="scss" scoped>
.full-page-collection-view {
   .position-info {
      font-weight: normal;
      margin-top: 5px;
   }
   .details-content {
      margin: 25px auto;
   }
   .image-title-bar {
      text-align: left;
      display:flex;
      flex-flow: row wrap;
      justify-content: space-between;
      align-items: center;
      .image-title {
         font-weight: bold;
      }
   }
   .viewer iframe {
      margin-top:10px;
      background-image: url('@/assets/dots.gif');
      background-repeat:no-repeat;
      background-position: center 20%;
      background-color: var(--uvalib-grey-lightest);
   }
}
</style>
