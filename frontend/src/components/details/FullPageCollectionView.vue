<template>
      <div class="working" v-if="item.loadingDigitalContent">
      <V4Spinner message="Loading digital content..." />
   </div>
   <div v-else class="details-content" v-bind:style="{width: curioWidth }">
      <div class="title">{{ item.details.header.title }}</div>
      <ActionsPanel :hit="item.details" :pool="item.details.source" from="COLLECTION" />

      <h2>View online</h2>
      <div class="issue-info">{{item.details.header.title}}</div>
      <div class="position-info" v-if="item.collectionPosition">{{item.collectionPosition}}</div>
      <div class="collection-nav" v-if="collection.canNavigate && !item.isCollectionHead">
         <VirgoButton @click="prevItem()" :aria-label="`previous ${collection.itemLabel}`"
            icon="fal fa-arrow-left" :label="`Previous ${collection.itemLabel}`" severity="info"/>
         <VirgoButton @click="nextItem()"  :aria-label="`next ${collection.itemLabel}`"
            :label="`Next ${collection.itemLabel}`" icon="fal fa-arrow-right" iconPos="right" severity="info"/>
         <CollectionDates v-if="collection.hasCalendar" id="coll-dates" :date="publishedDate" @picked="datePicked" />
      </div>

      <div class="viewer">
         <iframe :src="curioURL" :width="curioWidth"  :height="curioHeight" allowfullscreen frameborder="0"/>
      </div>
      <h2>Digital Collection</h2>
      <CollectionPanel />
   </div>
</template>

<script setup>
import ActionsPanel from "@/components/details/ActionsPanel.vue"
import CollectionPanel from "@/components/details/CollectionPanel.vue"
import CollectionDates from "@/components/modals/CollectionDates.vue"
import { useCollectionStore } from "@/stores/collection"
import { useSystemStore } from "@/stores/system"
import { useItemStore } from "@/stores/item"
import { computed } from 'vue'

const collection = useCollectionStore ()
const item = useItemStore()
const system = useSystemStore()

const publishedDate = computed(()=>{
   let field = item.details.fields.find( f => f.name == "published_date")
   if (field) {
      return field.value
   }
   return ""
})

const datePicked = ((pid) => {
   router.push(pid)
})
const nextItem = (() => {
   let date = publishedDate.value
   if (date) {
      collection.nextItem(date)
   }
})

const prevItem = (() => {
   let date = publishedDate.value
   if (date) {
      collection.priorItem(date)
   }
})

const curioURL = computed(()=>{
   let url = ""
   let selDO = item.digitalContent[0]
   if(selDO) {
      let idx = selDO.oEmbedURL.indexOf("/oembed")
      url = selDO.oEmbedURL.substring(0, idx)
      url += "/view/" + selDO.pid
      if ( system.isDevServer) {
         url = url.replace("curio", "curio-dev.internal")
      }
   }
   return url
})

const curioWidth = computed(()=>{
   let mainPanelW = document.getElementById("v4main").offsetWidth
   return `${mainPanelW*0.95}px`
})

const curioHeight = computed(()=>{
   let viewerW = parseInt(curioWidth.value,10)
   return `${viewerW*0.75}px`
})
</script>

<style lang="scss" scoped>
div.title {
   font-size: 1.5rem;
   font-weight: 700;
}
.issue-info {
   font-weight: bold;
   margin: 10px 0;
}
.position-info {
   margin: 10px 0;
}
.collection-nav {
   display: flex;
   flex-flow: row wrap;
   justify-content: flex-start;
   align-items: center;
   gap: 25px;
}
.viewer {
   margin-top:35px;
   iframe {
      border: 1px solid var(--uvalib-grey-light);
      background-image: url('@/assets/spinner2.gif');
      background-repeat:no-repeat;
      background-position: center 25%;
      border-radius: 5px;
   }
}
</style>
