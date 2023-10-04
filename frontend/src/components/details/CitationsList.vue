<template>
   <span class="citations-list">
      <Citations title="MLA Citation"
         :itemURL="details.itemURL" format="mla" buttonLabel="MLA" from="DETAIL"
         :ariaLabel="`show MLA citation for ${details.header.title}`" >
      </Citations>
      <Citations title="APA Citation"
         :itemURL="details.itemURL" format="apa" buttonLabel="APA" from="DETAIL"
         :ariaLabel="`show APA citation for ${details.header.title}`" >
      </Citations>
      <Citations title="Chicago Citation"
         :itemURL="details.itemURL" format="cms" buttonLabel="Chicago" from="DETAIL"
         :ariaLabel="`show Chicago citation for ${details.header.title}`" >
      </Citations>
      <Citations title="Bluebook Citation"
         :itemURL="details.itemURL" format="lbb" buttonLabel="Bluebook" from="DETAIL"
         :ariaLabel="`show Bluebook citation for ${details.header.title}`" >
      </Citations>
      <V4Button mode="text" :url="risURL" @click="downloadRISClicked" :aria-label="`download RIS citation for ${details.header.title}`">
         <span>Download RIS</span><i class="ris-icon fal fa-download"></i>
      </V4Button>
   </span>
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
const risURL = computed(()=>{
   if (system.citationsURL == "") return ""
   return `${system.citationsURL}/format/ris?item=${encodeURI(details.value.itemURL)}`
})

const downloadRISClicked = (() => {
   analytics.trigger('Export', 'RIS_FROM_DETAIL', details.value.identifier)
})
</script>

<style lang="scss" scoped>
.citations-list {
   button.v4-button {
      margin-top: 4px;
   }
   .ris-icon {
      margin-left: 10px;
   }
}
</style>
