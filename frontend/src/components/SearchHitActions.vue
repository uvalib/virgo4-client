<template>
   <div class="icon-wrap">
      <Citations :itemURL="props.hit.itemURL" />
      <BookmarkButton :pool="props.pool" :hit="props.hit" />
   </div>
</template>

<script setup>
import BookmarkButton from "@/components/BookmarkButton.vue"
import Citations from "@/components/modals/Citations.vue"

const props = defineProps({
   hit: {
      type: Object,
      required: true
   },
   pool: {
      type: String,
      required: true
   },
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
