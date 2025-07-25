<template>
      <div class="working" v-if="item.loadingDigitalContent">
      <V4Spinner message="Loading digital content..." />
   </div>
   <div v-else class="details-content" v-bind:style="{width: curioWidth }">
      <h1>{{ item.details.header.title }}</h1>
      <ActionsPanel />

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
         <iframe :src="curioURL" :width="curioWidth"  :height="curioHeight" allowfullscreen frameborder="0" :title="`viewer for ${item.details.header.title}`"/>
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
import { computed, onMounted, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWindowSize } from '@vueuse/core'

const { width } = useWindowSize()
const route = useRoute()
const router = useRouter()
const collection = useCollectionStore ()
const item = useItemStore()
const system = useSystemStore()

const curioWidth = ref()
const curioHeight = ref()

watch( width, () => {
   setCurioDimensions()
})

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
   if (selDO) {
      let idx = selDO.oEmbedURL.indexOf("/oembed")
      url = selDO.oEmbedURL.substring(0, idx)
      url += "/view/" + selDO.pid

      // grab the current URL and split of the details page fragment to be left with the transport and host.
      // this is needed for curio to trigger events back to V4
      let currURL = window.location.href
      let domain = currURL.split("/sources")[0]

      if ( system.isDevServer) {
         url = url.replace("curio", "curio-dev.internal")
      }

      url += "?domain="+domain

      let x = route.query.x
      if (x) {
         url += `&x=${x}`
      }
      let y = route.query.y
      if (y) {
         url += `&y=${y}`
      }
      let zoom = route.query.zoom
      if (zoom) {
         url += `&zoom=${zoom}`
      }
      let rotation = route.query.rotation
      if (rotation) {
         url += `&rotation=${rotation}`
      }
      let page = route.query.page
      if (page) {
         url += `&page=${page}`
      }
   }
   return url
})

const setCurioDimensions = (() => {
   let mainPanelW = document.getElementById("v4main").offsetWidth
   let w = mainPanelW * 0.95
   curioWidth.value = `${w}px`
   curioHeight.value = `${w*0.75}px`
})

onMounted(()=>{
   setCurioDimensions()
   window.onmessage = (e) => {
      if ( e.data.name == "curio") {
         // convert the curio params object into a query string and use replaceState to update the URL in place
         // do not use the router as this forces page reloads
         let qp = []
         let curio = e.data
         if ( curio.x) {
            qp.push(`x=${curio.x}`)
         }
         if ( curio.y) {
            qp.push(`y=${curio.y}`)
         }
         if ( curio.zoom) {
            qp.push(`zoom=${curio.zoom}`)
         }
         if ( curio.rotation) {
            qp.push(`rotation=${curio.rotation}`)
         }
         if ( curio.page) {
            qp.push(`page=${curio.page}`)
         }
         history.replaceState(history.state, '', "?"+qp.join("&"))
      }
   }
})
</script>

<style lang="scss" scoped>
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
      border: 1px solid $uva-grey-100;
      background-image: url('@/assets/spinner2.gif');
      background-repeat:no-repeat;
      background-position: center 25%;
      border-radius: 0.3rem;
   }
}
</style>
