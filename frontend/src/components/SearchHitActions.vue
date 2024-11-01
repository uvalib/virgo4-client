<template>
   <div class="icon-wrap">
      <Citations v-if="showCitations" :itemURL="props.hit.itemURL" :from="from"
         :ariaLabel="`citations for ${props.hit.identifier}`">
      </Citations>
      <BookmarkButton :pool="props.pool" :hit="props.hit" :origin="props.from"/>
   </div>
</template>

<script setup>
import BookmarkButton from "@/components/BookmarkButton.vue"
import Citations from "@/components/modals/Citations.vue"
import { computed } from 'vue'
import { useToast } from "primevue/usetoast"

const props = defineProps({
   hit: {
      type: Object,
      required: true
   },
   pool: {
      type: String,
      required: true
   },
   from: {
      type: String,
      default: ""
   },
})

const toast = useToast()

const showCitations = computed(()=>{
   if (props.from.toUpperCase() == 'SEARCH' || props.from.toUpperCase() == 'COLLECTION') {
      return true
   }
   return false
})
</script>

<style lang="scss" scoped>
.icon-wrap {
   display: flex;
   flex-flow: row nowrap;
   margin-left: auto;
   justify-content: flex-end;
   align-items: center;
}
</style>
