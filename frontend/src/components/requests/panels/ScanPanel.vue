<template>
   <div class="request-scan">
      <h2>Scan Request</h2>
      <FormKit type="form" id="scan-request" :actions="false" @submit="submit">
         <FormKit v-if="itemOptions.length > 1" type="select" label="Select the item you want"
            v-model="selectedItem" placeholder="Select an item" @input="itemSelected"
            :validation-messages="{required: 'Item selection is required.'}"
            :options="itemOptions" validation="required" id="scan-select"
         />
         <FormKit type="select" label="Scan purpose" id="scan-use"
            v-model="scan.type"  :options="{'Article': 'Research', 'Collab': 'Instruction'}"
         />
         <div class="scan-use-note" v-if="scan.type == 'Article'">
            Use this form to request a scan for your coursework or personal academic research.
         </div>
         <div v-else class="scan-use-note" >
            <b>For instructors only: </b>
            <span>Use this form to request a scan for distribution to your students through a course management system (Collab, Canvas, etc).</span>
         </div>
         <FormKit label="Book or Journal Title" type="text" v-model="scan.title" validation="required"/>
         <FormKit label="Chapter or Article Title" type="text" v-model="scan.chapter" validation="required"/>
         <FormKit label="Chapter or Article Author" type="text" v-model="scan.author" validation="required"/>
         <FormKit label="Year" type="text" v-model="scan.year" placeholder="yyyy" validation="required|date_format:YYYY"/>
         <FormKit label="Volume" type="text" v-model="scan.volume"/>
         <FormKit label="Issue" type="text" v-model="scan.issue"/>
         <FormKit label="Pages" type="text" v-model="scan.pages" validation="required|length:1,25" help="(ex: 1-15)"/>
         <FormKit v-if="scan.type=='Article'" label="Notes" type="textarea" v-model="scan.notes" :rows="2"/>
         <FormKit v-else label="Course Information" type="textarea" v-model="scan.notes" :rows="2" validation="required"/>
         <ILLCopyrightNotice :type="scan.type === 'Article' ? 'research' : 'instruction'" />
         <V4FormActions :hasCancel="false" submitLabel="Submit Request" submitID="submit-scan" :disabled="requestStore.buttonDisabled" />
      </FormKit>
   </div>
</template>

<script setup>
import ILLCopyrightNotice from '../ILLCopyrightNotice.vue';
import { ref, onMounted, computed } from "vue"
import { useRequestStore } from "@/stores/request"
import { useItemStore } from "@/stores/item"
import analytics from '@/analytics'

const requestStore = useRequestStore()
const itemStore = useItemStore()

const selectedItem = ref(null)
const scan = ref({
   label: '',
   barcode: '',
   issn: '',
   type: 'Article',
   title: '',
   chapter: '',
   author: '',
   volume: '',
   issue: '',
   year: '',
   pages: '',
   notes: '',
   library: '',
   location: '',
   callNumber: '',
})

const itemOptions = computed(() => {
   let out = []
   requestStore.activeOption.item_options.forEach( i => {
      out.push( {label: i.label, value: i })
   })
   return out
})

onMounted(()=>{
   analytics.trigger('Requests', 'REQUEST_STARTED', "scan")
   if (itemOptions.value.length == 1) {
      selectedItem.value = itemOptions.value[0].value
      itemSelected()
   }

   if (itemOptions.value.length == 1) {
      let ele = document.getElementById("scan-use")
      if ( ele ) {
         ele.focus()
      }
   } else {
      let ele = document.getElementById("scan-select")
      if ( ele ) {
         ele.focus()
      }
   }

   scan.value.title = itemStore.details.header.title
   if (itemStore.details.header.author) {
      scan.value.author = itemStore.details.header.author.value.join(itemStore.details.header.author.separator)
   } else {
      scan.value.author = "Unknown"
   }
   let isbn = itemStore.details.detailFields.find( f=>f.name=="isbn")
   if (isbn) {
      scan.value.issn = isbn.value.find( i => i.length == 13)
      if (scan.value.issn == "") {
         scan.value.issn = isbn.value[0]
      }
   }

   let pubDate = itemStore.details.basicFields.find( f=>f.name=="published_date")
   if (pubDate) {
      scan.value.year = pubDate.value
   }
})

function itemSelected() {
   scan.value.label = selectedItem.value.label
   scan.value.barcode = selectedItem.value.barcode
   scan.value.library = selectedItem.value.library
   scan.value.location = selectedItem.value.location_id
   scan.value.callNumber = selectedItem.value.label
}

function submit() {
   requestStore.submitScan( scan.value )
}
</script>

<style lang="scss" scoped>
.request-scan {
   text-align: left;
   width: 50%;
   color: var(--uvalib-text);
   margin: 0 auto;
   .scan-use-note {
      padding:5px 0 10px 0;
      margin-bottom: 10px 0 15px 0;
      font-size: 0.85em;
      border-bottom: 1px solid var(--uvalib-grey-light);
   }
   .notice {
      margin-top: 25px;
   }
}
@media only screen and (max-width: 768px) {
   .request-scan {
      width: 95%;
   }
}
</style>
