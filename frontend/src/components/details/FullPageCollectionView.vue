<template>
   <div class="full-page-collection-view">
       <div class="working" v-if="loadingDigitalContent">
         <V4Spinner message="Loading digital content..." />
      </div>
      <div v-else class="details-content" v-bind:style="{width: curioWidth }">
         <div class="image-title-bar">
            <span class="image-title">{{details.header.title}}</span>
            <SearchHitActions :hit="details" :pool="details.source" from="COLLECTION" />
         </div>
         <div class="viewer">
            <iframe :src="curioURL" :width="curioWidth"  :height="curioHeight" allowfullscreen frameborder="0"/>
         </div>
      </div>
   </div>
</template>

<script>
import SearchHitActions from '@/components/SearchHitActions'
import { mapState, mapGetters } from "vuex"

export default {
   name: "fullscreen-collection-view",
   components: {
      SearchHitActions
   },
   computed: {
      ...mapState({
         displayWidth: state => state.system.displayWidth,
         loadingDigitalContent : state => state.item.loadingDigitalContent,
         digitalContent : state => state.item.digitalContent,
         details : state => state.item.details,
      }),
      ...mapGetters({
         isDevServer: 'system/isDevServer',
      }),
      curioURL() {
         let selDO = this.digitalContent[0]
         let idx = selDO.oEmbedURL.indexOf("/oembed")
         let url = selDO.oEmbedURL.substring(0, idx)
         url += "/view/" + selDO.pid
         if ( this.isDevServer) {
            url = url.replace("curio", "curio-dev.internal")
         }
         return url
      },
      curioWidth() {
         return `${this.displayWidth*0.95}px`
      },
      curioHeight() {
         return `${this.displayWidth*0.95*0.75}px`
      },
   }
}
</script>

<style lang="scss" scoped>
.full-page-collection-view {
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
      background-image: url('~@/assets/dots.gif');
      background-repeat:no-repeat;
      background-position: center 20%;
      background-color: var(--uvalib-grey-lightest);
   }
}
</style>
