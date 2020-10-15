<template>
   <div class="shelf-browse">
      <div class="working" v-if="working">
         <V4Spinner message="Getting shelf browse data..." />
      </div>
      <template v-if="!working && hasBrowseData">
         <h2>Shelf Browse </h2>
         <div class="browse-wrapper">
            <div class="browse-card" v-for="(b,idx) in shelfBrowse" :class="{current: isCurrent(idx)}" :key="`b${b.id}`">
               <i class="current fas fa-caret-down" v-if="isCurrent(idx)"></i>
               <div class="thumb-wrap">
                  <a @click="browseDetailClicked(b.id)" :href="`/items/${b.id}`">
                     <img class="thumb" v-if="b.cover_image_url" :src="b.cover_image_url" />
                  </a>
               </div>
               <div class="details">
                  <span class="call">{{b.call_number}}</span>
                  <span class="loc">{{b.location}}</span>
                  <a @click="browseDetailClicked(b.id)" :href="`/items/${b.id}`" class="title">{{b.title}}</a>
                  <span class="title">{{b.published_date}}</span>
               </div>
               <div class="bm-control">
                  <AddBookmark v-if="isSignedIn" :data="bookmarkData(b)" :id="`bm-modal-${b.id}`"
                     @clicked="bookmarkClicked(b.id)"
                  />
                  <SignInRequired v-else :data="bookmarkData(b)" :id="`bm-modal-${b.id}`" act="bookmark" />
               </div>
            </div>
         </div>
         <div class="browse-control">
            <V4Button mode="primary" @click="browsePrior()"><i class="prior fas fa-chevron-left"></i>Previous</V4Button>
            <V4Button mode="primary" @click="browseNext()">Next<i class="next fas fa-chevron-right"></i></V4Button>
         </div>
         <div class="centered" v-if="showRestore">
            <V4Button mode="primary" @click="browseRestore()">Return to {{currentCallNumber}}</V4Button>
         </div>
      </template>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import AddBookmark from '@/components/modals/AddBookmark'
import SignInRequired from '@/components/modals/SignInRequired'

export default {
   props: {
      hit: {
         type: Object,
         required: true
      },
      pool: {
         type: String,
         required: true
      }
   },
   components: {
      AddBookmark, SignInRequired
   },
   computed: {
      ...mapState({
         shelfBrowse : state => state.shelf.browse,
         working: state => state.shelf.lookingUp,
         browseRange: state => state.shelf.browseRange,
      }),
      ...mapGetters({
         hasBrowseData: 'shelf/hasBrowseData',
         isSignedIn: 'user/isSignedIn',
      }),
      currentCallNumber() {
         let f =  this.hit.detailFields.find( f => f.name == "call_number")
         return f.value
      },
      showRestore() {
         let center = this.shelfBrowse[this.browseRange]
         return center.id != this.hit.identifier
      }
   },
   methods: {
      bookmarkData( item ) {
         return {pool: this.pool, identifier: item.id, title: item.title }
      },
      isCurrent(idx) {
         let item = this.shelfBrowse[idx]
         return item.id == this.hit.identifier

      },
      browseRestore() {
         this.$store.commit("shelf/setShowSpinner", false)
         this.$store.dispatch("shelf/getBrowseData", this.hit.identifier )
         this.$analytics.trigger('ShelfBrowse', 'BROWSE_RESTORE_CLICKED', this.hit.identifier)
      },
      browseNext() {
         this.$store.dispatch("shelf/browseNext")
         this.$analytics.trigger('ShelfBrowse', 'BROWSE_NEXT_CLICKED', this.hit.identifier)
      },
      browsePrior() {
         this.$store.dispatch("shelf/browsePrior")
         this.$analytics.trigger('ShelfBrowse', 'BROWSE_PREV_CLICKED', this.hit.identifier)
      },
      browseDetailClicked(id) {
         this.$analytics.trigger('ShelfBrowse', 'BROWSE_DETAIL_CLICKED', id)
      },
      bookmarkClicked(id) {
         this.$analytics.trigger('ShelfBrowse', 'BROWSE_BOOKMARK_CLICKED', id)
      },
      async getBrowseData() {
         await this.$store.dispatch("shelf/getBrowseData", this.hit.identifier )
         if ( this.hasBrowseData) {
            this.$analytics.trigger('ShelfBrowse', 'BROWSE_LOADED', this.hit.identifier)
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

   .browse-control {
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      margin: 10px 25px;
      i.next {
         margin: 0 0 0 8px;
      }
      i.prior {
         margin: 0 8px 0 0;
      }
   }
   .center {
      text-align: centter;
   };

   .browse-wrapper {
      padding: 5px 0;
      display: flex;
      flex-flow: row nowrap;
      overflow: hidden;
      justify-content: center;
      .browse-card {
         border: 1px solid var(--uvalib-grey);
         box-shadow: $v4-box-shadow;
         padding: 0 0 25px 0;
         margin: 5px;
         position: relative;
         display: flex;
         flex-direction: column;
         font-size: .937em;
         text-align: center;
         width: 175px;
         &:hover {
            top: -2px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0,1);
         }

         .bm-control {
            position: absolute;
            bottom: 0;
            bottom: 4px;
            right: 5px;
            height: 25px;
            text-align: right;
         }

         .thumb-wrap {
            height: 215px;
            text-align: center;
            background: white;

            a {
               display: inline-block;
               &:focus {
                  @include be-accessible();
               }
            }
            img {
               height: auto;
               align-self: center;
               display: block;
               min-width:135px;
               max-height: 200px;
               margin: 7px auto 5px auto;
               background-image: url('~@/assets/dots.gif');
               background-repeat:no-repeat;
               background-position: center center;
               position: relative;
               max-width: 100%;
            }
         }
         i.current {
            position: absolute;
            top: -15px;
            width: 100%;
            text-align: center;
         }
         .details {
            background: white;
            border-top: 3px solid var(--uvalib-grey-light);
            border-radius: 0 0 5px 5px;
            padding: 5px 0;
         }
         .call, .loc, .title {
            background: white;
            word-break: break-word;
            -webkit-hyphens: auto;
            -moz-hyphens: auto;
            hyphens: auto;
            max-width: 95%;
            display: block;
            margin: 0 auto;
            font-weight: 500;
         }
         .loc {
            font-weight: normal;
         }
         .title  {
            margin-top:5px;
         }
      }

      .browse-card.current {
         border: 3px solid var(--uvalib-brand-blue-light);
      }
   }

   h2 {
      // background:  var(--uvalib-blue-alt-light);
      // padding: 5px 10px;
      // border-top: 2px solid  var(--uvalib-blue-alt);
      // border-bottom: 2px solid  var(--uvalib-blue-alt);
      // text-align: left;
      // font-size: 1.25em;
      // margin: 50px 0 30px 0;
      margin: 50px 0 30px 0;
      color: var(--color-primary-orange);
      text-align: center;
   }
}
</style>