<template>
   <div class="request-panel">
      <h3 v-if="props.prefill==false">ILL Borrow Item Request</h3>
      <FormKit type="form" id="borrow-item" :actions="false" incompleteMessage="Sorry, not all fields are filled out correctly." @submit="submitClicked">
         <FormKit type="select" label="What would you like to borrow?" v-model="request.doctype" id="item-type" validation="required"
            placeholder="Select an item type"
            :options="['Book', 'Bound Journal Volume', 'Thesis or Dissertation', 'Newspapers', 'Microform', 'Government Document', 'Music Score']"
         />
         <FormKit label="Title" type="text" v-model="request.title" validation="required" help="Please do not abbreviate title"/>
         <FormKit label="Author/Editor" type="text" v-model="request.author"/>
         <FormKit label="Publisher" type="text" v-model="request.publisher"/>
         <FormKit label="Volume" type="text" v-model="request.volume"/>
         <FormKit label="Year" type="text" v-model="request.year" placeholder="yyyy" validation="required|date_format:YYYY"/>
         <FormKit label="Edition" type="text" v-model="request.edition"/>
         <FormKit label="OCLC Number" type="text" v-model="request.oclc"/>
         <FormKit label="ISBN/ISSN" type="text" v-model="request.issn"/>
         <FormKit label="Cited In" type="text" v-model="request.cited"/>
         <FormKit label="Will you accept the item in a language other than English?" type="radio"
            v-model="request.anyLanguage" :options="{'true': 'Yes', 'false': 'No'}"
         />

         <FormKit label="Notes or Special Instructions" type="textarea" v-model="request.notes" :rows="2"
            help="(ex: missing from shelf, specific edition needed)"
         />
         <FormKit type="select" label="Preferred pickup location" v-model="request.pickup"
            placeholder="Select a location"
            :options="pickupLibraries" validation="required"
         />
         <div v-if="request.pickup == 'LEO' && (userStore.hasIlliad==false || userStore.leoLocation=='')" class="illiad-prompt ra-box ra-fiy">
            It looks like you haven't specified a LEO delivery location yet. Before we can deliver your item, could you please go
            <a href="https://www.library.virginia.edu/services/ils/ill/" target="_blank" aria-describedby="new-window">here</a> and let us know where you would like your item to be delivered.
         </div>
         <V4FormActions :hasCancel="true" submitLabel="Submit" submitID="submit-borrow-item"
            :disabled="requestStore.buttonDisabled" @canceled="emit('canceled')"/>
      </FormKit>
   </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import analytics from '@/analytics'
import { useItemStore } from "@/stores/item"
import { useUserStore } from "@/stores/user"
import { usePreferencesStore } from "@/stores/preferences"
import { useRequestStore } from "@/stores/request"
import { setFocusID } from '@/utils'

const props = defineProps({
   prefill: {
      type: Boolean,
      default: false
   },
})
const emit = defineEmits( ['submitted', 'canceled'] )

const item = useItemStore()
const userStore = useUserStore()
const preferences = usePreferencesStore()
const requestStore = useRequestStore()

const pickupLibraries = computed(()=>{
   let out = {}
   userStore.libraries.forEach(l => {
      out[l.id] = l.name
   })
   return out
})

const request = ref({
   borrowType: "ITEM",
   doctype: "",
   title: "",
   author: "",
   publisher: "",
   volume: "",
   year: "",
   edition: "",
   issn: "",
   oclc: "",
   cited: "",
   anyLanguage: "true",
   notes: "",
   pickup: "",
})

const submitClicked = ( async () => {
   await requestStore.submitILLiadBorrowRequest(request.value)
   emit('submitted', {title: request.value.title, pickup: request.value.pickup})
})

onMounted(()=>{
   request.value.pickup = preferences.pickupLibrary.id
   if ( props.prefill ) {
      analytics.trigger('Requests', 'REQUEST_STARTED', "illiadWorldcatBorrow")
      if (item.generalFormat == "Book") {
         request.value.doctype = "Book"
      }
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
      analytics.trigger('Requests', 'REQUEST_STARTED', "illiadBorrow")
   }
   setFocusID("item-type")
})
</script>

<style lang="scss" scoped>
.request-panel {
   .illiad-prompt {
      margin: 15px;
      a {
         text-decoration: underline !important;
         font-weight: 500;
      }
   }
}
</style>
