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
            <i class="prior pager fal fa-arrow-left"></i>
         </V4Button>
         <span class="range"><b>CATALOG RANGE:</b>{{firstCall}}&nbsp;-&nbsp;{{lastCall}}</span>
         <V4Button class="pager" mode="primary" @click="browseNext()"  aria-label="browse next shelf item">
            <i class="next pager fal fa-arrow-right"></i>
         </V4Button>
      </div>
      <div class="view-mode">
         <span tabindex="0" class="view" id="view"
             @click.stop="toggleViewMenu" @keyup.prevent.stop.enter="toggleViewMenu"
         >
            <span class="select-header">
               <span v-html="viewMode"></span>
               <i class="dd-caret fas fa-caret-down" v-bind:style="{ transform: rotation }"></i>
            </span>
            <transition name="grow"
               v-on:before-enter="beforeEnter" v-on:enter="enter"
               v-on:before-leave="beforeLeave" v-on:leave="leave"
            >
               <ul v-if="viewModeOpen" class="view-menu"  @keydown.space.prevent.stop role="group">
                  <li v-for="vm in viewModes" :key="vm.id" v-html="vm.title"
                     @click.stop.prevent="selectView(vm.id)"></li>
               </ul>
            </transition>
         </span>
      </div>
      <div class="browse-detail" v-if="!working" >
         <div class="browse-cards" :class="currViewMode">
            <BrowseCard  v-for="(b,idx) in shelfBrowse" :current="isCurrent(idx)"
               :pool="$route.params.src" :data="b"  :key="`b${b.id}`" :mode="currViewMode" :index="idx+1"
            />
         </div>
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
         viewModes: [{id: 'gallery', title: "<i class='fas fa-grip-horizontal'></i>&nbsp;View gallery"},
                     {id: 'list', title: "<i class='fal fa-list'></i>&nbsp;View list"}],
         currViewMode: 'gallery',
         viewModeOpen: false,
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
      viewMode() {
         var m = this.viewModes.find( vm => vm.id == this.currViewMode)
         return m.title
      },
      ...mapState({
         shelfBrowse : state => state.shelf.browse,
         working: state => state.shelf.lookingUp,
      }),
      ...mapGetters({
         isSignedIn: 'user/isSignedIn',
      }),
      rotation() {
         if ( this.viewModeOpen ) {
            return "rotate(180deg)"
         }
         return "rotate(0deg)"
      },
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
      selectView( mode) {
         this.currViewMode = mode
         this.viewModeOpen = false
      },
      toggleViewMenu() {
         this.viewModeOpen = !this.viewModeOpen
      },
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
      browseNext() {
         this.$store.dispatch("shelf/browseNext")
         this.$analytics.trigger('ShelfBrowse', 'BROWSE_NEXT_CLICKED')
      },
      browsePrior() {
         this.$store.dispatch("shelf/browsePrior")
         this.$analytics.trigger('ShelfBrowse', 'BROWSE_PREV_CLICKED')
      },
      beforeEnter: function(el) {
         el.style.height = '0'
      },
      enter: function(el) {
         el.style.height = el.scrollHeight + 'px'
         this.expandedItem = el
      },
      beforeLeave: function(el) {
         el.style.height = el.scrollHeight + 'px'
         this.expandedItem = el
      },
      leave: function(el) {
         el.style.height = '0'
      }
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

   .view-mode {
      text-align: right;
      margin-right: 15px;
      .view {
         .select-header {
            width: 120px;
            display: flex;
            flex-flow: row nowrap;
            text-align: left;
            justify-content: space-between;
            span, i {
               display: inline-block;
            }


         }
         position: relative;
         transition: transform 200ms;
         display: inline-block;
         cursor: pointer;
         padding: 0 5px;
         &:focus {
            @include be-accessible();
         }
      }

      i.dd-caret {
         margin-left: 5px;
         display: inline-block;
         transition: transform 200ms;
      }
      .view-menu {
         text-align: left;
         transition: 100ms;
         list-style: none;
         padding:10px 0 0 0;
         margin: 0;
         border-radius: 0 0 5px 5px;
         border: 1px solid var(--uvalib-grey-light);
         position: absolute;
         z-index: 100;
         background: white;
         left:0;
         right:0;
         box-shadow: $v4-box-shadow;
         li {
            line-height: 35px;
            padding: 0 10px 0 10px;
            &:hover {
               background-color: var(--uvalib-brand-blue-lightest);
               color: var(--uvalib-text-dark);
            }
            &:focus {
               background-color: var(--uvalib-brand-blue-lightest);
               color: var(--uvalib-text-dark);
            }
         }

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
   .browse-cards.list {
      max-width:75%;
      margin: 0 auto;
      grid-template-columns: unset;
      grid-gap: unset;
      display: flex;
      flex-direction:  column;
      .browse-card {
         width: 100%;
      }
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
   .browse-cards.list {
      max-width:90%;
      grid-template-columns: unset;
      grid-gap: unset;
      display: flex;
      flex-direction:  column;
      margin: 0 auto;
      .browse-card {
         width: 100%;
      }
   }
}
</style>
