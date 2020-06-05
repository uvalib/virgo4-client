<template>
   <span v-if="isKiosk==false" class="bookmark-container">
      <template v-if="isSignedIn">
         <V4Button v-if="isBookmarked" mode="icon" @click="removeBookmarkClicked" 
            :id="`bookmark-${hit.identifier}`"
            role="switch" aria-checked="true"
            :aria-label="`bookmark ${hit.header.title}`">
            <i class="bookmark fas fa-bookmark"></i>
         </V4Button>
         <V4Button v-else mode="icon" @click="addBookmarkClicked"
            :id="`bookmark-${hit.identifier}`"
            role="switch" aria-checked="false"
            :aria-label="`bookmark ${hit.header.title}`">
            <i class="bookmark far fa-bookmark"></i>
         </V4Button>
      </template>
      <v-popover v-if="!isSignedIn" trigger="manual" :open="isOpen" @hide="hide"  @apply-show="opened">
         <V4Button mode="icon" :aria-pressed="isOpen" @click="toggle" @esc="hide" 
            role="switch" aria-checked="false"
            :aria-label="`bookmark ${hit.header.title}`"
         >
            <i class="disabled bookmark far fa-bookmark trigger"></i>
         </V4Button>
         <div class="bookmark-popover" slot="popover">
            <div class="popover-title">
               Sign In Required
            </div>
            <div class="message">
               <p>You must be signed in to use bookmarks.</p>
               <p>Click
                  <V4Button mode="text" id="link" @click="signInClicked" @esc="hide"
                     aria-label="Sign in to bookmark item" :focusBackOverride="true" @tabback="linkTabbed">
                     here
                  </V4Button>
               to sign in.</p>
            </div>
            <div class="controls">
               <V4Button mode="tertiary" id="signin-close" class="hide" @click="hide" @esc="hide"
                  :focusNextOverride="true" @tabnext="okTabbed" 
                  :focusBackOverride="true" @tabback="okTabbed" >
                  Close
               </V4Button>
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
   data: function() {
      return {
         isOpen: false
      }
   },
   computed: {
      ...mapState({
         resultsIdx: state => state.selectedResultsIdx,
         pools: state => state.pools.list
      }),
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
        isKiosk: 'system/isKiosk',
        bookmarks: 'bookmarks/bookmarks',
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
      okTabbed() {
         document.getElementById("link").focus()
      },
      linkTabbed() {
         document.getElementById("signin-close").focus()
      },
      hide() {
         this.isOpen = false
      },
      toggle() {
         this.isOpen = !this.isOpen
      },
      opened() {
         setTimeout(()=>{
            document.getElementById("link").focus()
         },260);
      },
      signInClicked() {
         this.$store.commit("restore/setBookmarkRecord", this.hit)
         this.$router.push("/signin")
      },
      removeBookmarkClicked() {
         if ( this.isSignedIn == false) return

         let bookmarkID = -1
         this.bookmarks.some( folder => {
            folder.bookmarks.some( item => {
               if (item.pool == this.pool && item.identifier == this.hit.identifier) {
                  bookmarkID = item.id
                  this.$store.dispatch("bookmarks/removeBookmarks", [bookmarkID])
               }
               return bookmarkID != -1
            })
            return bookmarkID != -1
         })
      },
      addBookmarkClicked() {
         if ( this.isSignedIn == false) return
         let data = {pool: this.pool, data: this.hit}
         this.$store.commit("bookmarks/showAddBookmark", data)
      },
   }
};
</script>

<style lang="scss" scoped>
.bookmark-container {
   position: relative;
   display: inline-block;
   box-sizing: border-box;

   i.bookmark {
      color: #444;
      cursor: pointer;
      font-size: 1.4em;
      display: inline-block;
      box-sizing: border-box;
      &:focus {
         @include be-accessible();
      }
   }

   i.bookmark.disabled {
      color: #ccc;
   }

   i.fas.bookmark {
      color: var(--uvalib-brand-blue-light);
   }
}

.bookmark-popover {
   background: white;
   box-shadow: $v4-box-shadow;
   color: var(--uvalib-text);
   font-size: 1em;
   font-weight: normal;
   display: inline-block;
   border-radius: 5px;
   border-bottom: 1px solid var(--uvalib-grey-dark);

   p {
      padding: 3px;
      margin: 0;
   }
   .message {
      padding: 10px;
      border-left: 1px solid var(--uvalib-grey-dark);
      border-right: 1px solid var(--uvalib-grey-dark);
      text-align: center;
   }
   .popover-title {
      padding: 8px 0 6px 0;
      margin: 0;
      text-align: center;
      background: var(--uvalib-grey-dark);
      color: white;
      font-weight: normal;
      border-radius: 5px 5px 0 0;
   }
   .controls {
      font-size: 0.8em;
      text-align: right;
      padding: 0 5px;
      border-left: 1px solid var(--uvalib-grey-dark);
      border-right: 1px solid var(--uvalib-grey-dark);
   }
}
</style>
