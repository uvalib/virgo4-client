<template>
   <div class="request-scan">
      <h2>Scan Request</h2>

      <div v-if="items.length > 1" class="item-selector">
         <label for="scan-use">Select the item you want</label>
         <V4Select id="item-select" style="height:2.5em;margin-top:5px;" :selections="items"
            v-model="selectedItem" :attached="false"/>
         <span v-if="hasError('item')" class="error">* item selection is required</span>
      </div>

      <div class="scan pure-form">
         <div class="entry pure-control-group">
            <label for="scan-use">Scan Purpose</label>
            <select v-model="type" id="scan-use">
               <option value="Article">Research</option>
               <option value="Collab">Instruction</option>
            </select>
         </div>
         <div class="entry pure-control-group">
            <label for="scan-title">Book or Journal Title</label>
            <input readonly type="text" v-model="title" id="scan-title" aria-required="true" required="required">
            <span v-if="hasError('title')" class="error">* title is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="scan-chapter">Chapter or Article Title</label>
            <input type="text" v-model="chapter" id="scan-chapter" aria-required="true" required="required">
            <span v-if="hasError('chapter')" class="error">* chapter or article is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="scan-author">Chapter or Article Author</label>
            <input type="text" v-model="author" id="scan-author" aria-required="true" required="required">
            <span v-if="hasError('author')" class="error">* author is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="scan-year">Year</label>
            <input type="text" v-model="year" id="scan-year">
         </div>
         <div class="entry pure-control-group">
            <label for="scan-volume">Volume</label>
            <input type="text" v-model="volume" id="scan-volume">
         </div>
         <div class="entry pure-control-group">
            <label for="scan-issue">Issue</label>
            <input type="text" v-model="issue" id="scan-issue">
         </div>
         <div class="entry pure-control-group">
            <label for="scan-pages">Pages</label>
            <input type="text" v-model="pages" id="scan-pages" aria-required="true" required="required">
            <span v-if="hasError('pages')" class="error">* pages are required</span>
         </div>
         <div v-if="type=='Article'" class="entry pure-control-group">
            <label for="scan-notes">Notes</label>
            <textarea id="scan-notes" v-model="notes"></textarea>
         </div>
         <div v-else class="entry pure-control-group">
            <label for="scan-course">Course Information</label>
            <textarea id="scan-course" v-model="notes"  aria-required="true" required="required"></textarea>
            <span v-if="hasError('course')" class="error">* course information is required</span>
         </div>
         <span v-if="sysError" class="error">{{sysError}}</span>
      </div>
      <div class="controls">
         <V4Button mode="primary" class="request-button" @click="submit" :disabled="buttonDisabled">Submit Request</V4Button>
      </div>
   </div>
</template>
<script>
import { mapFields } from "vuex-map-fields"
import { mapState } from "vuex"
export default {
   data: () => {
      return {
         selectedItem: {},
         errors: [],
         required: ['title', 'chapter', 'author', 'pages']
      }
   },
   watch: {
      selectedItem(newVal, _oldVal) {
         this.barcode = newVal.barcode
         this.library = newVal.library
      }
   },
   computed: {
      ...mapState({
         details : state => state.item.details,
         scan: state => state.requests.scan,
         sysError: state => state.error
      }),
      ...mapFields('requests',[
         'buttonDisabled',
         'scan.barcode',
         'scan.issn',
         'scan.type',
         'scan.title',
         'scan.chapter',
         'scan.author',
         'scan.volume',
         'scan.issue',
         'scan.year',
         'scan.pages',
         'scan.notes',
         'scan.library',
         'activeOption.item_options'
      ]),
      items() {
         let items = this.item_options
         for (let i in items) {
            items[i].id = items[i].barcode
            items[i].name = items[i].label
         }
         return items;
      }
   },
   created() {
      if (this.items.length == 1) {
         this.selectedItem = this.items[0]
      }
      setTimeout( () => {
         if (this.items.length == 1) {
            document.getElementById("scan-use").focus()
         } else {
            document.getElementById("item-select").focus()
         }
         this.title = this.details.header.title
         if (this.details.header.author) {
            this.author = this.details.header.author.value.join(this.details.header.author.separator)
         } else {
            this.author = "Unknown"
         }
         let isbn = this.details.detailFields.find( f=>f.name=="isbn")
         if (isbn) {
            this.issn = isbn.value.find( i => i.length == 13)
            if (this.issn == "") {
               this.issn = isbn.value[0]
            }
         }

         let pubDate = this.details.basicFields.find( f=>f.name=="published_date")
         if (pubDate) {
            this.year = pubDate.value
         }
      }, 150)
   },
   methods: {
      hasError( val) {
         return this.errors.includes(val)
      },
      submit() {
         this.errors.splice(0, this.errors.length)
         for (let [key, value] of Object.entries(this.scan)) {
            if ( this.required.includes(key) && value == "") {
               this.errors.push(key)
            }
         }
         if ( this.scan.type == "Collab" && this.scan.notes == "") {
            this.errors.push("course")
         }
         if ( JSON.stringify(this.selectedItem) === JSON.stringify({})) {
            this.errors.push("item")
         }
         if (this.errors.length > 0) {
            let tgtID = `scan-${this.errors[0]}`
            let first = document.getElementById(tgtID)
            if ( first ) {
               first.focus()
            }
         } else {
            this.$store.dispatch("requests/submitScan");
         }
      },
   }
};
</script>
<style lang="scss" scoped>
.request-scan {
   text-align: left;
   width: 50%;
   color: var(--uvalib-text);
   margin: 0 auto;
   .controls {
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
   span.error {
      margin-left: 10px;
      font-weight: bold;
      font-style: italic;
      color: var(--color-error);
   }
}
@media only screen and (max-width: 768px) {
   .request-scan {
      max-width: 95%;
   }
}
</style>
