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

<script>
import { mapState } from "vuex"
import V4DownloadButton from '@/components/V4DownloadButton'
import Citations from '@/components/modals/Citations'

export default {
   components: {
      V4DownloadButton, Citations
   },
   computed: {
      ...mapState({
         details : state => state.item.details,
         citationsURL: state => state.system.citationsURL,
      }),
      risURL() {
         if (this.citationsURL == "") return ""
         return `${this.citationsURL}/format/ris?item=${encodeURI(this.details.itemURL)}`
      },
   },
   methods: {
      downloadRISClicked() {
         this.$analytics.trigger('Export', 'RIS_FROM_DETAIL', this.details.identifier)
      },
   },
}
</script>

<style lang="scss" scoped>
</style>
