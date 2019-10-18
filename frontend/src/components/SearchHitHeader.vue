<template>
   <div class="header-wrapper">
      <BookmarkButton :hit="hit" :pool="pool"/>
      <div class="full-title">
         <template v-if="hit.grouped">
            <span class="title">XX {{hit.header.title}}</span>
            <span v-if="hit.header.subtitle" class="subtitle">&nbsp;{{hit.header.subtitle}}</span>
         </template>
         <router-link v-else :to="detailsURL">
            <span class="title">{{hit.header.title}}</span>
            <span v-if="hit.header.subtitle" class="subtitle">&nbsp;{{hit.header.subtitle}}</span>
         </router-link>
        
         <div v-if="hit.header.author" class="author">{{hit.header.author.join(", ")}}</div>
      </div>
   </div>
</template>

<script>
import BookmarkButton from '@/components/BookmarkButton'
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
      BookmarkButton
   },
   computed: {
      detailsURL() {
         return `/sources/${this.pool}/items/${this.hit.identifier}`
      },
   },
}
</script>

<style scoped>
.header-wrapper {
   text-align: left;
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
   margin-bottom: 10px;
}
#app div.header-wrapper a {
   color: var(--color-primary-text)
}
#app .basic a:hover {
   text-decoration: none;
   color: var(--color-link)
}
.full-title {
   margin-left: 15px;
   font-size: 1.25em;
}
.author {
   font-size: 0.9em;
   font-weight: normal;
   margin-top:4px;
}
</style>