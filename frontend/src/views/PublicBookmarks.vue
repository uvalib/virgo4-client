<template>
   <div class="public-bookmarks">
      <h1>Public Bookmarks</h1>
      <div class="bookmarks-content">
         <div class="working" v-if="searching">
            <V4Spinner message="Looking up bookmark information..."/>
         </div>
         <div v-else>
            <dl class="bookmark">
               <template v-for="(bookmark,idx) in bookmarks">
                  <dt :key="getKey(idx,'t')"><router-link :to="detailsURL(bookmark)">{{bookmark.details.title}}</router-link></dt>
                  <dd :key="getKey(idx,'tv')" >
                     <div class="author">
                        {{bookmark.details.author}}
                     </div>
                      <dl class="data">
                         <dt>Call Number:</dt>
                         <dd>{{bookmark.details.callNumber}}</dd>
                         <dt>Library:</dt>
                         <dd>{{bookmark.details.library}}</dd>
                         <dt>Location:</dt>
                         <dd>{{bookmark.details.location}}</dd>
                      </dl>
                  </dd>
               </template>
            </dl>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import V4Spinner from "@/components/V4Spinner"
export default {
   name: "public-bookmarks",
   components: {
      V4Spinner,
   },
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
      getKey(idx,keyPrefix) {
         return keyPrefix+idx
      },
      detailsURL(bookmark) {
         return `/sources/${bookmark.pool}/items/${bookmark.identifier}`
      },
   }
}
</script>

<style scoped>
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
   font-size: 0.9em;
   margin: 0 0 20px 0;
   display: inline-grid;
   grid-template-columns: max-content 2fr;
   grid-column-gap: 15px;
}
dl.data dt {
   font-weight: bold;
   text-align: right;
}

</style>