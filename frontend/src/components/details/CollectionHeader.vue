<template>
   <section class="collection-header" :class="{noborder: !props.border}">
      <div class="collection-search" v-if="collection.canSearch">
         <input autocomplete="off" type="text" id="search"
            @keyup.enter="searchClicked"
            v-model="queryStore.basic"
            placeholder="Search this collection"
         >
         <VirgoButton class="search" @click="searchClicked" label="Search"/>
         <VirgoButton class="browse" @click="browseClicked" label="Browse All" />
      </div>

      <div class="text-info">
         <div class="image" v-if="collection.image" >
            <img class="thumb" :class="{bookplate: collection.isBookplate}" :src="collection.image.url" :alt="collection.image.alt_text"/>
         </div>
         <div class="content">
            <div class="title-row">{{collection.title}}</div>
            <div class="desc-row" v-html="collection.description"></div>
         </div>
      </div>

      <div class="cal" v-if="collection.canNavigate && !item.isCollectionHead">
         <CollectionDates v-if="collection.hasCalendar" id="coll-dates" :date="publishedDate" @picked="datePicked" />
      </div>

      <div class="seq-nav" v-if="collection.canNavigate && !item.isCollectionHead">
         <VirgoButton @click="prevItem()" :aria-label="`previous ${collection.itemLabel}`"
            icon="fal fa-arrow-left" :label="`Previous ${collection.itemLabel}`" />
         <VirgoButton @click="nextItem()"  :aria-label="`next ${collection.itemLabel}`"
            :label="`Next ${collection.itemLabel}`" icon="fal fa-arrow-right" iconPos="right" />
      </div>
   </section>
</template>

<script setup>
import CollectionDates from "@/components/modals/CollectionDates.vue"
import { computed } from 'vue'
import { useCollectionStore } from "@/stores/collection"
import { useFilterStore } from "@/stores/filter"
import { useItemStore } from "@/stores/item"
import { useQueryStore } from "@/stores/query"
import { useRoute, useRouter } from 'vue-router'

const collection = useCollectionStore ()
const filter = useFilterStore()
const item = useItemStore()
const queryStore = useQueryStore()
const route = useRoute()
const router = useRouter()

const props = defineProps({
   mode: {
      border: Boolean,
      default: true,
   },
})

const publishedDate = computed(()=>{
   let field = item.details.fields.find( f => f.name == "published_date")
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
function nextItem() {
   let date = publishedDate.value
   if (date) {
      collection.nextItem(date)
   }
}
function prevItem() {
   let date = publishedDate.value
   if (date) {
      collection.priorItem(date)
   }
}
</script>
<style lang="scss" scoped>
.collection-header.noborder {
   border-top: none;
   border-bottom: none;
   margin: 0 auto;
   width: 95%;
}
.collection-header {
   background-color: white;
   border-top: 1px solid var(--uvalib-grey-light);
   border-bottom: 1px solid var(--uvalib-grey-light);
   margin-bottom: 15px;

   .text-info {
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      padding: 5px 20px;
   }

   .image {
      .thumb {
         display: block;
         max-height:200px;
         margin-top: 25px;
      }
      .thumb.bookplate {
         max-width: 100%;
         height: auto;
         min-width: 150;
         max-width: 190px;
         max-height: none;
         box-shadow: var(--uvalib-box-shadow);
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
   .collection-search {
      display: flex;
      flex-flow: row wrap;
      align-items: stretch;
      justify-content: stretch;
      margin: 0 10px 0 auto;
      gap: 5px;
      input[type=text] {
         flex: 1 1 auto;
         min-width: 100px;
      }
   }

   .cal {
      text-align: right;
      margin: 0 10px 5px 0;
   }
   .seq-nav {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-end;
      margin: 5px 10px 10px 0;
      gap: 5px;
   }
}

@media only screen and (min-width: 768px) {
   .collection-search {
       width: 40%;
   }
}
@media only screen and (max-width: 935px) {
    .collection-search {
       width: 75%;
   }
}
@media only screen and (max-width: 768px) {
    .collection-search {
       width: 95%;
   }
}
</style>
