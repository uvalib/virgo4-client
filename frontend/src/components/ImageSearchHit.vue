<template>
   <div class="image-container">
      <div class="toolbar">
         <span class="short-title">
            <TruncatedText mode="icon" :id="`title-${hit.identifier}`" :text="hit.header.title" :limit="19"
               style="font-weight:bold;" />
         </span>
         <AddBookmark v-if="isSignedIn" :hit="hit" :pool="pool" :id="`bm-modal-${hit.identifier}`"/>
         <SignInRequired v-else  :hit="hit" :id="`bm-modal-${hit.identifier}`" act="bookmark"/>
      </div>
      <router-link @mousedown.native="detailClicked" class="img-link" :to="detailsURL">
          <img aria-label=" " class="trigger" :src="iiifURL(hit)">
          <div class="metadata-popover" slot="popover">
             <div class="metadata-content">
                <div>{{hit.header.title}}</div>
             </div>
          </div>
         <div class="group-cnt" v-if="hit.grouped">{{hit.count}} images</div>
      </router-link>
   </div>
</template>

<script>
import AddBookmark from '@/components/modals/AddBookmark'
import SignInRequired from '@/components/modals/SignInRequired'
import TruncatedText from '@/components/TruncatedText'
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true},
   },
   components: {
      AddBookmark, TruncatedText, SignInRequired
   },
   computed: {
      detailsURL() {
         return `/sources/${this.pool}/items/${this.hit.identifier}`
      },
      ...mapState({
         searching: state => state.searching,
      }),
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
      }),
   },
   methods: {
      detailClicked() {
         this.$store.commit("hitSelected", this.hit.identifier)
         this.$analytics.trigger('Export', 'DETAILS_CLICKED', this.hit.identifier)
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
.img-link {
   padding:0;
   background-color: transparent;
   display: inline-block;
}

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
.image-container {
   display: grid;
   grid-template-rows: 30px 1fr;
   justify-items: stretch;
   align-items: stretch;
   position: relative;
   box-shadow:  $v4-box-shadow-light;
   width: fit-content;
}
.image-container:hover {
   top: -2px;
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0,1);
}
.group-cnt {
   position: absolute;
   background: var(--uvalib-teal-lightest);
   padding: 2px 8px;
   border-radius: 10px;
   bottom: 8px;
   right: 8px;
   font-size: 0.8em;
   color: var(--uvalib-text);
   box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 1.24);
}

.metadata-popover {
   background: white;
   box-shadow: $v4-box-shadow-light;
   color: var(--uvalib-text);
   font-size: 0.9em;
   font-weight: normal;
   display: inline-block;
   border-radius: 5px;
   border: 1px solid var(--uvalib-grey-light);
   max-width: 250px;
}
.metadata-content {
   padding: 10px;
}
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
}
.short-title {
   font-size: 0.85em;
   flex-grow: 1;
}
</style>
