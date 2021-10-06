<template>
   <div class="details">
      <div class="working" v-if="details.searching || loadingDigitalContent || searching" >
         <V4Spinner message="Looking up details..."/>
      </div>
      <template v-else>
         <CollectionHeader v-if="isCollection && isDevServer"/>
         <FullPageCollectionView v-if="isFullPage && isCollection && isDevServer && viewMode=='reader'" />
         <ItemView v-else />
      </template>
   </div>
</template>

<script>
import { mapGetters, mapState } from "vuex"
import ItemView from "@/components/details/ItemView"
import CollectionHeader from "@/components/details/CollectionHeader"
import FullPageCollectionView from "@/components/details/FullPageCollectionView"

export default {
   name: "detail",
   async beforeRouteUpdate(to, _from) {
      // this is needed to load details when a grouped image thumb has been clicked; new content
      // needs to be loaded, but the page remains the same (create not called)
      this.getDetails(to.params.src, to.params.id, to.query.mode)
   },
   components: {
      ItemView, CollectionHeader, FullPageCollectionView
   },
   computed: {
      ...mapState({
         details : state => state.item.details,
         citationsURL: state => state.system.citationsURL,
         poolMapping: state=>state.system.poolMapping,
         loadingDigitalContent : state => state.item.loadingDigitalContent,
         searching: state=>state.searching,
         viewMode: state=>state.collection.viewMode
      }),
      ...mapGetters({
         isDevServer: 'system/isDevServer',
         isDigitalCollection: 'item/isDigitalCollection',
         digitalCollectionName: 'item/digitalCollectionName',
         isCollection: 'item/isCollection',
         collectionName: 'item/collectionName',
         isFullPage: 'collection/isFullPage',
         hasCalendar: 'collection/hasCalendar',
      }),
   },
   methods: {
      async getDetails(src, id, mode) {
         // if this was called from an old catalog/id url, the src will get
         // set to legacy. in this case, lookup the cat key and redirect to full detail
         // the redirect will trigger a beforeRouteUpdate and that will get fill item detail.
         if ( src == "legacy" ) {
            await this.$store.dispatch("item/lookupCatalogKeyDetail", id )
            return
         }

         this.mode = mode
         let mapping = this.poolMapping[src]
         if (mapping && mapping.pool != src) {
            src = mapping.pool
            let fixed = `/sources/${src}/items/${id}`
            await this.$router.replace( fixed )
            return
         }

         let bmTarget = this.$store.getters['restore/bookmarkTarget']
         if (bmTarget.origin == "SHELF_BROWSE"  ) {
            this.browseTarget = bmTarget.id
         }

         await this.$store.dispatch("item/getDetails", {source:src, identifier:id})

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
            this.$analytics.trigger('Results', 'DIGITAL_COLLECTION_ITEM_VIEWED', this.digitalCollectionName )
         }
         if (this.isCollection) {
            this.$analytics.trigger('Results', 'COLLECTION_ITEM_VIEWED', this.collectionName )
         }

         if ( this.isDevServer && this.isCollection) {
            let name = this.collectionName
            if (!name) {
               name = this.digitalCollectionName
            }
            await this.$store.dispatch("collection/getCollectionContext", name )
            if ( this.hasCalendar) {
               let dateField = this.details.detailFields.find( f => f.name == "published_date")
               if (dateField) {
                  let year = dateField.value.split("-")[0]
                  this.$store.commit("collection/setCurrentYear", year)
                  this.$store.dispatch("collection/getPublishedDates", year)
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
      this.getDetails(this.$route.params.src, this.$route.params.id, this.$route.query.mode)
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
