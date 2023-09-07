<template>
   <div class="image-container">
      <div class="toolbar">
         <span class="group-cnt" v-if="props.hit.grouped">{{props.hit.count}} images</span>
         <span class="group-cnt" v-else>1 image</span>
         <span class="buttons">
            <BookmarkButton :pool="props.pool" :hit="props.hit" origin="SEARCH"/>
         </span>
      </div>
      <router-link @mousedown="detailClicked" class="img-link" :to="detailsURL">
         <img aria-label=" " :src="iiifURL(props.hit)">
         <div class="metadata-content">
            <div>{{props.hit.header.title}}</div>
         </div>
      </router-link>
   </div>
</template>

<script setup>
import BookmarkButton from "@/components/BookmarkButton.vue"
import { computed } from 'vue'
import { useResultStore } from "@/stores/result"
import analytics from '@/analytics'

const props = defineProps({
   hit: { type: Object, required: true},
   pool: {type: String, required: true},
})

const resultStore = useResultStore()

const detailsURL = computed(()=>{
   return `/sources/${props.pool}/items/${props.hit.identifier}`
})

function detailClicked() {
   resultStore.hitSelected(props.hit.identifier)
   analytics.trigger('Results', 'DETAILS_CLICKED', props.hit.identifier)
}
function iiifURL(item) {
   let iiifField = item.basicFields.find( f=>f.name=="iiif_image_url")
   if (iiifField) {
      let iiif = iiifField.value
      return `${iiif}/square/250,250/0/default.jpg`
   }
   return ""
}
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
         background-image: url('/src/assets/dots.gif');
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
