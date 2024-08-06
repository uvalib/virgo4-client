<template>
   <section class="browse-controls">
      <VirgoButton :disabled="!shelfStore.hasPriorItem" @click="browsePrior()" aria-label="browse previous shelf item"
         severity="info" label="Previous"/>
      <VirgoButton :disabled="!shelfStore.hasNextItem" @click="browseNext()"  aria-label="browse next shelf item"
         severity="info" label="Next"/>
   </section>
</template>

<script setup >
import analytics from '@/analytics'
import { useShelfStore } from "@/stores/shelf"

const shelfStore = useShelfStore()

function browseNext() {
   shelfStore.browseNextItem()
   analytics.trigger('ShelfBrowse', 'BROWSE_NEXT_CLICKED')
}
function browsePrior() {
   shelfStore.browsePriorItem()
   analytics.trigger('ShelfBrowse', 'BROWSE_PREV_CLICKED')
}
</script>
<style lang="scss" scoped>
.browse-controls {
   display: flex;
   flex-flow: row nowrap;
   justify-content: space-between;
}
</style>
