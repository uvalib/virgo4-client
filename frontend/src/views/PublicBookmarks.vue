<template>
   <div class="public-bookmarks">
      <h1>Public Bookmarks</h1>
      <div class="bookmarks-content">
         <div class="working" v-if="searching">
            <V4Spinner message="Looking up bookmark information..."/>
         </div>
         <div v-else>
            <ul class="bookmarks">
               <template v-for="(bookmark,idx) in bookmarks">
                  <li class="bookmark-wrapper" :key="`BM${idx}`">
                     <div class="title">
                        <router-link @click.native="bookmarkFollowed(bookmark.identifier)"  :to="detailsURL(bookmark)">{{bookmark.details.title}}</router-link>
                     </div>
                     <div class="info">
                        <div class="author">{{bookmark.details.author}}</div>
                     </div>
                  </li>
               </template>
            </ul>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
export default {
   name: "public-bookmarks",
   computed: {
      ...mapState({
         searching: state => state.bookmarks.searching,
         bookmarks: state => state.bookmarks.public,
      }),
   },
   created() {
      this.$store.dispatch("bookmarks/getPublicBookmarks", this.$route.params.key)
   },
   methods: {
      bookmarkFollowed(identifier) {
         this.$analytics.trigger('Bookmarks', 'FOLLOW_PUBLIC_BOOKMARK', identifier)
      },
      detailsURL(bookmark) {
         return `/sources/${bookmark.pool}/items/${bookmark.identifier}`
      },
   }
}
</script>

<style lang="scss" scoped>
.public-bookmarks {
   min-height: 400px;
   position: relative;
   margin: 2vw auto 6vw;
   color: var(--uvalib-text);
}
.bookmarks-content {
   margin: 0 auto;
   text-align: left;
}
.working {
   text-align: center;
   font-size: 1.25em;
}
h2 {
   text-align: center;
}
@media only screen and (min-width: 768px) {
   .public-bookmarks {
     max-width: 55vw;
   }
}
@media only screen and (max-width: 768px) {
   .public-bookmarks {
     max-width: 95vw;
   }
}
div.author {
   margin-bottom: 10px;
}
dl.data {
   margin: 0 0 20px 0;
   display: inline-grid;
   grid-template-columns: max-content 2fr;
   grid-column-gap: 15px;
   grid-row-gap: 5px;
}
dl.data dt {
   font-weight: bold;
   text-align: right;
}
div.info {
   margin-left: 40px;
}
div.title {
   font-size: 1.2em;
   padding-bottom:5px;
}
ul.bookmarks {
   list-style: none;
   padding: 0;
}
.bookmark-wrapper {
   margin: 10px;
   border: 1px solid var(--uvalib-grey-light);
   padding: 10px;
   box-shadow:  $v4-box-shadow-light;
   border-radius:3px;
}
</style>