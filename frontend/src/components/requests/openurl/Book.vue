<template>
   <div class="request-wrap">
      <div class="request-content pure-form">
         <div class="entry pure-control-group">
            <label for="title">Title<span class="required">*</span></label>
            <input type="text" v-model="request.openurl.title" id="title" aria-required="true" required="required">
            <span class="note">Please do not abbreviate title</span>
            <span v-if="hasError('title')" class="error">Title is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="author">Author/Editor</label>
            <input type="text" v-model="request.openurl.author" id="author">
         </div>
         <div class="entry pure-control-group">
            <label for="publisher">Publisher</label>
            <input type="text" v-model="request.openurl.publisher" id="publisher">
         </div>
         <div class="entry pure-control-group">
            <label for="volume">Volume</label>
            <input type="text" v-model="request.openurl.volume" id="volume">
         </div>
         <div class="entry pure-control-group">
            <label for="year">Year<span class="required">*</span></label>
            <input type="text" v-model="request.openurl.year" id="year" aria-required="true" required="required">
            <span v-if="hasError('year')" class="error">Year is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="edition">Edition</label>
            <input type="text" v-model="request.openurl.edition" id="edition">
         </div>
         <div class="entry pure-control-group">
            <label for="issn">ISSN/ISBN</label>
            <input type="text" v-model="request.openurl.issn" id="issn">
         </div>
         <div class="entry pure-control-group">
            <label for="oclc">OCLC Number</label>
            <input type="text" v-model="request.openurl.oclc" id="oclc">
         </div>
         <div class="entry pure-control-group">
            <label for="bydate">Need By Date<span class="required">*</span></label>
            <input type="text" v-model="request.openurl.bydate" id="bydate">
            <span v-if="hasError('bydate')" class="error">Need By Date is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="citedin">Cited In</label>
            <textarea id="citedin" v-model="request.openurl.citedin"></textarea>
         </div>
         <div role="radiogroup" class="entry pure-control-group" aria-labelledby="language-label">
            <label id="language-label">
               Will you accept the item in a language other than English?
            </label>
            <V4Button id="any-language-yes" class="radio" mode="icon"
               @click="request.openurl.anylanguage='true'"
               role="radio"
               :aria-checked="(request.openurl.anylanguage=='true').toString()">
               <i v-if="request.openurl.anylanguage=='true'" class="check fas fa-check-circle"></i>
               <i v-else class="check far fa-circle"></i>
               Yes
            </V4Button>
            <V4Button class="radio" mode="icon"
               @click="request.openurl.anylanguage='false'"
               role="radio"
               :aria-checked="(request.openurl.anylanguage=='false').toString()">
               <i v-if="request.openurl.anylanguage=='false'" class="check fas fa-check-circle"></i>
               <i v-else class="check far fa-circle"></i>
               No
            </V4Button>
            <span class="note">If yes, specify acceptable languages in the notes field.</span>
         </div>
         <div class="entry pure-control-group">
            <label for="notes">Notes or Special Instructions</label>
            <textarea id="notes" v-model="request.openurl.notes"></textarea>
            <span class="note">(ex: special edition)</span>
         </div>
         <div class="entry pure-control-group">
            <label for="doctype">Preferred pickup location</label>
            <select v-model="request.openurl.pickup" id="pickup">
               <option value="">Select a location</option>
               <option v-for="l in user.libraries" :key="l.id" :value="l.id">{{l.name}}</option>
            </select>
         </div>
      </div>
      <div class="controls">
         <V4Button mode="tertiary" @click="emit('canceled')">
            Cancel
         </V4Button>
         <V4Button mode="primary" @click="submitClicked" :disabled="request.buttonDisabled">
            Submit
         </V4Button>
      </div>
   </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"
import { usePreferencesStore } from "@/stores/preferences"

const emit = defineEmits( ['submitted', 'canceled'] )

const request = useRequestStore()
const user = useUserStore()
const preferences = usePreferencesStore()

const required = ['title', 'year', 'bydate']
const errors = ref([])

onMounted(()=>{
   setTimeout(() => {
      request.openurl.pickup = preferences.pickupLibrary
      document.getElementById("title").focus()
   }, 150)
})

function hasError(val) {
   return errors.value.includes(val)
}
function submitClicked() {
   errors.value.splice(0, errors.value.length)
   for (let [key, value] of Object.entries(request.openurl)) {
      if ( required.includes(key) && value == "") {
         errors.value.push(key)
      }
   }

   if (errors.value.length > 0) {
      console.error(errors.value)
      let tgtID = errors.value[0]
      let first = document.getElementById(tgtID)
      if ( first ) {
         first.focus()
      }
   } else {
      emit("submitted")
   }
}
</script>
<style lang="scss" scoped>
.request-content {
   width: 100%;
   margin: 0;
   text-align: left;
   margin-bottom: 25px;
   .required {
      margin-left: 5px;
      font-weight: bold;
      color: var(--uvalib-red-emergency);
   }
   button.v4-button.radio {
      margin-right: 15px;
      margin-bottom: 5px;
   }
   label {
      font-weight: 500;
      display: block;
   }
   input, select, textarea {
      box-sizing: border-box;
      width: 100%;
   }
   .note {
      font-style: italic;
      display: block;
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
   margin: 10px 0;
   text-align: right;
}
</style>
