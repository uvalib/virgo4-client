<template>
   <div class="browse-card" :class="{current: props.current, list: props.mode!='gallery'}" :aria-current="props.current.toString()" :id="`browse-${props.data.id}`">
      <template v-if="props.mode=='gallery'">
         <div class="thumb-wrap">
            <span v-if="props.data.status=='ready'" class="vertical-spacer"></span>
            <router-link @click="browseDetailClicked(props.data.id)" :to="`/sources/${props.pool}/items/${props.data.id}`"
               tabindex="-1" :aria-label="`view item titled ${props.data.title}`"
            >
               <template v-if="props.data.status=='ready' || props.data.status=='url'">
                  <img  alt="" class="thumb" v-if="props.data.status=='ready'" :src="props.data.image_base64" />
                  <img  alt="" class="thumb" v-if="props.data.status=='url'" :src="props.data.cover_image_url" />
               </template>
               <span class="no-thumb" v-else>
                  <span class="title" v-html="truncateTitle(props.data.title)"></span>
                  <br/>
                  <span class="no">(No image available)</span>
               </span>
            </router-link>
         </div>
         <div class="details">
            <span class="call">{{props.data.call_number}}</span>
            <router-link @click="browseDetailClicked(props.data.id)" :to="`/sources/${props.pool}/items/${props.data.id}`" class="title">
               {{truncateTitle(props.data.title)}}
            </router-link>
            <span class="year">[{{props.data.published_date}}]</span>
            <span class="loc">{{props.data.location}}</span>
         </div>
         <BookmarkButton :pool="props.pool" :hit="data" origin="SHELF_BROWSE"  @clicked="bookmarkClicked(props.data.id)"/>
      </template>
      <template v-else>
         <div class="list details">
            <span class="index">{{props.index}}.</span>
            <span class="stuff">
               <router-link @click="browseDetailClicked(props.data.id)" :to="`/sources/${props.pool}/items/${props.data.id}`" class="title">
                  {{truncateTitle(props.data.title)}}
               </router-link>
               <span class="year">[{{props.data.published_date}}]</span>
               <span class="callinfo">
                  {{props.data.call_number}}&nbsp;&nbsp;
                  <template v-if="props.data.location">
                     <span class="bar">|&nbsp;&nbsp;</span><span class="list-loc">{{props.data.location}}</span>
                  </template>
               </span>
            </span>
            <BookmarkButton :pool="props.pool" :hit="props.data" origin="SHELF_BROWSE" @clicked="bookmarkClicked(props.data.id)"/>
         </div>
      </template>
   </div>
</template>

<script setup>
import BookmarkButton from "@/components/BookmarkButton.vue"
import analytics from '@/analytics'

const props = defineProps({
   current: {
      type: Boolean,
      required: true
   },
   pool: {
      type: String,
      required: true
   },
   data: {
      type: Object,
      required: true
   },
   mode: {
      type: String,
      default: "gallery"
   },
   index: {
      type: Number,
      default: 0
   }
})


const truncateTitle = (( title ) => {
   if ( title.length <= 100) {
      return title
   }
   let spaceIdx = 100
   let found = false
   while ( !found && spaceIdx >0 ) {
      if ( title[spaceIdx] == ' ') {
         found = true
      } else {
         spaceIdx--
      }
   }
   if ( found) {
      return `${title.substring(0,spaceIdx).trim()}...`
   }
   return title
})

const browseDetailClicked = ((id) => {
   analytics.trigger('ShelfBrowse', 'BROWSE_DETAIL_CLICKED', id)
})

const bookmarkClicked = ((id) => {
   analytics.trigger('ShelfBrowse', 'BROWSE_BOOKMARK_CLICKED', id)
})
</script>

<style lang="scss" scoped>
.browse-card.list {
   margin: 5px !important;
}
.browse-card {
   border: 1px solid $uva-grey;
   padding: 0;
   margin: 0;
   position: relative;
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: stretch;
   font-size: .937em;
   box-sizing: border-box;

   &:hover, &:focus-within, &:focus {
      top: -2px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0,1);
   }

   .thumb-wrap {
      height: 215px;
      text-align: center;
      background: white;
      padding: 10px 5px;
      white-space: nowrap;

      .vertical-spacer {
         display: inline-block;
         height: 100%;
         vertical-align: middle;
      }

      img {
         height: auto;
         align-self: center;
         display: inline-block;
         min-width: 135px;
         max-width: 100%;
         margin: 0 auto;
         max-height: 100%;
         vertical-align: middle;
      }

      .loading {
         height: 100%;
         height: 100%;
         display: block;
         margin: 0 auto;
         background: #f2f2f2;
         border: 1px solid $uva-grey-100;
         background-image: url('@/assets/dots.gif');
         background-repeat:no-repeat;
         background-position: center center;
      }

      .no-thumb {
         height: 100%;
         display: block;
         margin: 0 auto;
         background: white;
         .title {
            background: white;
            opacity: 0.9;
            color: $uva-text-color-base;
            text-align: center;
            padding: 0;
            margin: 0;
            box-sizing: border-box;
            margin: 20px auto 10px auto;
            display: inline-block;
            padding: 10px;
            width: 90%;
            font-weight: 500;
            white-space: normal;
         }
         span.no {
            color: $uva-text-color-base;
            text-decoration: none;
            margin:  0;
            display: inline-block;
         }
      }
   }
   .details.list {
      display: grid;
      text-align: left;
      .callinfo {
         display: block;
         margin-top: 5px;;
      }
   }
   .details {
      background: white;
      padding: 5px 0;
      height: 230px;
      width: 100%;
      text-align: center;

      .call, .loc, .title {
         background: white;
         word-break: break-word;
         -webkit-hyphens: auto;
         -moz-hyphens: auto;
         hyphens: auto;
         max-width: 90%;
         display: block;
         margin: 0 auto;
         font-weight: 500;
      }
      .call {
         background: $uva-grey-200;
         max-width: 100%;
         padding: 10px 0;
         margin-bottom: 20px;
         color: $uva-text-color-dark;

      }
      .loc {
         font-weight: normal;
         margin-top: 15px;
      }
      a.title  {
         font-weight: bold !important;
         margin-bottom: 5px !important;
      }
   }
}

@media only screen and (min-width: 768px) {
   .browse-card.list {
      padding: 20px;
   }
   .details.list {
      grid-template-columns: 50px 1fr 125px;
   }
   .browse-card {
      width: 190px;
   }
}
@media only screen and (max-width: 768px) {
   .browse-card.list {
      padding: 10px;
   }
   .details.list {
      grid-template-columns: 25px 1fr;
      grid-template-rows: max-content 10px;
      grid-row-gap: 15px;
   }
   .browse-card {
      width: 150px;
   }
   .bar {
      display: none;
   }
   .list-loc {
      display: block;
   }
}

.browse-card.current {
   border: 3px solid $uva-brand-blue-100;
}
</style>