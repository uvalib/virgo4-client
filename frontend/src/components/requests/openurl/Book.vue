<template>
   <div class="request-wrap">
      <div class="request-content pure-form">
         <div class="entry pure-control-group">
            <label for="title">Title<span class="required">*</span></label>
            <input type="text" v-model="title" id="title" aria-required="true" required="required">
            <span class="note">Please do not abbreviate title</span>
            <span v-if="hasError('title')" class="error">Title is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="author">Author/Editor</label>
            <input type="text" v-model="author" id="author">
         </div>
         <div class="entry pure-control-group">
            <label for="publisher">Publisher</label>
            <input type="text" v-model="publisher" id="publisher">
         </div>
         <div class="entry pure-control-group">
            <label for="volume">Volume</label>
            <input type="text" v-model="volume" id="volume">
         </div>
         <div class="entry pure-control-group">
            <label for="year">Year<span class="required">*</span></label>
            <input type="text" v-model="year" id="year" aria-required="true" required="required">
            <span v-if="hasError('year')" class="error">Year is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="edition">edition</label>
            <input type="text" v-model="edition" id="edition">
         </div>
         <div class="entry pure-control-group">
            <label for="issn">ISSN/ISBN</label>
            <input type="text" v-model="issn" id="issn">
         </div>
         <div class="entry pure-control-group">
            <label for="oclc">OCLC Number</label>
            <input type="text" v-model="oclc" id="oclc">
         </div>
         <div class="entry pure-control-group">
            <label for="bydate">Need By Date<span class="required">*</span></label>
            <input type="text" v-model="bydate" id="bydate">
            <span v-if="hasError('bydate')" class="error">Need By Date is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="citedin">Cited In</label>
            <textarea id="citedin" v-model="citedin"></textarea>
         </div>
         <div role="radiogroup" class="entry pure-control-group" aria-labelledby="language-label">
            <label id="language-label">
               Will you accept the item in a language other than English?
            </label>
            <V4Button id="any-language-yes" class="radio" mode="icon" @click="anylanguage='true'" role="radio"
               :aria-checked="(anylanguage=='true').toString()">
               <i v-if="anylanguage=='true'" class="check fas fa-check-circle"></i>
               <i v-else class="check far fa-circle"></i>
               Yes
            </V4Button>
            <V4Button class="radio" mode="icon" @click="anylanguage='false'" role="radio"
               :aria-checked="(anylanguage=='false').toString()">
               <i v-if="anylanguage=='false'" class="check fas fa-check-circle"></i>
               <i v-else class="check far fa-circle"></i>
               No
            </V4Button>
            <span class="note">If yes, specify acceptable languages in the notes field.</span>
         </div>
         <div class="entry pure-control-group">
            <label for="notes">Notes or Special Instructions</label>
            <textarea id="notes" v-model="notes"></textarea>
            <span class="note">(ex: special edition)</span>
         </div>
         <div class="entry pure-control-group">
            <label for="doctype">Preferred pickup location</label>
            <select v-model="pickup" id="pickup">
               <option value="">Select a location</option>
               <template v-for="l in pickupLibraries">
                  <option :value="l.id" :key="l.id">{{l.name}}</option>
               </template>
            </select>
         </div>
      </div>
      <div class="controls">
         <V4Button mode="tertiary" @click="$emit('canceled')">
            Cancel
         </V4Button>
         <V4Button mode="primary" @click="submitClicked" :disabled="buttonDisabled">
            Submit
         </V4Button>
      </div>
   </div>
</template>
<script>
import { mapFields } from "vuex-map-fields"
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   data: () => {
      return {
         errors: [],
         pageLengthError: false,
         required: ['title', 'article', 'year', 'pages', 'bydate']
      }
   },
   computed: {
      ...mapState({
         sysError: state => state.system.error,
         buttonDisabled: state => state.requests.buttonDisabled,
         request: state => state.requests.openurl,
         preferredPickupLibrary: state => state.preferences.pickupLibrary
      }),
      ...mapGetters({
         pickupLibraries: "user/libraries",
      }),
      ...mapFields('requests',[
         'buttonDisabled',
         'openurl.title',
         'openurl.article',
         'openurl.author',
         'openurl.publisher',
         'openurl.volume',
         'openurl.year',
         'openurl.edition',
         'openurl.issn',
         'openurl.oclc',
         'openurl.bydate',
         'openurl.citedin',
         'openurl.anylanguage',
         'openurl.notes',
         'openurl.pickup',
      ]),
   },
   created() {
      setTimeout(() => {
         this.pickup = this.preferredPickupLibrary.id
         document.getElementById("title").focus()
      }, 150);
   },
   methods: {
      hasError(val) {
         return this.errors.includes(val)
      },
      submitClicked() {
         this.errors.splice(0, this.errors.length)
         for (let [key, value] of Object.entries(this.request)) {
            if ( this.required.includes(key) && value == "") {
               this.errors.push(key)
            }
         }

         if (this.errors.length > 0) {
            let tgtID = this.errors[0]
            let first = document.getElementById(tgtID)
            if ( first ) {
               first.focus()
            }
         } else {
            this.pageLengthError =  (this.scan.pages.length > 25)
            if ( this.pageLengthError) {
               let tgtID = `pages`
               let first = document.getElementById(tgtID)
               if ( first ) {
                  first.focus()
               }
            } else {
               this.$emit("submitted")
            }
         }

      },
   }
};
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
