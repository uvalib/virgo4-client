<template>
   <section class="shelf-browse" aria-live="polite">
      <div class="working" v-if="working" aria-hidden="true">
         <V4Spinner message="Getting shelf browse data..." />
      </div>
      <nav aria-labelledby="shelf-title" v-if="!working && hasBrowseData">
         <h2 id="shelf-title">Shelf Browse</h2>
         <ul class="browse-cards" role="list">
            <li v-for="(b,idx) in shelfBrowse" class="card-wrap" :key="`b${b.id}`">
               <BrowseCard :current="isCurrent(idx)" :pool="pool" :data="b" style="height:100%"/>
            </li>
         </ul>
         <router-link @click.native="fullScreenBrowseClicked" :to="browseURL" class="to-browse" >
            View full page
         </router-link>
         <BrowsePager />
         <div class="centered" v-if="showRestore">
            <V4Button mode="primary" @click="browseRestore()">Return to {{currentCallNumber}}</V4Button>
         </div>
      </nav>
   </section>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import AddBookmark from '@/components/modals/AddBookmark'
import SignInRequired from '@/components/modals/SignInRequired'
import BrowseCard from '@/components/details/BrowseCard'
import BrowsePager from '@/components/details/BrowsePager'
export default {
   props: {
      hit: {
         type: Object,
         required: true
      },
      target: {
         type: String,
         default: ""
      },
      pool: {
         type: String,
         required: true
      }
   },
   components: {
      AddBookmark, SignInRequired, BrowseCard, BrowsePager
   },
   computed: {
      ...mapState({
         shelfBrowse : state => state.shelf.browse,
         working: state => state.shelf.lookingUp,
         browseRange: state => state.shelf.browseRange,
         devServer: state => state.system.devServer
      }),
      ...mapGetters({
         hasBrowseData: 'shelf/hasBrowseData',
         isSignedIn: 'user/isSignedIn',
      }),
      currentCallNumber() {
         let f =  this.hit.detailFields.find( f => f.name == "call_number")
         if ( f) {
            return f.value
         }
         return this.hit.identifier
      },
      showRestore() {
         let center = this.shelfBrowse[this.browseRange]
         return center.id != this.hit.identifier
      },
      browseURL() {
         return `/sources/${this.pool}/items/${this.hit.identifier}/browse`
      }
   },
   methods: {
      fullScreenBrowseClicked() {
         this.$analytics.trigger('ShelfBrowse', 'FULL_SCREEN_BROWSE_CLICKED', this.hit.identifier)
      },
      isCurrent(idx) {
         if ( this.working) return false
         let item = this.shelfBrowse[idx]
         return item.id == this.hit.identifier
      },
      browseRestore() {
         this.$store.commit("shelf/setShowSpinner", false)
         this.$store.dispatch("shelf/getBrowseData", this.hit.identifier )
         this.$analytics.trigger('ShelfBrowse', 'BROWSE_RESTORE_CLICKED', this.hit.identifier)
      },
      async getBrowseData() {
         this.$store.commit("shelf/setBrowseRange", 3)
         let tgt = this.hit.identifier
         if ( this.target && this.target != "")  {
            tgt = this.target
         }
         await this.$store.dispatch("shelf/getBrowseData", tgt )
         if ( this.hasBrowseData) {
            this.$analytics.trigger('ShelfBrowse', 'BROWSE_LOADED', this.hit.identifier)
         }
         if ( this.target && this.target != "")  {
            let bmEle = document.getElementById(`bm-modal-${this.target}-btn`)
            if (bmEle) {
               bmEle.focus()
               bmEle.click()
            }
         }
      }
   },
   mounted() {
      this.getBrowseData()
   }
}
</script>

<style lang="scss" scoped>
.shelf-browse {
   width: 95%;
   margin: 0 auto;

   .working {
      text-align: center;
      margin: 20px 0 30px 0;
      font-size: 0.85em;
   }

   .center {
      text-align: centter;
   };

   .browse-cards {
      padding: 5px 0;
      display: flex;
      flex-flow: row nowrap;
      overflow: hidden;
      justify-content: center;
      align-content: stretch;
      list-style-type: none;
      .card-wrap {
         width: 190px;
      }
   }

   h2 {
      margin: 50px 0 10px 0;
      color: var(--color-primary-orange);
      text-align: center;
      .to-browse {
         font-size: 0.65em;
         display: block;
         margin-left: auto;
         margin: 10px 0 15px 0;
      }
   }
}
</style>