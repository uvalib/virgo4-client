<template>
   <span v-if="isKiosk==false" class="bookmark-container">
      <template v-if="isSignedIn">
         <i @click="removeBookmarkClicked" class="bookmark fas fa-bookmark" v-if="isBookmarked"></i>
         <i @click="addBookmarkClicked" class="bookmark far fa-bookmark" v-else></i>
      </template>
      <v-popover v-if="!isSignedIn">
         <i class="disabled bookmark far fa-bookmark trigger"></i>
         <div class="bookmark-popover" slot="popover">
            <div class="popover-title">
               Sign In Required
               <i v-close-popover class="close fas fa-times-circle"></i>
            </div>
            <div class="message">
               <p>You must be signed in to use bookmarks.</p>
               <p>Click <span @click="signInClicked" class="text-button">here</span> sign in.</p>
            </div>
         </div>
      </v-popover>
   </span>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true}
   },
   computed: {
      ...mapState({
         resultsIdx: state => state.selectedResultsIdx,
         pools: state => state.pools.list
      }),
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
        isKiosk: 'system/isKiosk',
        bookmarks: 'user/bookmarks',
        queryObject: 'query/queryObject',
        selectedResults: 'selectedResults',
        poolFilters: 'filters/poolFilter',
      }),
      isBookmarked() {
         let found = false
         this.bookmarks.some( folder => {
            folder.bookmarks.some( item => {
               if (item.pool == this.pool && item.identifier == this.hit.identifier) {
                  found = true
               }
               return found == true
            })
            return found == true
         })
         return found
      }
   },
   methods: {
      signInClicked() {
         let bmData = this.queryObject 
         bmData.hit = this.hit.identifier
         if ( this.hit.groupParent != "") {
            bmData.groupParent =  this.hit.groupParent 
         }
         bmData.numPools = this.pools.length
         bmData.pool = this.pool
         bmData.resultsIdx = this.resultsIdx
         bmData.page = this.selectedResults.page
         bmData.filters = this.poolFilters( this.resultsIdx )
         this.$cookies.set("v4_bookmark", JSON.stringify(bmData), 60)
         this.$router.push("/signin")
      },
      removeBookmarkClicked() {
         if ( this.isSignedIn == false) return

         let bookmarkID = -1
         this.bookmarks.some( folder => {
            folder.bookmarks.some( item => {
               if (item.pool == this.pool && item.identifier == this.hit.identifier) {
                  bookmarkID = item.id
                  this.$store.dispatch("user/removeBookmarks", [bookmarkID])
               }
               return bookmarkID != -1
            })
            return bookmarkID != -1
         })
      },
      addBookmarkClicked() {
         if ( this.isSignedIn == false) return
         let data = {pool: this.pool, data: this.hit}
         this.$store.commit("user/showAddBookmark", data)
      },
   }
};
</script>

<style scoped>
.bookmark-container {
   position: relative;
   display: inline-block;
   box-sizing: border-box;
}
i.bookmark.disabled {
   color: #ccc;
}
i.fas.bookmark {
   color: var(--uvalib-brand-blue-light);
}

i.bookmark {
   color: #444;
   cursor: pointer;
   font-size: 1.4em;
   display: inline-block;
   box-sizing: border-box;
}
i.fas.fa-times-circle.close {
   font-size: 1.1em;
   float:right;
   margin-right: 8px;
}
i.fas.fa-times-circle.close:hover {
   opacity: 1;
   cursor: pointer;
}
.bookmark-popover {
   background: white;
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
   color: var(--uvalib-text);
   font-size: 1em;
   font-weight: normal;
   display: inline-block;
   border-radius: 5px;
   border-bottom: 1px solid var(--uvalib-grey-dark);
}
.bookmark-popover p {
   padding: 3px;
   margin: 0;
}
.bookmark-popover  .message {
   padding: 10px;
   border-left: 1px solid var(--uvalib-grey-dark);
   border-right: 1px solid var(--uvalib-grey-dark);
   text-align: center;
}
.bookmark-popover a {
   color: var(--color-link);
   font-weight: 500;
   text-decoration: none;
   font-weight: bold;
}
.bookmark-popover a:hover {
   text-decoration: underline;
}
.bookmark-popover .popover-title {
   padding: 8px 0 6px 0;
   margin: 0;
   text-align: center;
   background: var(--uvalib-grey-dark);
   color: white;
   font-weight: normal;
   border-radius: 5px 5px 0 0;
}
</style>
