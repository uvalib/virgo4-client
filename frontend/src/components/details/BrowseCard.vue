<template>
   <div class="browse-card" :class="{current: current}">
      <i class="current fas fa-caret-down" v-if="current"></i>
      <div class="thumb-wrap">
         <a @click="browseDetailClicked(data.id)" :href="`/items/${data.id}`" aria-hidden="true" tabindex="-1">
            <img  alt="" class="thumb" v-if="data.status=='ready'" :src="data.image_base64" />
            <span class="no-thumb" :class="data.placeholder_class" v-else>
               <span class="title">{{data.title}}</span>
            </span>
         </a>
      </div>
      <div class="details">
         <span class="call">{{data.call_number}}</span>
         <span class="loc">{{data.location}}</span>
         <a @click="browseDetailClicked(data.id)" :href="`/items/${data.id}`" class="title">{{data.title}}</a>
         <span class="title">{{data.published_date}}</span>
      </div>
      <div class="bm-control">
         <AddBookmark v-if="isSignedIn" :data="bookmarkData(data)" :id="`bm-modal-${data.id}`"
            @clicked="bookmarkClicked(data.id)"
         />
         <SignInRequired v-else :data="bookmarkData(data)" :id="`bm-modal-${data.id}`" act="bookmark" />
      </div>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import AddBookmark from '@/components/modals/AddBookmark'
import SignInRequired from '@/components/modals/SignInRequired'

export default {
   components: {
      AddBookmark, SignInRequired
   },
   props: {
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
      }
   },
   computed: {
      ...mapGetters({
         isSignedIn: 'user/isSignedIn',
      }),
   },
   methods: {
      bookmarkData( item ) {
         return {pool: this.pool, identifier: item.id, title: item.title, origin: "SHELF_BROWSE" }
      },
      browseDetailClicked(id) {
         this.$analytics.trigger('ShelfBrowse', 'BROWSE_DETAIL_CLICKED', id)
      },
      bookmarkClicked(id) {
         this.$analytics.trigger('ShelfBrowse', 'BROWSE_BOOKMARK_CLICKED', id)
      },
   }
}
</script>

<style lang="scss" scoped>
.browse-card {
   border: 1px solid var(--uvalib-grey);
   box-shadow: $v4-box-shadow-light;
   padding: 0 0 30px 0;
   margin: 5px;
   position: relative;
   display: flex;
   flex-direction: column;
   font-size: .937em;
   text-align: center;
   box-sizing: border-box;
   width: auto;

   &:hover {
      top: -2px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0,1);
   }

   .bm-control {
      position: absolute;
      bottom: 5px;
      right: 5px;
      height: 25px;
   }

   .thumb-wrap {
      height: 215px;
      text-align: center;
      background: white;
      padding: 10px 5px;

      .loading {
         height: 100%;
         height: 100%;
         display: block;
         margin: 0 auto;
         background: #f2f2f2;
         border: 1px solid var(--uvalib-grey-light);
         background-image: url('~@/assets/dots.gif');
         background-repeat:no-repeat;
         background-position: center center;
      }

      .no-thumb {
         height: 100%;
         height: 100%;
         display: block;
         margin: 0 auto;
         background: var(--uvalib-teal-dark);
         .title {
            background: var( --uvalib-grey-lightest);
            opacity: 0.9;
            color: var(--uvalib-text);
            text-align: center;
            padding: 0;
            margin: 0;
            box-sizing: border-box;
            margin: 10px auto;
            display: inline-block;
            padding: 10px;
            width: 90%;
            font-weight: 500;
         }
      }

      .no-thumb.cover0 {
         background: var(--uvalib-brand-orange-dark);
      }
      .no-thumb.cover1 {
         background: var(--uvalib-blue-alt-dark);
      }
      .no-thumb.cover2 {
         background: var(--uvalib-blue-alt-darkest);
      }
      .no-thumb.cover3 {
         background: var(--uvalib-green-dark);
      }
      .no-thumb.cover4 {
         background: var(--uvalib-red-darker);
      }
      .no-thumb.cover5 {
         background: var(--uvalib-grey-dark);
      }
      .no-thumb.cover6 {
         background: var(--uvalib-yellow-dark);
      }
      .no-thumb.cover7 {
         background: var(--uvalib-brand-blue-light);
      }
      .no-thumb.cover8 {
         background: var(--uvalib-blue-alt);
      }
      .no-thumb.cover9 {
         background: var(--uvalib-teal-dark);
      }

      img {
         height: auto;
         align-self: center;
         display: block;
         min-width: 135px;
         margin: 0 auto;
         max-height: 210px;
      }
   }
   i.current {
      position: absolute;
      top: -15px;
      width: 100%;
      text-align: center;
   }
   .details {
      background: white;
      border-top: 3px solid var(--uvalib-grey-light);
      border-radius: 0 0 5px 5px;
      padding: 5px 0;
   }
   .call, .loc, .title {
      background: white;
      word-break: break-word;
      -webkit-hyphens: auto;
      -moz-hyphens: auto;
      hyphens: auto;
      max-width: 95%;
      display: block;
      margin: 0 auto;
      font-weight: 500;
   }
   .loc {
      font-weight: normal;
   }
   .title  {
      margin-top:5px;
   }
}

.browse-card.current {
   border: 3px solid var(--uvalib-brand-blue-light);
}
</style>