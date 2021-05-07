<template>
   <section class="collection-header">
      <div class="top-row">
         <span class="collection-title">{{collectionName}}</span>
         <span class="seq-nav" v-if="canNavigate">
            <V4Button class="pager" mode="primary" @click="browsePrior()" :aria-label="`previous ${itemLabel}`">
               <i class="prior fal fa-arrow-left"></i>Previous {{itemLabel}}
            </V4Button>
            <V4Button class="pager" mode="primary" @click="browseNext()"  :aria-label="`next ${itemLabel}`">
               Next {{itemLabel}}<i class="next fal fa-arrow-right"></i>
            </V4Button>
         </span>
      </div>
      <div class="back" v-if="lastSearchURL">
         <V4Button mode="text" @click="returnToSearch">Return to search results</V4Button>
      </div>
   </section>
</template>

<script>
import { mapGetters, mapState } from "vuex"
export default {
   computed: {
      ...mapState({
         itemLabel: state=>state.collection.itemLabel,
         lastSearchURL: state => state.lastSearchURL,
      }),
      ...mapGetters({
         canNavigate: 'collection/canNavigate',
         collectionName: 'item/collectionName',
      })
   },
   methods: {
      returnToSearch() {
         this.$router.push( this.lastSearchURL )
      },
      nextItem() {
         // TODO
      },
      prevItem() {
         // TODO
      },
   },
}
</script>
<style lang="scss" scoped>
.collection-header {
   background-color: white;
   padding: 15px;
   .top-row {
      display: flex;
      flex-flow: row wrap;
      justify-content: space-between;
      margin: 10px 0px;
      align-items: center;
   }
   .back {
      margin-top: 15px;
      text-align: right;
   }

   .collection-title {
      font-size: 1.25em;
      display:flex;
      flex-flow: row nowrap;
      align-items: flex-start;
      justify-content: flex-start;
   }

   .v4-button.pager {
      margin: 0 0 0 5px;
      i.next {
         margin: 0 0 0 5px;
      }
      i.prior {
         margin: 0 5px 0 0;
      }
   }
}
</style>
