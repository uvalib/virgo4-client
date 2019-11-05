<template>
   <div class="header-wrapper">
      <div class="full-title">
         <template v-if="hit.grouped || link == false">
            <span class="title">{{hit.header.title}}</span>
            <span v-if="hit.header.subtitle" class="subtitle">&nbsp;{{hit.header.subtitle}}</span>
         </template>
         <router-link v-else :to="detailsURL">
            <span class="title">{{hit.header.title}}</span>
            <span v-if="hit.header.subtitle" class="subtitle">&nbsp;{{hit.header.subtitle}}</span>
         </router-link>
      </div>
      <div class="bm-control">
         <BookmarkButton :hit="hit" :pool="pool"/>
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
      },
      link: {
         type: Boolean,
         default: true
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
}

/* #app div.header-wrapper a {
   color: var(--color-primary-text);
   text-decoration: underline;
} */

#app .basic a:hover {
   text-decoration: none;
   color: var(--color-link)
}

div.bm-control {
   margin-left: auto;
   padding: 5px;
}

.title {
   font-weight: bold;
   display: inline-block;
}
.subtitle {
   display: inline-block;
   font-weight: normal;
}
.full-title {
   font-size: 1.25em;
}
.author {
   font-size: 0.9em;
   font-weight: normal;
   margin-top:4px;
}
</style>
