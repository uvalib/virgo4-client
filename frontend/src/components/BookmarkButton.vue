<template>
   <span class="bookmark-container" v-if="isSignedIn && !hit.grouped">
      <i @click="removeBookmarkClicked" class="bookmark fas fa-bookmark" v-if="isBookmarked"></i> 
      <i @click="addBookmarkClicked" class="bookmark far fa-bookmark" v-else></i> 
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
         let author = "" 
         if ( this.hit.header.author ) {
            author = this.hit.header.author.join(", ")
         }
         let data = {pool: this.pool, identifier: this.hit.identifier, 
            title: this.hit.header.title, author: author} 
         this.$store.commit("user/showAddBookmark", data)
      },
   }
};
</script>

<style scoped>
i.fas.bookmark {
   color: var(--color-primary-blue);
   opacity: 1;
}
i.fas.bookmark:hover {
   opacity: 0.7;
}
i.bookmark {
   color: #444; 
   cursor: pointer;
   opacity: 0.6;
   font-size: 1.4em;
}
i.bookmark:hover {
   opacity: 1;
}
</style>