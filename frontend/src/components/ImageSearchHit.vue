<template>
   <div class="image-container">
      <div class="toolbar">
         <span class="group-cnt" v-if="hit.grouped">{{hit.count}} images</span>
         <span class="group-cnt" v-else>1 image</span>
         <span class="buttons">
            <AddBookmark v-if="isSignedIn" :data="$utils.toBookmarkData(pool,hit,'SEARCH')" :id="`bm-modal-${hit.identifier}`"/>
            <SignInRequired v-else :data="$utils.toBookmarkData(pool,hit,'SEARCH')" :id="`bm-modal-${hit.identifier}`" act="bookmark"/>
         </span>
      </div>
      <router-link @mousedown="detailClicked" class="img-link" :to="detailsURL">
         <img aria-label=" " :src="iiifURL(hit)">
         <div class="metadata-content">
            <div>{{hit.header.title}}</div>
         </div>
      </router-link>
   </div>
</template>

<script>
import AddBookmark from '@/components/modals/AddBookmark'
import SignInRequired from '@/components/modals/SignInRequired'
import { mapGetters } from "vuex"
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true},
   },
   components: {
      AddBookmark, SignInRequired
   },
   computed: {
      detailsURL() {
         return `/sources/${this.pool}/items/${this.hit.identifier}`
      },
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
      }),
   },
   methods: {
      detailClicked() {
         this.$store.commit("hitSelected", this.hit.identifier)
         this.$analytics.trigger('Results', 'DETAILS_CLICKED', this.hit.identifier)
      },
      iiifURL(item) {
         let iiifField = item.basicFields.find( f=>f.name=="iiif_image_url")
         if (iiifField) {
            let iiif = iiifField.value
            return `${iiif}/square/250,250/0/default.jpg`
         }
         return ""
      },
   }
};
</script>

<style lang="scss" scoped>
.image-container {
   display: grid;
   grid-template-rows: 30px 1fr;
   justify-items: stretch;
   align-items: stretch;
   position: relative;
   width: fit-content;
   box-shadow: $v4-box-shadow-light;

   .toolbar {
      padding: 5px 8px 5px 8px;
      text-align: left;
      background: white;
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      z-index: 1;
      border-bottom: 1px solid var(--uvalib-grey-light);
      cursor: default;

      .group-cnt {
         font-size: 0.8em;
         color: var(--uvalib-text);
      }

      .buttons {
         margin-left: auto;
      }
   }

   .img-link {
      padding:0;

      img {
         max-width: 100%;
         height: auto;
         align-self: center;
         display: block;
         min-width: 175px;
         min-height: 175px;
         background-image: url('~@/assets/dots.gif');
         background-repeat:no-repeat;
         background-position: center center;
      }
   }

   .metadata-content {
      padding: 10px;
      background: white;
      color: var(--uvalib-text);
      font-size: 0.9em;
      font-weight: normal;
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
      border-top: 1px solid var(--uvalib-grey-light);
   }
}

.image-container:hover {
   top: -2px;
   box-shadow: $v4-box-shadow;
}

</style>
