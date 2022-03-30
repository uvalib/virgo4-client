<template>
   <section class="browse-controls">
      <V4Button class="pager" mode="primary" @click="browsePrior()" aria-label="browse previous shelf item">
         <i class="prior fal fa-chevron-double-left"></i>Previous
      </V4Button>
      <V4Button class="pager" mode="primary" @click="browseNext()"  aria-label="browse next shelf item">
         Next<i class="next fal fa-chevron-double-right"></i>
      </V4Button>
   </section>
</template>

<script setup >
import analytics from '@/analytics'
import { useShelfStore } from "@/stores/shelf"

const shelfStore = useShelfStore()

function browseNext() {
   shelfStore.browseNext()
   analytics.trigger('ShelfBrowse', 'BROWSE_NEXT_CLICKED')
}
function browsePrior() {
   shelfStore.browsePrior()
   analytics.trigger('ShelfBrowse', 'BROWSE_PREV_CLICKED')
}
</script>
<style lang="scss" scoped>
.browse-controls {
   display: flex;
   flex-flow: row nowrap;
   justify-content: space-between;
   margin: 10px 0px;
   .v4-button.pager {
      margin: 0;
      i.next {
         margin: 0 0 0 8px;
      }
      i.prior {
         margin: 0 8px 0 0;
      }
   }
}
</style>
