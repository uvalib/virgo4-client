<template>
   <section class="collection-header">
      <div class="top-row">
         <span class="collection-title">{{collectionName}}</span>
         <span class="seq-nav" v-if="canNavigate">
            <V4Button class="pager prev" mode="primary" @click="prevItem()" :aria-label="`previous ${itemLabel}`">
               <i class="prior fal fa-arrow-left"></i>Previous {{itemLabel}}
            </V4Button>
            <CollectionDates id="coll-dates" :date="publishedDate" />
            <V4Button class="pager" mode="primary" @click="nextItem()"  :aria-label="`next ${itemLabel}`">
               Next {{itemLabel}}<i class="next fal fa-arrow-right"></i>
            </V4Button>
         </span>
      </div>
      <div class="mid-row">
         <AboutCollection :details="description" />
         <V4Button v-if="lastSearchURL" mode="text" @click="returnToSearch" class="back">Return to search results</V4Button>
      </div>
      <div class="collection-search">
         <input autocomplete="off" type="text" id="search"
            @keyup.enter="searchClicked"
            v-model="basic"
            placeholder="Search this collection"
         >
         <V4Button class="search" mode="primary" @click="searchClicked">Search</V4Button>
      </div>
   </section>
</template>

<script>
import { mapGetters, mapState } from "vuex"
import { mapFields } from 'vuex-map-fields'
import AboutCollection from "@/components/disclosures/AboutCollection"
import CollectionDates from "@/components/modals/CollectionDates"
export default {
   components: {
      AboutCollection, CollectionDates
   },
   data: function() {
      return {
         collectionQuery: ""
      }
   },
   computed: {
      ...mapState({
         itemLabel: state=>state.collection.itemLabel,
         lastSearchURL: state => state.lastSearchURL,
         details : state => state.item.details,
         description : state => state.collection.description,
         collectionFacet : state => state.collection.filter,
      }),
      ...mapGetters({
         canNavigate: 'collection/canNavigate',
         collectionName: 'item/collectionName',
         rawQueryString: 'query/string',
         filtersQueryParam: 'filters/asQueryParam',
      }),
      ...mapFields({
         userSearched: 'query.userSearched',
         basic: 'query.basic',
      }),
      publishedDate() {
         let field = this.details.detailFields.find( f => f.name == "published_date")
         if (field) {
            return field.value
         }
         return ""
      }
   },
   methods: {
      searchClicked() {
         // Set up the search in the store and flag it is user generated
         this.$store.commit("filters/reset")
         let data = {pool: "presearch", facetID: this.collectionFacet.name, value: this.collectionFacet.value}
         this.$store.commit("filters/toggleFilter", data)
         this.$store.commit("query/setTargetPool", this.details.source)
         this.userSearched = true

         // use the model to setup the URL
         let query = Object.assign({}, this.$route.query)
         delete query.page
         delete query.filter
         query.q = this.rawQueryString
         query.filter = this.filtersQueryParam( "presearch" )
         query.pool = this.details.source
         this.$router.push({path: "/search", query: query })
      },
      returnToSearch() {
         this.$router.push( this.lastSearchURL )
      },
      nextItem() {
         let date = this.publishedDate
         if (date) {
            this.$store.dispatch("collection/nextItem", date)
         }
      },
      prevItem() {
         let date = this.publishedDate
         if (date) {
            this.$store.dispatch("collection/priorItem", date)
         }
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
      margin: 10px 0;
      align-items: center;
   }
   .mid-row {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      .back {
         margin-left: auto;
      }
   }
   .collection-search {
      display: flex;
      flex-flow: row nowrap;
      align-items: stretch;
      justify-content: flex-start;
      max-width: 800px;
      margin: 20px auto 0 auto;

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
      .search {
         border-radius: 0 5px 5px 0;
         margin: 0;
         padding: 0 40px;
      }
   }

   .collection-title {
      font-size: 1.25em;
      display:flex;
      flex-flow: row nowrap;
      align-items: flex-start;
      justify-content: flex-start;
   }
   .seq-nav {
      display: flex;
      flex-flow: row nowrap;
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
         margin: 0 5px;
      }
   }
}
</style>
