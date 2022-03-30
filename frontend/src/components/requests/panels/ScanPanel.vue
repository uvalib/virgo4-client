<template>
   <div class="request-scan pure-form">
      <h2>Scan Request</h2>

      <div v-if="itemOptions.length > 1" class="item-selector">
         <label for="item-select">Select the item you want<span class="required">*</span></label>
         <select id="item-select" v-model="selectedItem" @change="itemSelected" aria-required="true" required="required">
            <option :value="{}">Select an item</option>
            <option v-for="l in itemOptions" :key="l.barcode" :value="l">{{l.label}}</option>
         </select>
         <span v-if="hasError('item')" class="error">Item selection is required</span>
      </div>

      <div class="scan pure-form">
         <div class="entry pure-control-group">
            <label for="scan-use">Scan Purpose</label>
            <select v-model="request.scan.type" id="scan-use">
               <option value="Article">Research</option>
               <option value="Collab">Instruction</option>
            </select>
            <div class="scan-use-note" v-if="request.scan.type == 'Article'">
               Use this form to request a scan for your coursework or personal academic research.
            </div>
            <div v-else class="scan-use-note" >
               <b>For instructors only: </b>
               <span>Use this form to request a scan for distribution to your students through a course management system (Collab, Canvas, etc).</span>
            </div>
         </div>
         <div class="entry pure-control-group">
            <label for="scan-title">Book or Journal Title<span class="required">*</span></label>
            <input readonly type="text" v-model="request.scan.title" id="scan-title" aria-required="true" required="required">
            <span v-if="hasError('title')" class="error">Title is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="scan-chapter">Chapter or Article Title<span class="required">*</span></label>
            <input type="text" v-model="request.scan.chapter" id="scan-chapter" aria-required="true" required="required">
            <span v-if="hasError('chapter')" class="error">Chapter or article is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="scan-author">Chapter or Article Author<span class="required">*</span></label>
            <input type="text" v-model="request.scan.author" id="scan-author" aria-required="true" required="required">
            <span v-if="hasError('author')" class="error">Author is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="scan-year">Year</label>
            <input type="text" v-model="request.scan.year" id="scan-year">
         </div>
         <div class="entry pure-control-group">
            <label for="scan-volume">Volume</label>
            <input type="text" v-model="request.scan.volume" id="scan-volume">
         </div>
         <div class="entry pure-control-group">
            <label for="scan-issue">Issue</label>
            <input type="text" v-model="request.scan.issue" id="scan-issue">
         </div>
         <div class="entry pure-control-group">
            <label for="scan-pages">Pages<span class="required">*</span></label>
            <input type="text" v-model="request.scan.pages" id="scan-pages" aria-required="true" required="required">
            <span class="note">(ex: 1-15)</span>
            <span v-if="pageLengthError" class="error">Please limit page information to 25 characters</span>
            <span v-if="hasError('pages')" class="error">Pages are required</span>
         </div>
         <div v-if="request.scan.type=='Article'" class="entry pure-control-group">
            <label for="scan-notes">Notes</label>
            <textarea id="scan-notes" v-model="request.scan.notes"></textarea>
         </div>
         <div v-else class="entry pure-control-group">
            <label for="scan-course">Course Information<span class="required">*</span></label>
            <textarea id="scan-course" v-model="request.scan.notes"  aria-required="true" required="required"></textarea>
            <span v-if="hasError('course')" class="error">Course information is required</span>
         </div>
         <span v-if="system.err" class="error">{{system.error}}</span>
      </div>
      <ILLCopyrightNotice :type="request.scan.type === 'Article' ? 'research' : 'instruction' " />
      <div class="controls">
         <V4Button mode="primary" class="request-button" @click="submit" :disabled="request.buttonDisabled">Submit Request</V4Button>
      </div>
   </div>
</template>

<script setup>
import ILLCopyrightNotice from '../ILLCopyrightNotice.vue';
import { ref, onMounted, computed } from "vue"
import { useRequestStore } from "@/stores/request"
import { useItemStore } from "@/stores/item"
import { useSystemStore } from "@/stores/system"
import analytics from '@/analytics'

const request = useRequestStore()
const item = useItemStore()
const system = useSystemStore()

const required = ['title', 'chapter', 'author', 'pages']
const selectedItem = ref({})
const errors = ref([])
const pageLengthError = ref(false)
const itemOptions = computed(()=>{
  return request.activeOption.item_options
})

onMounted(()=>{
   analytics.trigger('Requests', 'REQUEST_STARTED', "scan")
   if (itemOptions.value.length == 1) {
      selectedItem.value = itemOptions.value[0]
      itemSelected()
   }
   setTimeout( () => {
      if (itemOptions.value.length == 1) {
         let ele = document.getElementById("scan-use")
         if ( ele ) {
            ele.focus()
         }
      } else {
         let ele = document.getElementById("item-select")
         if ( ele ) {
            ele.focus()
         }
      }

      request.scan.title = item.details.header.title
      if (item.details.header.author) {
         request.scan.author = item.details.header.author.value.join(item.details.header.author.separator)
      } else {
         request.scan.author = "Unknown"
      }
      let isbn = item.details.detailFields.find( f=>f.name=="isbn")
      if (isbn) {
         request.scan.issn = isbn.value.find( i => i.length == 13)
         if (request.scan.issn == "") {
            request.scan.issn = isbn.value[0]
         }
      }

      let pubDate = item.details.basicFields.find( f=>f.name=="published_date")
      if (pubDate) {
         request.scan.year = pubDate.value
      }
   }, 150)
})

function itemSelected() {
   request.scan.barcode = selectedItem.value.barcode
   request.scan.library = selectedItem.value.library
   request.scan.location = selectedItem.value.location_id
   request.scan.callNumber = selectedItem.value.label
}
function hasError( val) {
   return errors.value.includes(val)
}
function submit() {
   errors.value.splice(0, errors.value.length)
   for (let [key, value] of Object.entries(request.scan)) {
      if ( required.includes(key) && value == "") {
         errors.value.push(key)
      }
   }
   if ( request.scan.type == "Collab" && request.scan.notes == "") {
      errors.value.push("course")
   }
   if ( JSON.stringify(selectedItem.value) === JSON.stringify({})) {
      errors.value.push("item")
   }

   if (errors.value.length > 0) {
      let tgtID = `scan-${errors.value[0]}`
      let first = document.getElementById(tgtID)
      if ( first ) {
         first.focus()
      }
   } else {
      pageLengthError.value =  (request.scan.pages.length > 25)
      if ( pageLengthError.value) {
         let tgtID = `scan-pages`
         let first = document.getElementById(tgtID)
         if ( first ) {
            first.focus()
         }
      } else {
         request.submitScan()
      }
   }
}
</script>

<style lang="scss" scoped>
.request-scan {
   text-align: left;
   width: 50%;
   color: var(--uvalib-text);
   margin: 0 auto;
   .required {
      margin-left: 5px;
      font-weight: bold;
      color: var(--uvalib-red-emergency);
   }
   .scan-use-note {
      padding:5px 0 10px 0;
      margin-bottom: 15px;
      border-bottom: 1px solid var(--uvalib-grey-light);
   }
   .controls {
      margin-top: 15px;
      text-align: right;
   }
   h2 {
      margin: 5px 0 10px 0;
   }
   label {
      font-weight: 500;
      display: block;
   }
   input, select, textarea {
      box-sizing: border-box;
      width: 100%;
   }
   .entry {
      margin-bottom: 5px;
   }
   .note {
      font-style: italic;
   }
   span.error {
      margin-left: 0px;
      font-weight: bold;
      font-style: italic;
      color: var(--color-error);
      display: block;
   }
}
@media only screen and (max-width: 768px) {
   .request-scan {
      width: 95%;
   }
}
</style>
