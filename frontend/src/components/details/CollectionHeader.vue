<template>
   <section class="collection-header" v-if="isFullPage">
      <div class="top-row" >
         <span class="collection-title">{{collection.title}}</span>
         <span class="seq-nav" v-if="canNavigate">
            <V4Button class="pager prev" mode="primary" @click="prevItem()" :aria-label="`previous ${collection.itemLabel}`">
               <i class="prior fal fa-arrow-left"></i>Previous {{collection.itemLabel}}
            </V4Button>
            <CollectionDates v-if="hasCalendar" id="coll-dates" :date="publishedDate" @picked="datePicked" />
            <V4Button class="pager" mode="primary" @click="nextItem()"  :aria-label="`next ${collection.itemLabel}`">
               Next {{collection.itemLabel}}<i class="next fal fa-arrow-right"></i>
            </V4Button>
         </span>
      </div>
      <div class="mid-row">
         <AboutCollection :details="collection.description" />
         <V4Button v-if="lastSearchURL" mode="text" @click="returnToSearch" class="back">Return to search results</V4Button>
      </div>
      <div class="collection-search" v-if="canSearch">
         <input autocomplete="off" type="text" id="search"
            @keyup.enter="searchClicked"
            v-model="basic"
            placeholder="Search this collection"
         >
         <V4Button class="search" mode="primary" @click="searchClicked">Search</V4Button>
      </div>
   </section>
   <section class="collection-header border" v-else>
      <div class="title-row">
         <span class="collection-title">{{collection.title}}</span>
         <div class="collection-search" v-if="canSearch">
            <input autocomplete="off" type="text" id="search"
               @keyup.enter="searchClicked"
               v-model="basic"
               placeholder="Search this collection"
            >
            <V4Button class="search" mode="primary" @click="searchClicked">Search</V4Button>
         </div>
      </div>
      <div class="desc-row">
         {{collection.description}}
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
         lastSearchURL: state => state.lastSearchURL,
         details : state => state.item.details,
         collection : state => state.collection,
      }),
      ...mapGetters({
         canNavigate: 'collection/canNavigate',
         canSearch: 'collection/canSearch',
         rawQueryString: 'query/string',
         filtersQueryParam: 'filters/asQueryParam',
         hasCalendar: 'collection/hasCalendar',
         isFullPage: 'collection/isFullPage',
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
      datePicked(pid) {
         this.$router.push(pid)
      },
      searchClicked() {
         // Set up the search in the store and flag it is user generated
         this.$store.commit("filters/reset")
         let data = {pool: "presearch", facetID: this.collection.filter, value: this.collection.title}
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
.collection-header.border {
   border-bottom: 1px solid var(--uvalib-grey);
   margin-bottom: 15px;
}
.collection-header {
   background-color: white;
   padding: 15px;
   .top-row, .title-row  {
      display: flex;
      flex-flow: row wrap;
      justify-content: space-between;
      margin: 10px 0;
      align-items: center;
   }
   .title-row  {
      margin: 0;
      justify-content: flex-start;
      .collection-title {
         margin-bottom: 10px;
      }
      .collection-search {
         margin: 0 0 10px auto;
         font-size: 0.9em;
         .search {
            padding: 0 20px;
         }
      }
   }
   .desc-row {
      text-align: left;
      padding: 10px 20px 0 20px;
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
