<template>
   <div class="collection-context" v-if="collection.isAvailable">
      <div class="collect-head">
         <span class="title">Collections</span>
         <CollectionDates id="coll-dates" :date="collection.startDate" @picked="collectionPidPicked" v-if="collection.hasCalendar"/>
      </div>
      <div class="collect-rec">
         <img v-if="collection.image" class="thumb"  :class="{bookplate: collection.isBookplate}" :src="collection.image.url" :alt="collection.image.alt_text"/>
         <span class="text">
            <p class="collection">{{collection.title}}</p>
            <span class="desc" v-html="collection.description"></span>
         </span>

      </div>
   </div>
</template>

<script setup>
import CollectionDates from "@/components/modals/CollectionDates.vue"
import { useResultStore } from "@/stores/result"
import { useCollectionStore } from "@/stores/collection"
import { useRouter} from 'vue-router'

const router = useRouter()
const resultStore = useResultStore()
const collection = useCollectionStore()

function collectionPidPicked(pid) {
   router.push(`/sources/${resultStore.selectedResults.pool.id}/items/${pid}`)
}
</script>

<style lang="scss" scoped>
.collection-context {
   padding: 10px;
   background: white;
   color: var(--uvalib-text);
   border-top: 3px solid var(--uvalib-brand-blue);

   .collect-rec {
      margin: 0 0 15px 10px;
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;

      .thumb {
         width: 100px;
         margin-right: 15px;
      }
      .thumb.bookplate {
         box-shadow: var(--uvalib-box-shadow);
      }
      .desc {
         margin-right: 25px;
      }
      .collection {
         font-weight: bold;
         margin: 0 0 5px 0;
         font-size: 0.9em;
      }
   }

   .collect-head {
      font-weight: bold;
      margin: 0;
      padding: 0;
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      .title {
         padding: 0;
         display: block;
         margin-bottom: 15px;
      }
   }
}
</style>
