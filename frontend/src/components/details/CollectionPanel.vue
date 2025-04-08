<template>
   <section class="collection-panel">
      <div class="collection-header">
         <div class="image" v-if="collection.image" >
            <img class="thumb" :class="{bookplate: collection.isBookplate}" :src="collection.image.url" :alt="collection.image.alt_text"/>
         </div>
         <div class="collection-right-panel">
            <div class="content">
               <div class="title-row">{{collection.title}}</div>
               <div class="desc-row" v-html="collection.description"></div>
            </div>
            <div class="collection-search" v-if="collection.canSearch">
               <div class="search-box">
                  <input autocomplete="off" type="text" id="search"
                     @keyup.enter="searchClicked"
                     v-model="queryStore.basic"
                     placeholder="Search this collection"
                  >
                  <VirgoButton icon="fal fa-search" @click="searchClicked" />
               </div>
               <VirgoButton class="browse" @click="browseClicked" label="Browse All" severity="info"/>
            </div>
         </div>
      </div>
   </section>
</template>

<script setup>
import { useCollectionStore } from "@/stores/collection"
import { useFilterStore } from "@/stores/filter"
import { useItemStore } from "@/stores/item"
import { useQueryStore } from "@/stores/query"
import { useRoute, useRouter } from 'vue-router'
import { routeutils } from '@/routeutils'

const collection = useCollectionStore ()
const filter = useFilterStore()
const item = useItemStore()
const queryStore = useQueryStore()
const route = useRoute()
const router = useRouter()

const browseClicked = (() => {
   filter.reset()
   filter.toggleFilter("presearch", collection.filter, collection.title)
   queryStore.clear()
   queryStore.setTargetPool(item.details.source)
   routeutils.setCollectionSearchParams(router, route.query )
})

const searchClicked = (() => {
   filter.reset()
   filter.toggleFilter("presearch", collection.filter, collection.title)
   queryStore.setTargetPool(item.details.source)
   routeutils.setCollectionSearchParams(router, route.query)
})
</script>

<style lang="scss" scoped>
.collection-panel {
   background-color: white;
   padding-top: 15px;

   .collection-header {
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      gap: 25px;
      .image {
         .thumb {
            display: block;
            max-height:200px;
         }
         .thumb.bookplate {
            max-width: 100%;
            height: auto;
            min-width: 150;
            max-width: 190px;
            max-height: none;
         }
      }
      .collection-right-panel {
         flex:1;
         display: flex;
         flex-direction: column;

         .content {
            .title-row  {
               font-weight: bold;
               font-size: 1.25em;
            }

            .desc-row {
               padding: 20px 0 0 0px;
               min-width: 300px;
               margin-bottom: 25px;
               margin-right: 20px;
            }
         }
         .collection-search {
               display: flex;
               flex-flow: row wrap;
               align-items: center;
               justify-content: space-between;

               .search-box {
                  flex: 1;
                  display: flex;
                  flex-flow: row nowrap;
                  align-items: stretch;
                  justify-content: flex-start;
                  input[type=text] {
                     flex: 1;
                     min-width: 100px;
                     width: 100%;
                     border-radius: 0.3rem 0 0 0.3rem;
                     font-size: 1.1em;
                  }
                  button {
                     border-radius: 0 0.3rem 0.3rem 0;
                  }
               }
            }
      }
   }
}

@media only screen and (min-width: 768px) {
   .collection-search {
       width: 85%;
       gap: 25px;
   }
}
@media only screen and (max-width: 935px) {
    .collection-search {
       width: 95%;
       gap: 15px;
   }
}
@media only screen and (max-width: 768px) {
    .collection-search {
       width: 100%;
       gap: 5px;
   }
}
</style>
