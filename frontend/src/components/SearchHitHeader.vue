<template>
   <div class="header-wrapper">
      <div class="titlebar">
         <router-link v-if="hit.grouped==false" :to="detailsURL">
            <div class="full-title">
               <span class="title">{{hit.header.title}}</span>
               <span v-if="hit.header.subtitle" class="subtitle">&nbsp;{{hit.header.subtitle}}</span>
            </div>
         </router-link>
         <div v-else class="full-title">
            <span class="title">{{hit.header.title}}</span>
            <span v-if="hit.header.subtitle" class="subtitle">&nbsp;{{hit.header.subtitle}}</span>
         </div>
         <BookmarkButton :hit="hit" :pool="pool"/>
      </div>
      <div v-if="hit.header.author"  class="author">{{hit.header.author.join(", ")}}</div>
      <div class="main-info">
         <div v-if="hit.header.format" class="info">
            <b>Format:&nbsp;</b>{{hit.header.format.join(", ")}}
         </div>
         <div v-if="hit.header.availability" class="info">
            <b>Availability:&nbsp;</b>{{hit.header.availability.join(", ")}}
         </div>
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
}
.titlebar {
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
   justify-content: space-between;
}
#app div.header-wrapper a {
   color: var(--color-primary-text)
}
#app .basic a:hover {
   text-decoration: none;
   color: var(--color-link)
}
.title {
   font-size: 1.2em;
   font-weight: normal;
   margin-bottom: 3px;
   display: inline-block;
   flex: 1 1 auto;
}
.subtitle {
   display: inline-block;
   font-weight: normal;
}
.main-info {
   margin-left: 10px;
}
.author {
   font-weight: normal;
   margin-left: 10px;
   margin-bottom: 5px;
}
.info {
   font-weight: normal;
}
</style>