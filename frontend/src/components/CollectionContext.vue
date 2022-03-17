<template>
   <div class="collection-context" v-if="collectionCtxAvailable">
      <div class="collect-head">
         <span class="title">Collections</span>
         <CollectionDates id="coll-dates" :date="collection.startDate" @picked="collectionPidPicked" v-if="hasCalendar"/>
      </div>
      <div class="collect-rec">
         <img v-if="collection.image" class="thumb"  :class="{bookplate: isBookplate}" :src="collection.image.url" :alt="collection.image.alt_text"/>
         <span class="text">
            <p class="collection">{{collection.title}}</p>
            <span class="desc" v-html="collection.description"></span>
         </span>

      </div>
   </div>
</template>

<script>
import { mapGetters, mapState } from "vuex"
import CollectionDates from "@/components/modals/CollectionDates"
export default {
   components: {
      CollectionDates
   },
   computed: {
      ...mapGetters({
         collectionCtxAvailable: 'collection/isAvailable',
         hasCalendar: 'collection/hasCalendar',
         isBookplate: 'collection/isBookplate',
         selectedResults: 'selectedResults',
      }),
      ...mapState({
         collection: state => state.collection,
      }),
   },
   methods: {
      collectionPidPicked(pid) {
         this.$router.push(`/sources/${this.selectedResults.pool.id}/items/${pid}`)
      },
   }
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
         box-shadow: $v4-box-shadow-light;
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
