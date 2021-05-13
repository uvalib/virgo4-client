<template>
   <span v-if="isKiosk==false" class="bookmark-container">
      <V4Button v-if="isBookmarked" mode="icon" @click="removeBookmarkClicked"
         :id="id"
         role="switch" aria-checked="true"
         :aria-label="`remove bookmark on ${data.title}`"
      >
         <i class="bookmark fas fa-bookmark"></i>
      </V4Button>
      <V4Button v-else mode="icon" @click="addBookmarkClicked"
         :id="id"
         role="switch" aria-checked="false"
         :aria-label="`bookmark ${data.title}`"
      >
         <i class="bookmark fal fa-bookmark"></i>
      </V4Button>
   </span>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   props: {
      // Fields: Pool, ID, Title. Author optional
      data: { type: Object, required: true},
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
               if (item.pool == this.data.pool && item.identifier == this.data.identifier) {
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
               if (item.pool == this.data.pool && item.identifier == this.data.identifier) {
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
      padding:0;
      margin:0;
      &:focus {
         @include be-accessible();
      }
      &:hover {
         color:var(--uvalib-brand-blue-light);
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
