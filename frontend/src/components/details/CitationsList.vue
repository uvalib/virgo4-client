<template>
   <ul class="citations-list">
      <li>
         <Citations title="MLA Citation"
            :itemURL="details.itemURL" format="mla" buttonLabel="MLA" from="DETAIL"
            :ariaLabel="`show MLA citation for ${details.header.title}`"/>
      </li>
      <li>
         <Citations title="APA Citation"
            :itemURL="details.itemURL" format="apa" buttonLabel="APA" from="DETAIL"
            :ariaLabel="`show APA citation for ${details.header.title}`"/>
      </li>
      <li>
         <Citations title="Chicago Citation"
            :itemURL="details.itemURL" format="cms" buttonLabel="Chicago" from="DETAIL"
            :ariaLabel="`show Chicago citation for ${details.header.title}`"/>
      </li>
      <li>
         <Citations title="Bluebook Citation"
            :itemURL="details.itemURL" format="lbb" buttonLabel="Bluebook" from="DETAIL"
            :ariaLabel="`show Bluebook citation for ${details.header.title}`"/>
      </li>
      <li>
         <VirgoButton text rounded @click="downloadRISClicked" :aria-label="`download RIS citation for ${details.header.title}`">
            <span>Download RIS</span><i class="fal fa-download"></i>
         </VirgoButton>
      </li>
   </ul>
</template>

<script setup>
import Citations from "@/components/modals/Citations.vue"
import { useItemStore } from "@/stores/item"
import { useSystemStore } from "@/stores/system"
import analytics from '@/analytics'
import { computed } from 'vue'

const item = useItemStore()
const system = useSystemStore()

const details = computed(()=>{
   return item.details
})

const downloadRISClicked = (() => {
   analytics.trigger('Export', 'RIS_FROM_DETAIL', details.value.identifier)
   window.location.href = `${system.citationsURL}/format/ris?item=${encodeURI(details.value.itemURL)}`
})
</script>

<style lang="scss" scoped>
.citations-list {
   padding: 0;
   margin: 0;
   position: relative;
   left: -17px;
   top: -5px;
   li {
      list-style: none;
      padding: 0;
   }
}
</style>
