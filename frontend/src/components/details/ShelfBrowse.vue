<template>
   <div class="shelf-browse">
      <div class="working" v-if="working">
         <V4Spinner message="Getting shelf browse data..." />
      </div>
      <template v-if="!working && hasBrowseData">
         <h2>Shelf Browse </h2>
         <div class="browse-wrapper">
            <div class="browse-card" v-for="(b,idx) in shelfBrowse" :class="{current: isMiddle(idx)}" :key="`b${b.id}`">
               <i class="current fas fa-caret-down" v-if="isMiddle(idx)"></i>
               <img class="thumb" v-if="b.cover_image_url" :src="b.cover_image_url" />
               <div class="details">
                  <span class="call">{{b.call_number}}</span>
                  <span class="loc">{{b.location}}</span>
                  <a :href="`/items/${b.id}`" class="title">{{b.title}}</a>
                  <span class="title">{{b.published_date}}</span>
               </div>
            </div>
         </div>
      </template>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"

export default {
   props: {
      titleId: String
   },
   computed: {
      ...mapState({
         shelfBrowse : state => state.shelf.browse,
         working: state => state.shelf.lookingUp,
         browseRange: state => state.shelf.browseRange,
      }),
      ...mapGetters({
         hasBrowseData: 'shelf/hasBrowseData',
      }),
   },
   methods: {
      isMiddle(idx) {
         return idx == this.browseRange
      }
   },
   mounted() {
      console.log("GET BROWSE")
      this.$store.dispatch("shelf/getBrowseData", this.titleId )
   }
}
</script>

<style lang="scss" scoped>
.shelf-browse {
   width: 95%;
   margin: 0 auto;

   .working {
      text-align: center;
      margin: 20px 0 30px 0;
      font-size: 0.85em;
   }

   .browse-wrapper {
      padding: 5px 0;
      display: flex;
      flex-flow: row nowrap;
      overflow: hidden;
      justify-content: center;
      .browse-card {
         border: 1px solid var(--uvalib-grey);
         box-shadow: $v4-box-shadow;
         padding: 0;
         border-radius: 5px;
         margin: 5px;
         position: relative;
         display: flex;
         flex-direction: column;
         font-size: .937em;
         text-align: center;

         img {
            height: auto;
            align-self: center;
            display: block;
            min-width:135px;
            max-height: 200px;
            margin: 5px;
            background-image: url('~@/assets/dots.gif');
            background-repeat:no-repeat;
            background-position: center center;
            border-radius: 5px;
            border: 1px solid var(--uvalib-grey);
         }
         i.current {
            position: absolute;
            top: -15px;
            width: 100%;
            text-align: center;
         }
         .details {
            background: white;
            border-top: 1px solid var(--uvalib-grey);
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
   }

   h2 {
      background:  var(--uvalib-blue-alt-light);
      padding: 5px 10px;
      border-top: 2px solid  var(--uvalib-blue-alt);
      border-bottom: 2px solid  var(--uvalib-blue-alt);
      text-align: left;
      font-size: 1.25em;
      margin: 50px 0 30px 0;
   }
}
</style>