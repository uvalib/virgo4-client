<template>
   <span v-if="isKiosk==false" class="bookmark-container">
      <V4Button v-if="isBookmarked" mode="icon" @click="removeBookmarkClicked" 
         :id="id"
         role="switch" aria-checked="true"
         :aria-label="`bookmark ${hit.header.title}`"
      >
         <i class="bookmark fas fa-bookmark"></i>
      </V4Button>
      <V4Button v-else mode="icon" @click="addBookmarkClicked"
         :id="id"
         role="switch" aria-checked="false"
         :aria-label="`bookmark ${hit.header.title}`"
      >
         <i class="bookmark far fa-bookmark"></i>
      </V4Button>
   </span>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true},
      id:  {type: String, required: true},
   },
   computed: {
      ...mapGetters({
         isKiosk: 'system/isKiosk',
         bookmarks: 'bookmarks/bookmarks',
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
                  this.$analytics.trigger('Bookmarks', 'REMOVE_BOOKMARK', item.identifier)   
                  this.$store.dispatch("bookmarks/removeBookmarks", [bookmarkID])
               }
               return bookmarkID != -1
            })
            return bookmarkID != -1
         })
      },
      addBookmarkClicked() {
         let data = {pool: this.pool, data: this.hit}
         this.$store.commit("bookmarks/setNewBookmark", data)
         this.$emit('clicked')
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
</style>
