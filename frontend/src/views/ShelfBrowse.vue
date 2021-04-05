<template>
   <div class="shelf-browse">
      <div class="working" v-if="working" >
         <V4Spinner message="Looking up items..."/>
      </div>
      <template v-else>
         <div class="info">
            <div class="line">
               <span class="label">Title Searched:</span>
               <router-link :to="backURL" class="to-item`">
                  <span class="item-title" v-html="browseTarget.title"></span>
               </router-link>
            </div>
            <div class="line">
               <span class="label">Call Number:</span>
               <span class="item-call" v-html="browseTarget.call_number"></span>
            </div>
         </div>
      </template>
      <div class="browse-controls full">
         <V4Button class="pager" mode="primary" @click="browsePrior()" aria-label="browse previous shelf item">
            <i class="prior pager fas fa-arrow-left"></i>
         </V4Button>
         <span class="range"><b>CATALOG RANGE:</b>{{firstCall}}&nbsp;-&nbsp;{{lastCall}}</span>
         <V4Button class="pager" mode="primary" @click="browseNext()"  aria-label="browse next shelf item">
            <i class="next pager fas fa-arrow-right"></i>
         </V4Button>
      </div>
      <div class="browse-detail" v-if="!working" >
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
      firstCall() {
         return this.shelfBrowse[0].call_number
      },
      lastCall() {
         return this.shelfBrowse[this.shelfBrowse.length-1].call_number
      }
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
   width: 100%;
   margin: 0 auto;

   .info {
      font-size: 1.2em;
      font-weight: normal;
      .line {
         margin-bottom: 5px;
      }
      .label {
         margin-right: 5px;

      }
   }

   .browse-controls.full {
      margin: 25px 0 25px 0;
      display: flex;
      flex-flow: row wrap;
      justify-content: space-between;
      align-content: stretch;
      align-items: center;
      padding: 15px;
      box-sizing: border-box;
      .range {
         b {
            margin-right: 10px;
            font-weight: bolder;
         }
      }
      button.v4-button.pager {
         margin: 0;
         i.pager {
            font-size: 25px;
         };
      }

   }

   .browse-detail {
      margin: 20px 30px 0 30px;
      padding-top: 5px;
   }

   .browse-cards {
      display: grid;
      grid-gap: 1.25rem;
      margin: 0 0 20px 0;
      padding: 0;
      box-sizing: border-box;
      justify-content: center;

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
@media only screen and (min-width: 768px) {
   div.info  {
      max-width: 75%;
      margin: 0 auto;
   }
   .browse-controls.full {
      background-color: var(--uvalib-grey-lightest);
   }
   .browse-cards {
      grid-template-columns: repeat(4, 200px);
   }
}
@media only screen and (max-width: 768px) {
   div.info  {
      max-width: 90%;
      margin: 0 auto;
      button.v4-button {
         width:auto;
      }
   }
   .browse-controls.full {
       background-color: white;
       button.v4-button {
         width: 100%
      }
      .range {
         margin: 15px 0;
      }
    }
   .browse-cards {
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
   }
}
</style>
