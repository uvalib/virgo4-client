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
         <div class="wrap">
            <img aria-label=" " :src="iiifURL(props.hit)">
            <ImageAdvisory v-if="hasContentAdvisory" />
         </div>
         <div class="metadata-content">
            <div>{{props.hit.header.title}}</div>
         </div>
      </router-link>
   </div>
</template>

<script setup>
import BookmarkButton from "@/components/BookmarkButton.vue"
import ImageAdvisory from "@/components/ImageAdvisory.vue"
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
const hasContentAdvisory = computed(() => {
   let idx = props.hit.fields.findIndex( f=> f.name=="content_advisory")
   return idx > -1
})

function detailClicked() {
   resultStore.hitSelected(props.hit.identifier)
   analytics.trigger('Results', 'DETAILS_CLICKED', props.hit.identifier)
}
function iiifURL(item) {
   let iiifField = item.fields.find( f=>f.name=="iiif_image_url")
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
   justify-items: stretch;
   align-items: stretch;
   position: relative;
   width: fit-content;
   border-radius: 0.3rem;
   border: 1px solid $uva-grey-100;
   &:hover {
      transition: 0.25s ease-in-out;
      box-shadow: 0 0 12px 0 $uva-grey-100;
      z-index: 2;
      text-decoration: none;
   }

   .toolbar {
      padding: 10px 5px 10px 10px;
      background: white;
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      gap: 10px;
      border-bottom: 1px solid $uva-grey-100;
      cursor: default;
      border-radius: 0.3rem 0.3rem 0 0;
   }

   .wrap {
      position: relative;
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
         background-image: url('@/assets/dots.gif');
         background-repeat:no-repeat;
         background-position: center center;
         background-color: $uva-grey-200;
      }
   }

   .metadata-content {
      padding: 10px;
      background: white;
      color: $uva-text-color-base;
      font-weight: normal;
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
      border-top: 1px solid $uva-grey-100;
      border-radius: 0 0 0.3rem 0.3rem;
   }
}

</style>
