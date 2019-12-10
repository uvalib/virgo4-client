<template>
   <div class="header-wrapper">
      <div class="full-title">
         <span v-if="count>0" class="count">{{count}}.</span>
         <template v-if="link == false">
            <span class="hit-title">{{hit.header.title}}</span>
            <span v-if="hit.header.subtitle" class="hit-subtitle">{{hit.header.subtitle}}</span>
         </template>
         <router-link v-else :to="detailsURL">
            <span class="hit-title">{{hit.header.title}}</span>
            <span v-if="hit.header.subtitle" class="hit-subtitle">{{hit.header.subtitle}}</span>
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
      },
      count: {
         type: Number,
         default: -1
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

#app .basic a:hover {
   text-decoration: none;
   color: var(--color-link)
}

div.bm-control {
   margin-left: auto;
   padding: 5px;
}

.hit-title {
   font-weight: bold;
   display: inline-block;
   margin-right: 5px;
}
.hit-subtitle {
   display: inline-block;
   font-weight: normal;
}
.full-title {
   font-size: 1.25em;
   display:flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
}
.author {
   font-size: 0.9em;
   font-weight: normal;
   margin-top:4px;
}
.count {
   display: inline-block;
   font-size: 0.7em;
   color: #888;
   margin-right: 5px;
}
</style>
