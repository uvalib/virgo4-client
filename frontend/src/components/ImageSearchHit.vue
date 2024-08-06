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
   let allFields = [...props.hit.basicFields.concat(props.hit.detailFields)]
   let idx = allFields.findIndex( f=> f.name=="content_advisory")
   return idx > -1
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
   justify-items: stretch;
   align-items: stretch;
   position: relative;
   width: fit-content;
   border: 1px solid var(--uvalib-grey-light);

   .toolbar {
      padding: 10px 5px 10px 10px;
      background: white;
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      gap: 10px;
      border-bottom: 1px solid var(--uvalib-grey-light);
      cursor: default;
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
      }
   }

   .metadata-content {
      padding: 10px;
      background: white;
      color: var(--uvalib-text);
      font-weight: normal;
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
      border-top: 1px solid var(--uvalib-grey-light);
   }
}

.image-container:hover {
   top: -2px;
   box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
}

</style>
