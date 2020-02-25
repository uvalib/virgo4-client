<template>
   <div class="image-container" >
      <div class="toolbar">
         <span class="short-title">
            <TruncatedText trigger="hover" :text="hit.header.title" :limit="20" />
         </span>
         <BookmarkButton :hit="hit" :pool="pool" style="font-size:0.85em;"/>
      </div>
      <router-link class="img-link" :to="detailsURL">
         <v-popover class="metadata-info" trigger="manual" >
            <img class="trigger" :src="iiifURL(hit)">
            <div class="metadata-popover" slot="popover">
               <div class="metadata-content">
                  <div>{{hit.header.title}}</div>
               </div>
            </div>
         </v-popover>
         <div class="group-cnt" v-if="hit.grouped">{{hit.count}} images</div>
      </router-link>
   </div>
</template>

<script>
import BookmarkButton from '@/components/BookmarkButton'
import TruncatedText from '@/components/TruncatedText'
import { mapState } from "vuex"
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true},
      count: {type: Number, required: true}
   },
   components: {
      BookmarkButton, TruncatedText
   },
   computed: {
      detailsURL() {
         return `/sources/${this.pool}/items/${this.hit.identifier}`
      },
      ...mapState({
         searching: state => state.searching,
      }),
   },
   methods: {
      iiifURL(item) {
         let iiifField = item.basicFields.find( f=>f.name=="iiif_base_url")
         let iiif = iiifField.value
         return `${iiif}/square/175,175/0/default.jpg`
      },
   }
};
</script>

<style scoped>
.img-link {
   padding:0;
   background-color: transparent;
   display: inline-block;
}
img {
   border: 0;
   border-top: 1px solid var(--uvalib-grey);
   padding: 0;
   margin: 0 0 -4px 0;
   min-width: 175px;
   min-height: 175px;
   background-color: var(--uvalib-grey-lightest);
   background-image: url('~@/assets/spinner2.gif');
   background-repeat:no-repeat;
   background-position: center center;
}
.image-container {
   position: relative;
   margin:0;
   padding:0;
   border: 1px solid var(--uvalib-grey);
   margin: 3px;
}
.image-container:hover {
   top: -2px;
   box-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
}
.group-cnt {
   position: absolute;
   background: white;
   padding: 2px 8px;
   border-radius: 10px;
   bottom: 8px;
   right: 8px;
   font-size: 0.8em;
   color: var(--uvalib-text);
   border: 1px solid var(--uvalib-grey-dark);
}

.metadata-popover {
   background: white;
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
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
   padding: 5px 5px 2px 5px;
   text-align: left;
   background: white;
   display: flex;
   flex-flow: row nowrap;
   justify-content: space-between;
   align-items: center;
}
.short-title {
   font-size: 0.85em;
   flex-grow: 1;
}
</style>
