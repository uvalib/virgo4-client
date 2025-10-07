<template>
   <div class="request-panel">
      <h3>Research Scanning Request</h3>
      <div class="limit-reached" v-if="requestStore.otherRequestsDisabled">
         <div class="message">
            You have reached the limit of {{ requestStore.requestStats.otherRequestsLimit }} active borrow and/or scan requests.
         </div>
         <VirgoButton severity="secondary" @click="emit('canceled')" label="Cancel"/>
      </div>
      <FormKit v-else type="form" id="scan-article" :actions="false" @submit="submitClicked" incompleteMessage="Sorry, not all fields are filled out correctly.">
         <div class="instruct" v-if="request.personalCopy=='true'">
            <p>Personal copies can be dropped off at a Library Circulation Desk, deposited in a Book Drop, or sent via campus mail to:</p>
            <p class="addy">
               Instructional Scanning Services<br/>
               PO BOX 400109
            </p>
            <p>
               <b>** Please include a note with instructor name and course information in the item when dropping off a personal copy.</b>
            </p>
         </div>
         <FormKit label="Book or Journal Title" type="text" v-model="request.title" validation="required" id="scan-item-title"/>
         <FormKit label="Chapter or Article Title" type="text" v-model="request.article" validation="required" />
         <FormKit label="Chapter or Article Author" type="text" v-model="request.author" />
         <FormKit label="Volume" type="text" v-model="request.volume"/>
         <FormKit label="Issue" type="text" v-model="request.issue"/>
         <FormKit label="Month" type="text" v-model="request.month"/>
         <FormKit label="Year" type="text" v-model="request.year" placeholder="yyyy" validation="required|date_format:YYYY"/>
         <FormKit label="Pages" type="text" v-model="request.pages" validation="required|length:1,25" help="(ex: 1-15)"/>
         <FormKit label="ISBN/ISSN" type="text" v-model="request.issn"/>
         <FormKit label="OCLC Number" type="text" v-model="request.oclc"/>
         <ILLCopyrightNotice type="research" :wide="true"/>
         <V4FormActions :hasCancel="true" submitLabel="Submit" submitID="submit-research-scan" @canceled="emit('canceled')"/>
      </FormKit>
   </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import ILLCopyrightNotice from '../panels/ILLCopyrightNotice.vue'
import { useRequestStore } from "@/stores/request"
import analytics from '@/analytics'
import { setFocusID } from '@/utils'

const emit = defineEmits( ['submitted', 'canceled'])

const requestStore = useRequestStore()

const request = ref({
   scanType: "ARTICLE",
   personalCopy: "false",
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
   anyLanguage: "false"
})

async function submitClicked() {
   await requestStore.submitILLiadScanRequest(request.value)
   emit('submitted', {title: request.value.title, pickup: ""})
}

onMounted(()=>{
   analytics.trigger('Requests', 'REQUEST_STARTED', "illiadScan")
   setFocusID("scan-item-title")
})
</script>

<style lang="scss" scoped>
.request-panel {
   .limit-reached {
      text-align: right;
      .message {
         font-size: 1em;
         font-weight: bold;
         text-align: center;
         padding: 10px;
         border-radius: 0.3rem;
         color: $uva-text-color-dark;
         background-color: $uva-red-100;
         margin: 0 0 10px 0;
      }
   }
   .notice {
      margin-top: 25px;
   }
}
</style>
