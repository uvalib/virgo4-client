<template>
   <section class="collection-header">
      <div class="image">
         <img v-if="collection.images.length > 0" class="thumb" :src="collection.images[0].url" :alt="collection.images[0].alt_text"/>
      </div>

      <div class="content">
         <div class="title-row">{{collection.title}}</div>
         <div class="desc-row">{{collection.description}}</div>
      </div>

      <div class="actions">
         <span class="seq-nav" v-if="canNavigate">
            <V4Button class="pager prev" mode="primary" @click="prevItem()" :aria-label="`previous ${collection.itemLabel}`">
               <i class="prior fal fa-arrow-left"></i>Previous {{collection.itemLabel}}
            </V4Button>
            <CollectionDates v-if="hasCalendar" id="coll-dates" :date="publishedDate" @picked="datePicked" />
            <V4Button class="pager" mode="primary" @click="nextItem()"  :aria-label="`next ${collection.itemLabel}`">
               Next {{collection.itemLabel}}<i class="next fal fa-arrow-right"></i>
            </V4Button>
         </span>

         <div class="collection-search" v-if="canSearch">
            <input autocomplete="off" type="text" id="search"
               @keyup.enter="searchClicked"
               v-model="basic"
               placeholder="Search this collection"
            >
            <V4Button class="search" mode="primary" @click="searchClicked">Search</V4Button>
         </div>

         <div v-if="isFullPage" class="pure-form">
            <label>View:</label>
            <select v-model="viewMode">
               <option value="virgo">Standard</option>
               <option value="reader">Full Page</option>
            </select>
         </div>

         <V4Button v-if="lastSearchURL" mode="text" @click="returnToSearch" class="back">Return to search results</V4Button>
      </div>
   </section>
</template>

<script>
import { mapGetters, mapState } from "vuex"
import { mapFields } from 'vuex-map-fields'
import CollectionDates from "@/components/modals/CollectionDates"
export default {
   components: {
      CollectionDates
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
         viewMode: 'collection.viewMode',
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
.collection-header {
   background-color: white;
   padding: 15px 20px;
   display: flex;
   flex-flow: row wrap;
   justify-content: center;
   border-top: 1px solid var(--uvalib-grey-light);
   border-bottom: 1px solid var(--uvalib-grey-light);
   margin-bottom: 15px;

   .thumb {
      display: inline-block;
      max-height:200px;
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
      flex-flow: row nowrap;
      align-items: stretch;
      justify-content: flex-start;
      margin: 0 0 10px auto;
      font-size: 0.9em;
      min-width: 300px;

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
         padding: 0 20px;
      }
   }

   .seq-nav {
      display: flex;
      flex-flow: row nowrap;
      margin: 0px auto 10px 0;
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
         margin: 0 5px;
      }
   }
}
</style>
