<template>
   <div class="browse-card" :class="{current: current, list: mode!='gallery'}" :aria-current="current.toString()">
      <i class="current fas fa-caret-down" v-if="current"></i>
      <div class="thumb-wrap" v-if="mode=='gallery'">
         <span v-if="data.status=='ready'" class="vertical-spacer"></span>
         <router-link @click="browseDetailClicked(data.id)" :to="data.id" aria-hidden="true" tabindex="-1">
            <img  alt="" class="thumb" v-if="data.status=='ready'" :src="data.image_base64" />
            <span class="no-thumb" v-else>
               <span class="title" v-html="$utils.truncateTitle(data.title)"></span>
               <br/>
               <span class="no">(No image available)!!!!</span>
            </span>
         </router-link>
      </div>
      <template v-if="mode=='gallery'">
         <div class="details">
            <span class="call">{{data.call_number}}</span>
            <router-link @click="browseDetailClicked(data.id)" :to="data.id" class="title">
               {{$utils.truncateTitle(data.title)}}
            </router-link>
            <span class="year">[{{data.published_date}}]</span>
            <span class="loc">{{data.location}}</span>
         </div>
         <div class="bm-control">
            <AddBookmark v-if="isSignedIn" :data="bookmarkData(data)" :id="`sb-bm-modal-${data.id}`"
               @clicked="bookmarkClicked(data.id)"
            />
            <SignInRequired v-else :data="bookmarkData(data)" :id="`sb-bm-modal-${data.id}`" act="bookmark" />
         </div>
      </template>
      <template v-else>
         <div class="list details">
            <span class="index">{{index}}.</span>
            <span class="stuff">
               <router-link @click="browseDetailClicked(data.id)" :to="data.id" class="title">
                  {{$utils.truncateTitle(data.title)}}
               </router-link>
               <span class="year">[{{data.published_date}}]</span>
               <span class="callinfo">
                  {{data.call_number}}&nbsp;&nbsp;
                  <template v-if="data.location">
                     <span class="bar">|&nbsp;&nbsp;</span><span class="list-loc">{{data.location}}</span>
                  </template>
               </span>
            </span>
            <span class="listbm">
               <AddBookmark v-if="isSignedIn" :data="bookmarkData(data)" :id="`sb-bm-modal-${data.id}`"
                  @clicked="bookmarkClicked(data.id)"
               />
               <SignInRequired v-else :data="bookmarkData(data)" :id="`sb-bm-modal-${data.id}`" act="bookmark" />
            </span>
         </div>
      </template>
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
      },
      mode: {
         type: String,
         default: "gallery"
      },
      index: {
         type: Number,
         default: 0
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
.browse-card.list {
   margin: 5px !important;
}
.browse-card {
   border: 1px solid var(--uvalib-grey);
   box-shadow: $v4-box-shadow-light;
   padding: 0 0 40px 0;
   margin: 5px;
   position: relative;
   display: flex;
   flex-direction: column;
   font-size: .937em;
   text-align: center;
   box-sizing: border-box;
   width: auto;

   &:hover, &:focus-within, &:focus {
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
         border: 1px solid var(--uvalib-grey-light);
         background-image: url('~@/assets/dots.gif');
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
            color: var(--uvalib-text-dark);
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
            color: var(--uvalib-text);
            text-decoration: none;
            margin:  0;
            display: inline-block;
         }
      }
   }
   i.current {
      position: absolute;
      top: -15px;
      width: 100%;
      text-align: center;
   }
   .details.list {
      display: grid;
      text-align: left;
      a.title  {
         margin: initial;
      }
      .callinfo {
         display: block;
         margin-top: 5px;;
      }
      .listbm {
         display: inline-block;
         text-align: right;
      }
   }
   .details {
      background: white;
      padding: 5px 0;
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
      .call {
         background: var(--uvalib-grey-lightest);
         max-width: 100%;
         padding: 10px 0;
         margin-bottom: 20px;
         color: var(--uvalib-text-dark);

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
   .listbm {
      position: absolute;
      right: 10px;
      bottom: 10px;
   }
   .bar {
      display: none;
   }
   .list-loc {
      display: block;
   }
}

.browse-card.current {
   border: 3px solid var(--uvalib-brand-blue-light);
}
</style>