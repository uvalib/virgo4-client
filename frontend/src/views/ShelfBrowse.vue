<template>
   <div class="shelf-browse">
      <div class="working" v-if="working" >
         <V4Spinner message="Looking up items..."/>
      </div>
      <template v-else>
         <div class="info">
            Browsing items related to
            <router-link :to="backURL" class="to-item`">
               <span class="item-call" v-html="browseTarget.call_number"></span>:&nbsp;
               <span class="item-title" v-html="browseTarget.title"></span>
            </router-link>
         </div>
      </template>
      <div class="browse-detail" v-if="!working" >
         <BrowsePager/>
         <div class="browse-cards">
            <BrowseCard  v-for="(b,idx) in shelfBrowse" :current="isCurrent(idx)" :pool="$route.params.src" :data="b"  :key="`b${b.id}`"/>
         </div>
         <BrowsePager/>
      </div>
   </div>
</template>

<script>
import { mapState, mapGetters } from "vuex"
import BrowseCard from '@/components/details/BrowseCard'
import BrowsePager from '@/components/details/BrowsePager'
export default {
   name: "shelf-browse",
   components: {
      BrowseCard, BrowsePager
   },

   data: function() {
      return {
         browseTarget: null
      };
   },
   watch: {
      working(newVal) {
         // when browse search is done and the current target is not set, find it
         // in browse data and set it
         if ( newVal == false && this.browseTarget == null) {
            this.browseTarget = this.shelfBrowse.find(b=> b.id == this.$route.params.id)
            console.log("CENTER: "+JSON.stringify(this.browseTarget ))
         }
      }
   },

   computed: {
      ...mapState({
         shelfBrowse : state => state.shelf.browse,
         working: state => state.shelf.lookingUp,
      }),
      ...mapGetters({
         isSignedIn: 'user/isSignedIn',
      }),
      backURL() {
         return `/sources/${this.$route.params.src}/items/${this.$route.params.id}`
      },
   },
   methods: {
      isCurrent(idx) {
         if ( this.working) return false
         let item = this.shelfBrowse[idx]
         return item.id == this.browseTarget.id
      },
      async initializeBrowse() {
         this.$store.commit("shelf/setBrowseRange", 10)
         this.$store.commit("shelf/setShowSpinner", true)
         if ( this.isSignedIn) {
            this.$store.dispatch("bookmarks/getBookmarks")
         }
         await this.$store.dispatch("shelf/getBrowseData", this.$route.params.id )
      },
   },
   created() {
      this.initializeBrowse()
   },
}
</script>
<style lang="scss" scoped>
.shelf-browse {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   margin-bottom: 10vh;
   color: var(--color-primary-text);
   width: 95%;
   margin: 0 auto;

   .browse-detail {
      margin: 20px 30px 0 30px;
      padding-top: 5px;
   }

   .browse-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
      grid-gap: 1.25rem;
      margin: 0 0 20px 0;
      padding: 0;
      box-sizing: border-box;

      .browse-card {
         width: 100%;
         margin: 0 auto;
      }
   }

   .working {
      text-align: center;
      font-size: 0.9em;
   }
   .working img {
      margin: 30px 0;
   }
}
</style>
