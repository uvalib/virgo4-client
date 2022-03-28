<template>
   <section class="collection-header">
      <div class="image" v-if="collection.image" >
         <img class="thumb" :class="{bookplate: collection.isBookplate}" :src="collection.image.url" :alt="collection.image.alt_text"/>
         <a class="viewer" :href="collection.image.url" target="_blank" v-if="collection.isBookplate">
            View full size<i class="fal fa-external-link-alt" style="margin-left: 5px;"></i>
         </a>
      </div>

      <div class="content">
         <div class="title-row">{{collection.title}}</div>
         <div class="desc-row" v-html="collection.description"></div>
      </div>

      <div class="actions">
         <span class="seq-nav" v-if="collection.canNavigate && !item.isCollectionHead">
            <V4Button class="pager prev" mode="primary" @click="prevItem()" :aria-label="`previous ${collection.itemLabel}`">
               <i class="prior fal fa-arrow-left"></i>Previous {{collection.itemLabel}}
            </V4Button>
            <CollectionDates v-if="collection.hasCalendar" id="coll-dates" :date="publishedDate" @picked="datePicked" />
            <V4Button class="pager" mode="primary" @click="nextItem()"  :aria-label="`next ${collection.itemLabel}`">
               Next {{collection.itemLabel}}<i class="next fal fa-arrow-right"></i>
            </V4Button>
         </span>

         <div class="collection-search" v-if="collection.canSearch">
            <input autocomplete="off" type="text" id="search"
               @keyup.enter="searchClicked"
               v-model="queryStore.basic"
               placeholder="Search this collection"
            >
            <V4Button class="search" mode="primary" @click="searchClicked">Search</V4Button>
            <V4Button class="browse" mode="primary" @click="browseClicked">Browse All</V4Button>
         </div>

         <V4Button v-if="resultStore.lastSearchURL" mode="text" @click="returnToSearch" class="back">Return to search results</V4Button>
      </div>
   </section>
</template>

<script setup>
import CollectionDates from "@/components/modals/CollectionDates.vue"
import { computed } from 'vue'
import { useCollectionStore } from "@/stores/collection"
import { useFilterStore } from "@/stores/filter"
import { useItemStore } from "@/stores/item"
import { useResultStore } from "@/stores/result"
import { useQueryStore } from "@/stores/query"
import { useRoute, useRouter } from 'vue-router'

const collection = useCollectionStore ()
const filter = useFilterStore()
const item = useItemStore()
const resultStore = useResultStore()
const queryStore = useQueryStore()
const route = useRoute()
const router = useRouter()

const publishedDate = computed(()=>{
   let field = item.details.detailFields.find( f => f.name == "published_date")
   if (field) {
      return field.value
   }
   return ""
})

function datePicked(pid) {
   router.push(pid)
}
function browseClicked() {
   // Set up the search in the store and flag it is user generated
   filter.reset()
   filter.toggleFilter("presearch", collection.filter, collection.title)
   queryStore.setTargetPool(item.details.source)
   queryStore.userSearched = true

   // use the model to setup the URL
   let query = Object.assign({}, route.query)
   delete query.page
   delete query.filter
   delete query.q
   query.filter = filter.asQueryParam( "presearch" )
   query.pool = item.details.source
   router.push({path: "/search", query: query })
}
function searchClicked() {
   // Set up the search in the store and flag it is user generated
   filter.reset()
   filter.toggleFilter("presearch", collection.filter, collection.title)
   queryStore.setTargetPool(item.details.source)
   queryStore.userSearched = true

   // use the model to setup the URL
   let query = Object.assign({}, route.query)
   delete query.page
   delete query.filter
   query.q = queryStore.string
   query.filter = filter.asQueryParam( "presearch" )
   query.pool = item.details.source
   router.push({path: "/search", query: query })
}
function returnToSearch() {
   router.push( resultStore.lastSearchURL )
}
function nextItem() {
   let date = this.publishedDate
   if (date) {
      collection.nextItem(date)
   }
}
function prevItem() {
   let date = this.publishedDate
   if (date) {
      collection.priorItem(date)
   }
}
</script>
<style lang="scss" scoped>
.collection-header {
   background-color: white;
   padding: 15px 20px;
   display: flex;
   flex-flow: row wrap;
   justify-content: center;
   border-top: 1px solid var(--uvalib-grey-light);
   border-bottom: 1px solid var(--uvalib-grey-light);
   margin-bottom: 15px;

   .image {
      .thumb {
         display: block;
         max-height:200px;
      }
      .thumb.bookplate {
         box-shadow: $v4-box-shadow-light;
      }
   }
   .content {
      display: inline-block;
      flex: 1;
      text-align: left;
      padding: 10px 0px 10px 20px;

      .title-row  {
         margin: 10px 0;
         font-weight: bold;
         color: var(--uvalib-text);
         font-size: 1.25em;
      }

      .desc-row {
         text-align: left;
         padding: 20px 0 0 0px;
         display: inline-block;
         min-width: 300px;
         margin-bottom: 15px;
         margin-right: 20px;
      }
   }

   .actions {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-end;

      .back {
         margin-top: 5px;
      }

      label {
         font-weight: bold;
         margin-right: 10px;
      }
   }

   .collection-search {
      display: flex;
      flex-flow: row wrap;
      align-items: stretch;
      justify-content: flex-start;
      margin: 0 0 10px 0;
      font-size: 0.9em;
      min-width: 300px;
      width: 100%;

      input[type=text] {
         font-size: 1.15em;
         padding: 0.5vw 0.75vw;
         border: 1px solid var(--uvalib-grey);
         border-right: 0;
         margin: 0 !important;
         border-radius: 5px 0 0 5px;
         flex: 1 1 auto;
         min-width: 100px;

      }

      .search, .browse {
         border-radius: 0 5px 5px 0;
         margin: 0;
         padding: 0 20px;
      }
      .search {
         margin-right: 5px;
      }

      .browse {
         border-radius: 5px;
         padding: 4px 20px;
      }
   }

   .seq-nav {
      display: flex;
      flex-flow: row nowrap;
      margin: 0 0 10px 0;
      justify-content: flex-end;
      .v4-button.pager {
         margin: 0 0 0 5px;
         i.next {
            margin: 0 0 0 5px;
         }
         i.prior {
            margin: 0 5px 0 0;
         }
      }
      .v4-button.pager.prev {
         margin: 0 5px 0 0;
      }
   }
}
.viewer {
   margin-top: 10px;
   display: inline-block;
}
</style>
