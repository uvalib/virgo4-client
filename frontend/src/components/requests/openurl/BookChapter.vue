<template>
   <div class="request-wrap">
      <div class="request-content pure-form">
         <div class="entry pure-control-group">
            <label for="title">Book Title<span class="required">*</span></label>
            <input type="text" v-model="request.openurl.title" id="title" aria-required="true" required="required">
            <span v-if="hasError('title')" class="error">Book Title is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="article">Chapter Title<span class="required">*</span></label>
            <input type="text" v-model="request.openurl.article" id="article" aria-required="true" required="required">
            <span v-if="hasError('article')" class="error">Chapter Title is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="author">Book or Chapter Author</label>
            <input type="text" v-model="request.openurl.author" id="author">
         </div>
         <div class="entry pure-control-group">
            <label for="year">Year<span class="required">*</span></label>
            <input type="text" v-model="request.openurl.year" id="year" aria-required="true" required="required">
            <span v-if="hasError('year')" class="error">Year is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="pages">Pages<span class="required">*</span></label>
            <input type="text" v-model="request.openurl.pages" id="pages">
            <span class="note">(ex: 1-15)</span>
            <span v-if="pageLengthError" class="error">Please limt page information to 25 characters</span>
             <span v-if="hasError('pages')" class="error">Pages are required</span>
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
            <label for="notes">Notes or Special Instructions</label>
            <textarea id="notes" v-model="request.openurl.notes"></textarea>
            <span class="note">(ex: color copies)</span>
         </div>
         <div class="entry pure-control-group">
            <label for="bydate">Need By Date<span class="required">*</span></label>
            <input type="text" v-model="request.openurl.bydate" id="bydate">
            <span v-if="hasError('bydate')" class="error">Need By Date is required</span>
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

const emit = defineEmits( ['submitted', 'canceled'] )

const request = useRequestStore()

const required = ['title', 'article', 'year', 'pages', 'bydate']
const errors = ref([])
const pageLengthError = ref(false)

onMounted(()=>{
   setTimeout(() => {
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
      let tgtID = errors.value[0]
      let first = document.getElementById(tgtID)
      if ( first ) {
         first.focus()
      }
   } else {
      pageLengthError.value =  (request.openurl.pages.length > 25)
      if ( pageLengthError.value) {
         let tgtID = `pages`
         let first = document.getElementById(tgtID)
         if ( first ) {
            first.focus()
         }
      } else {
         emit("submitted")
      }
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
