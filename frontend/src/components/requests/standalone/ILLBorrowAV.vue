<template>
   <div class="request-panel">
      <h3 v-if="props.prefill==false">ILL Borrow A/V Request</h3>
      <div class="limit-reached" v-if="requestStore.otherRequestsDisabled">
         <div class="message">
            You've reached the active request limit of {{ requestStore.requestStats.otherRequestsLimit }} ILL and/or scan requests at a time.
         </div>
         <VirgoButton severity="secondary" @click="emit('canceled')" label="Cancel"/>
      </div>
      <FormKit v-else type="form" id="borrow-av" :actions="false" @submit="submitClicked" incompleteMessage="Sorry, not all fields are filled out correctly.">
         <FormKit label="Title" type="text" v-model="request.title" validation="required"  id="av-title"
            help="All audio/video materials not owned by UVA will be reviewed for purchase before being requested via ILL."
         />
         <FormKit label="Artist/Composer" type="text" v-model="request.author"/>
         <FormKit label="Year" type="text" v-model="request.year" validation="date_format:YYYY"/>
         <FormKit type="select" label="Format" v-model="request.format"
            :options="['Any', 'CD', 'LP', 'DVD', 'Blu-Ray', 'VHS', 'LD']"
         />
         <FormKit label="Notes or Special Instructions" type="textarea" v-model="request.notes" :rows="2"
            help="(ex: will accept other formats, library-use only okay)"
         />
         <FormKit type="select" label="Preferred pickup location" v-model="request.pickup"
            placeholder="Select a location"
            :options="pickupLibraries" validation="required"/>

         <div v-if="request.pickup == 'LEO' && userStore.leoLocation==''" class="illiad-prompt ra-box ra-fiy">
            It looks like you haven't specified a LEO delivery location yet. Before we can deliver your item, could you please go
            <a href="https://www.library.virginia.edu/services/ils/ill/" target="_blank" aria-describedby="new-window">here</a> and let us know where you would like your item to be delivered.
         </div>
         <V4FormActions :hasCancel="true" submitLabel="Submit" submitID="submit-borrow-av" @canceled="emit('canceled')"/>
      </FormKit>
   </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from "@/stores/user"
import { useRequestStore } from "@/stores/request"
import { usePreferencesStore } from "@/stores/preferences"
import { useItemStore } from "@/stores/item"
import analytics from '@/analytics'
import { setFocusID } from '@/utils'

const props = defineProps({
   prefill: {
      type: Boolean,
      default: false
   },
})
const emit = defineEmits( ['submitted', 'canceled'] )

const preferences = usePreferencesStore()
const userStore = useUserStore()
const itemStore = useItemStore()
const requestStore = useRequestStore()
const request = ref({
   borrowType: "AV",
   title: "",
   author: "",
   year: "",
   format: "Any",
   notes: "",
   pickup: "",
})

const pickupLibraries = computed(()=>{
   let out = {}
   userStore.libraries.forEach(l => {
      out[l.id] = l.name
   })
   return out
})

async function submitClicked() {
   await requestStore.submitILLiadBorrowRequest(request.value)
   emit('submitted', {title: request.value.title, pickup: request.value.pickup})
}

onMounted(()=>{
   request.value.pickup = preferences.pickupLibrary.id
   if ( props.prefill ) {
      analytics.trigger('Requests', 'REQUEST_STARTED', "illiadWorldcatBorrow")
      request.value.title = itemStore.details.header.title
      request.value.author = itemStore.details.header.author.value.join("; ")
      let pubF = itemStore.details.fields.find( f => f.name == "publication_date")
      if (pubF) {
         request.value.year = pubF.value
      }
   } else {
      analytics.trigger('Requests', 'REQUEST_STARTED', "illiadBorrow")
   }
   setFocusID("av-title")
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
   .illiad-prompt {
      margin: 15px;
      a {
         text-decoration: underline !important;
         font-weight: 500;
      }
   }
}
</style>
