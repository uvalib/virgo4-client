<template>
   <div class="request-panel">
      <h2 v-if="props.prefill==false">ILL Borrow A/V Request</h2>
      <div class="scan pure-form">
         <div class="entry pure-control-group">
            <label for="title">Title<span class="required">*</span></label>
            <input type="text" v-model="request.title" id="title" aria-required="true" required="required">
            <span class="note">All audio/video materials not owned by UVA will be reviewed for purchase before being requested via ILL.</span>
            <span v-if="hasError('title')" class="error">Article or chapter title is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="author">Artist/Composer </label>
            <input type="text" v-model="request.author" id="author">
         </div>
         <div class="entry pure-control-group">
            <label for="year">Year</label>
            <input type="text" v-model="request.year" id="year">
         </div>
         <div class="entry pure-control-group">
            <label for="format">Format</label>
            <select v-model="request.format" id="format">
               <option value="Any">Any</option>
               <option value="CD">CD</option>
               <option value="LP">LP</option>
               <option value="DVD">DVD</option>
               <option value="Blu-Ray">Blu-Ray</option>
               <option value="VHS">VHS</option>
               <option value="LD">LD</option>
            </select>
         </div>
         <div class="entry pure-control-group">
            <label for="date">Need By Date<span class="required">*</span></label>
            <input type="date" v-model="request.date" id="date" aria-required="true" required="required" aria-placeholder="mm/dd/yyyy">
            <span v-if="hasError('date')" class="error">Need by date is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="notes">Notes or Special Instructions</label>
            <textarea id="notes" v-model="request.notes"></textarea>
            <span class="note">(ex: will accept other formats, library-use only okay)</span>
         </div>
         <div class="entry pure-control-group">
            <label for="doctype">Preferred pickup location<span class="required">*</span></label>
            <select v-model="request.pickup" id="pickup">
               <option value="">Select a location</option>
               <option v-for="l in userStore.libraries" :key="l.id" :value="l.id">{{l.name}}</option>
            </select>
            <span v-if="hasError('pickup')" class="error">Pickup location is required</span>
         </div>
      </div>
      <div v-if="request.pickup == 'LEO' && (userStore.noILLiadAccount==true || userStore.leoAddress=='')" class="illiad-prompt ra-box ra-fiy">
         It looks like you haven't specified a LEO delivery location yet. Before we can deliver your item, could you please go
         <a href="https://www.library.virginia.edu/services/ils/ill/" target="_blank">here</a> and let us know where you would like your item to be delivered.
      </div>
      <div class="controls">
         <V4Button mode="tertiary" id="scan-cancel" @click="emit('canceled')">
            Cancel
         </V4Button>
         <V4Button mode="primary" id="scan-ok" @click="submitClicked" :disabled="requestStore.buttonDisabled">
            Submit
         </V4Button>
      </div>
   </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from "@/stores/user"
import { useRequestStore } from "@/stores/request"
import { usePreferencesStore } from "@/stores/preferences"
import { useItemStore } from "@/stores/item"
import analytics from '@/analytics'

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
const required = ['date', 'title', 'pickup']
const errors = ref([])
const request = ref({
   borrowType: "AV",
   date: "",
   title: "",
   author: "",
   year: "",
   format: "Any",
   notes: "",
   pickup: "",
})


async function submitClicked() {
   errors.value.splice(0, errors.value.length)
   for (let [key, value] of Object.entries(request.value)) {
      if ( required.value.includes(key) && value == "") {
         errors.value.push(key)
      }
   }
   let d = new Date(request.value.date).toLocaleDateString("en-US")
   if ( d == "Invalid Date" ){
      errors.value.push('date')
   }
   if (errors.value.length > 0) {
      let tgtID = errors.value[0]
      if (tgtID == "anyLanguage") {
         tgtID = "any-language-yes"
      }
      let first = document.getElementById(tgtID)
      if ( first ) {
         first.focus()
      }
   } else {
      await requestStore.submitILLiadBorrowRequest(request.value)
      emit('submitted', {title: request.value.title, pickup: request.value.pickup})
   }
}
function hasError( val) {
   return errors.value.includes(val)
}

onMounted(()=>{
   request.value.pickup = preferences.pickupLibrary.id
   if ( props.prefill ) {
      analytics.trigger('Requests', 'REQUEST_STARTED', "illiadWorldcatBorrow")
      request.value.title = itemStore.details.header.title
      request.value.author = itemStore.details.header.author.value.join("; ")
      let pubF = itemStore.details.basicFields.find( f => f.name == "publication_date")
      if (pubF) {
         request.value.year = pubF.value
      }
   } else {
      analytics.trigger('Requests', 'REQUEST_STARTED', "illiadBorrow")
   }
})

</script>

<style lang="scss" scoped>
.illiad-prompt {
   margin: 15px;
   a {
      text-decoration: underline !important;
      font-weight: 500;
   }
}
h2 {
   background: var(--uvalib-blue-alt-lightest);
   color: var(--uvalib-text-dark);
   border-width: 1px 0px;
   border-style: solid;
   font-weight: 500;
   padding: 5px;
   border-color: var(--uvalib-blue-alt);
   margin: 0 0 20px 0px;
   font-size: 1.2em;
}
.scan {
   padding: 0 5px;
   margin-bottom: 25px;
   border-bottom: 1px solid var(--uvalib-grey-light);

   button.v4-button.radio {
      margin-right: 15px;
   }
   .required {
      margin-left: 5px;
      font-weight: bold;
      color: var(--uvalib-red-emergency);
   }
   .instruct {
      margin: 0;
      p {
         margin: 5px 0;
      }
      p.addy {
         margin: 10px 25px 20px 25px;
      }
   }
   label {
      font-weight: 500;
      display: block;
   }
   .note {
      font-style: italic;
   }
   input, select, textarea {
      box-sizing: border-box;
      width: 100%;
   }
   .entry {
      margin-bottom: 15px;
   }
   span.error {
      margin: 0px;
      font-weight: normal;
      font-style: italic;
      color: var(--color-error);
      display: block;
   }
}
.controls {
   margin: 10px 10px;
   text-align: right;
}
p.error {
   font-size: 0.9em;
   color: var(--uvalib-red-emergency);
   text-align: center;
   padding: 0;
   margin: 10px;
}
.notice {
   font-size:0.95em;
   padding: 0;
   border: 1px solid var(--uvalib-red-emergency);
   p {
      margin: 10px 15px;
   }
   p.head {
      margin: 0;
      padding: 5px 15px;
      background: var(--uvalib-red-lightest);
      border-bottom: 1px solid var(--uvalib-red-emergency);
   }
}
</style>
