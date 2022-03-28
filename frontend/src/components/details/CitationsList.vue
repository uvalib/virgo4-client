<template>
   <span class="citations-list">
      <Citations title="MLA Citation" :id="`citation-mla-${details.identifier}`" style="margin-right: 10px"
         :itemURL="details.itemURL" format="mla" buttonLabel="MLA" from="DETAIL" :iconInline="true"
         :ariaLabel="`show MLA citation for ${details.header.title}`" >
      </Citations>
      <Citations title="APA Citation" :id="`citation-apa-${details.identifier}`" style="margin-right: 10px"
         :itemURL="details.itemURL" format="apa" buttonLabel="APA" from="DETAIL" :iconInline="true"
         :ariaLabel="`show APA citation for ${details.header.title}`" >
      </Citations>
      <Citations title="Chicago Citation" :id="`citation-cms-${details.identifier}`" style="margin-right: 10px"
         :itemURL="details.itemURL" format="cms" buttonLabel="Chicago" from="DETAIL" :iconInline="true"
         :ariaLabel="`show Chicago citation for ${details.header.title}`" >
      </Citations>
      <Citations title="Bluebook Citation" :id="`citation-lbb-${details.identifier}`" style="margin-right: 10px"
         :itemURL="details.itemURL" format="lbb" buttonLabel="Bluebook" from="DETAIL" :iconInline="true"
         :ariaLabel="`show Bluebook citation for ${details.header.title}`" >
      </Citations>
      <V4DownloadButton style="padding-left:0" label="Download RIS" :url="risURL" @click="downloadRISClicked"
         icon="fal fa-download" :iconInline="true"
         :aria-label="`download RIS citation for ${details.header.title}`"
      />
   </span>
</template>

<script setup>
import V4DownloadButton from "@/components/V4DownloadButton.vue"
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

function downloadRISClicked() {
   analytics.trigger('Export', 'RIS_FROM_DETAIL', details.value.identifier)
}
</script>

<style lang="scss" scoped>
</style>
