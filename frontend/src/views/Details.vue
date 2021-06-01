<template>
   <div class="details">
      <div class="working" v-if="details.searching || loadingDigitalContent" >
         <V4Spinner message="Looking up details..."/>
      </div>
      <template v-else>
         <FullPageCollectionView v-if="isDigitalCollection && isFullPage && hasDigitalContent" />
         <ItemView v-else />
      </template>
   </div>
</template>

<script>
import { mapGetters, mapState } from "vuex"
import ItemView from "@/components/details/ItemView"
import FullPageCollectionView from "@/components/details/FullPageCollectionView"

export default {
   name: "detail",
   watch: {
      $route() {
         // this is needed to load details when a grouped image thumb has been clicked; new content
         // needs to be loaded, but the page remains the same (create not called)
         this.getDetails()
      }
   },
   components: {
      ItemView, FullPageCollectionView
   },
   computed: {
      ...mapState({
         details : state => state.item.details,
         citationsURL: state => state.system.citationsURL,
         poolMapping: state=>state.system.poolMapping,
         loadingDigitalContent : state => state.item.loadingDigitalContent,
      }),
      ...mapGetters({
         isDevServer: 'system/isDevServer',
         isDigitalCollection: 'item/isDigitalCollection',
         collectionName: 'item/collectionName',
         hasCollectionContext : 'collection/isAvailable',
         isFullPage: 'collection/isFullPage',
         hasDigitalContent: 'item/hasDigitalContent',
      }),
   },
   methods: {
      async getDetails() {
         this.mode = this.$route.query.mode
         let src = this.$route.params.src
         let id = this.$route.params.id
         if ( src ) {
            let mapping = this.poolMapping[src]
            if (mapping && mapping.pool != src) {
               src = mapping.pool
               let fixed = `/sources/${src}/items/${id}`
               this.$router.replace( fixed )
               return
            }
         }

         let bmTarget = this.$store.getters['restore/bookmarkTarget']
         if (bmTarget.origin == "SHELF_BROWSE"  ) {
            this.browseTarget = bmTarget.id
         }

         if (src) {
            this.$store.commit("hitSelected", id)
            await this.$store.dispatch("item/getDetails", {source:src, identifier:id})
         } else {
            await this.$store.dispatch("item/lookupCatalogKeyDetail", id )
         }

         if ( bmTarget.origin == "DETAIL" || bmTarget.origin == "COLLECTION" ) {
            let bmEle = document.getElementById(`bm-modal-${bmTarget.id}-btn`)
            if (bmEle) {
               bmEle.focus()
               bmEle.click()
            }
         }

         if (this.details && this.details.header) {
            document.title = this.details.header.title
         }

         this.$analytics.trigger('Results', 'ITEM_DETAIL_VIEWED', id)

         if (this.isDigitalCollection) {
            this.$analytics.trigger('Results', 'COLLECTION_ITEM_VIEWED', this.collectionName )
            if ( this.isDevServer ) {
               let dateField = this.details.detailFields.find( f => f.name == "published_date")
               if (dateField) {
                  this.$store.dispatch("collection/getCollectionContext",
                     {collection: this.collectionName, date: dateField.value} )
               } else {
                  log.error("Collection with no publication date. Skipping.")
               }
            }
         }
      },
      zoteroItemUpdated() {
         // add unapi URL to document header for Zotero, if not already present
         let unapiID = 'unapi'
         if (!document.getElementById(unapiID)) {
            let unapiURL = this.citationsURL + '/unapi'
            var link = document.createElement('link')
            link.id = unapiID
            link.rel = 'unapi-server'
            link.type = 'application/xml'
            link.title = 'unAPI'
            link.href = unapiURL
            document.head.appendChild(link)
         }

         // notify zotero connector of an item change
         document.dispatchEvent(new Event('ZoteroItemUpdated', {
            bubbles: true,
            cancelable: true
         }))
      },
   },
   created() {
      this.getDetails()
   },
   updated() {
      this.zoteroItemUpdated()
   }
}
</script>
<style lang="scss" scoped>
.details {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   margin-bottom: 10vh;
   color: var(--color-primary-text);
   .working {
      text-align: center;
      font-size: 0.9em;
   }
   .working img {
      margin: 30px 0;
   }
}
</style>
