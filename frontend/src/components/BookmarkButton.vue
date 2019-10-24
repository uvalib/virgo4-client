<template>
   <span class="bookmark-container" v-if="!hit.grouped">
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
               <p>Click <router-link to="/signin">here</router-link> sign in.</p>
            </div>
         </div>
      </v-popover>
   </span>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true}
   },
   computed: {
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
        bookmarks: 'user/bookmarks'
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
      removeBookmarkClicked() {
         if ( this.isSignedIn == false) return

         let bookmarkID = -1
         this.bookmarks.some( folder => {
            folder.bookmarks.some( item => { 
               if (item.pool == this.pool && item.identifier == this.hit.identifier) {
                  bookmarkID = item.id
                  this.$store.dispatch("user/removeBookmark", bookmarkID)
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
   color: var(--color-primary-blue);
}

i.bookmark {
   color: #444; 
   cursor: pointer;
   font-size: 1.4em;
   display: inline-block;
   box-sizing: border-box;
}
i.fas.fa-times-circle.close {
   opacity: 0.8;
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
   box-shadow: 1px 1px 15px #333;
   color: var(--color-primary-text);
   font-size: 1em;
   font-weight: normal;
   display: inline-block;
   border-radius: 5px;
   border-bottom: 5px solid var(--color-primary-orange);
}
.bookmark-popover p {
   font-size: 0.9em;
   padding: 3px;
   margin: 0;
}
.bookmark-popover  .message {
   padding: 10px;
   border-left: 4px solid var(--color-primary-orange);
   border-right: 4px solid var(--color-primary-orange);
   text-align: center;
}
.bookmark-popover a {
   color: var(--color-link);
   font-weight: 500;
   text-decoration: none !important;
   font-weight: bold;
}
.bookmark-popover a {
   text-decoration: underline;
}
.bookmark-popover .popover-title {
   padding: 8px 0 6px 0;
   margin: 0;
   text-align: center;
   background: var(--color-primary-orange);
   color: white;
   font-weight: normal;
   border-radius: 5px 5px 0 0;
}
</style>