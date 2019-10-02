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
      <div class="data-image">
         <img v-bind:class="{small: !fullImage}" class="cover-img" v-if="hit.cover_image" :src="hit.cover_image"/>
         <div class="details">
            <div v-if="hit.header.author" class="author">{{hit.header.author.join(", ")}}</div>
            <div class="block">
               <div v-if="hit.header.format" class="info">
                  <b>Format:&nbsp;</b>{{hit.header.format.join(", ")}}
               </div>
               <div v-if="hit.header.availability" class="info">
                  <b>Availability:&nbsp;</b>{{hit.header.availability.join(", ")}}
               </div>
            </div>
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
      },
      fullImage: {
         type: Boolean,
         default: false
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
.cover-img {
   border-radius: 3px;
   margin: 0 5px 0 0;
}
.cover-img.small {
   max-height: 124px;
   max-width: 100px;
}

.data-image {
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
}
.header-wrapper {
   text-align: left;
}
.titlebar {
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
   justify-content: space-between;
   margin-bottom:5px;
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
.block {
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