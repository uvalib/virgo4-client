<template>
   <div class="request-panel">
      <h3  v-if="props.prefill==false">ILL Scan Chapter/Article</h3>
      <FormKit type="form" id="scan-article" :actions="false" @submit="submitClicked" incompleteMessage="Sorry, not all fields are filled out correctly.">
         <FormKit type="select" label="What would you like to have scanned?" v-model="request.doctype" id="item-type" validation="required"
            placeholder="Select a document type"
            :options="['Book Chapter', 'Article', 'Law Cite Check']"
         />
         <FormKit label="Book or Journal Title" type="text" v-model="request.title" validation="required" />
         <FormKit label="Chapter or Article Title" type="text" v-model="request.article" validation="required" />
         <FormKit label="Chapter or Article Author" type="text" v-model="request.author" />
         <FormKit label="Volume" type="text" v-model="request.volume"/>
         <FormKit label="Issue" type="text" v-model="request.issue"/>
         <FormKit label="Month" type="text" v-model="request.month"/>
         <FormKit label="Year" type="text" v-model="request.year" placeholder="yyyy" validation="required|date_format:YYYY"/>
         <FormKit label="Pages" type="text" v-model="request.pages" validation="required|length:1,25" help="(ex: 1-15)"/>
         <FormKit label="ISBN/ISSN" type="text" v-model="request.issn"/>
         <FormKit label="OCLC Number" type="text" v-model="request.oclc"/>
         <FormKit label="Notes or Special Instructions" type="textarea" v-model="request.notes" :rows="2"
            help="(ex: missing from shelf, color copies)"
         />
         <ILLCopyrightNotice type="research" :wide="true"/>
         <V4FormActions :hasCancel="true" submitLabel="Submit" submitID="submit-scan-article"  @canceled="emit('canceled')"/>
      </FormKit>
   </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import ILLCopyrightNotice from '../panels/ILLCopyrightNotice.vue'
import { useRequestStore } from "@/stores/request"
import { useItemStore } from "@/stores/item"
import analytics from '@/analytics'
import { setFocusID } from '@/utils'

const props = defineProps({
   prefill: {
      type: Boolean,
      default: false
   },
})
const emit = defineEmits( ['submitted', 'canceled'])

const requestStore = useRequestStore()
const item = useItemStore()

const request = ref({
   scanType: "ARTICLE",
   doctype: "",
   title: "",
   article: "",
   author: "",
   volume: "",
   issue: "",
   month: "",
   year: "",
   pages: "",
   issn: "",
   oclc: "",
   notes: "",
})

async function submitClicked() {
   await requestStore.submitILLiadScanRequest(request.value)
   emit('submitted', {title: request.value.title, pickup: ""})
}

onMounted(()=>{
   if ( props.prefill ) {
      analytics.trigger('Requests', 'REQUEST_STARTED', "illiadWorldcatScan")
      request.value.title = item.details.header.title
      request.value.author = item.details.header.author.value.join("; ")
      let isbnF = item.details.fields.find( f => f.name == "isbn")
      if (isbnF) {
         request.value.issn = isbnF.value.join(", ")
      }
      let pubF = item.details.fields.find( f => f.name == "publication_date")
      if (pubF) {
         request.value.year = pubF.value
      }
   } else {
      analytics.trigger('Requests', 'REQUEST_STARTED', "illiadScan")
   }
   setFocusID("item-type")
})
</script>

<style lang="scss" scoped>
.request-panel {
   .notice {
      margin-top: 25px;
   }
}
</style>
