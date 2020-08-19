<template>
   <div class="request">
      <h1>Request an Item</h1>
      <div class="request-content  pure-form">
         <div class="entry pure-control-group">
            <label for="title">Title<span class="required">*</span></label>
            <input type="text" v-model="request.title" id="title" aria-required="true" required="required">
            <span v-if="hasError('title')" class="error">Title is required</span>
         </div>
         <div class="entry pure-control-group">
            <label for="author">Author/Editors</label>
            <input type="text" v-model="request.author" id="author">
         </div>
         <div class="entry pure-control-group">
            <label for="publisher">Publisher</label>
            <input type="text" v-model="request.publisher" id="publisher">
         </div>
         <div class="entry pure-control-group">
            <label for="pubplace">Place of Publication</label>
            <input type="text" v-model="request.pubplace" id="pubplace">
         </div>
         <div class="entry pure-control-group">
            <label for="pubdate">Date of Publication</label>
            <input type="text" v-model="request.pubdate" id="pubdate">
         </div>
         <div class="entry pure-control-group">
            <label for="edition">Edition</label>
            <input type="text" v-model="request.edition" id="edition">
         </div>
         <div class="entry pure-control-group">
            <label for="volume">Volume</label>
            <input type="text" v-model="request.volume" id="volume">
         </div>
         <div class="entry pure-control-group">
            <label for="issue">Issue</label>
            <input type="text" v-model="request.issue" id="issue">
         </div>
         <div class="entry pure-control-group">
            <label for="pages">Pages</label>
            <input type="text" v-model="request.pages" id="pages">
            <span class="note">(ex: 1-15)</span>
            <span v-if="pageLengthError" class="error">Please limt page information to 25 characters</span>
         </div>
         <div class="entry pure-control-group">
            <label for="issn">ISSN/ISBN</label>
            <input type="text" v-model="request.issn" id="issn">
         </div>
         <div class="entry pure-control-group">
            <label for="oclc">OCLC</label>
            <input type="text" v-model="request.oclc" id="oclc">
         </div>
         <div class="entry pure-control-group">
            <label for="atitle">Article Title</label>
            <input type="text" v-model="request.atitle" id="atitle">
         </div>
         <div class="entry pure-control-group">
            <label for="aauthor">Article Author</label>
            <input type="text" v-model="request.aauthor" id="aauthor">
         </div>
         <div class="entry pure-control-group">
            <label for="bydate">Need By Date</label>
            <input type="text" v-model="request.bydate" id="bydate">
         </div>
         <div role="radiogroup" class="entry pure-control-group" aria-labelledby="language-label">
            <label id="language-label">
               Will you accept the item in a language other than English?
            </label>
            <V4Button id="any-language-yes" class="radio" mode="icon" @click="request.anylanguage='true'" role="radio"
               :aria-checked="(request.anylanguage=='true').toString()">
               <i v-if="request.anylanguage=='true'" class="check fas fa-check-circle"></i>
               <i v-else class="check far fa-circle"></i>
               Yes
            </V4Button>
            <V4Button class="radio" mode="icon" @click="request.anylanguage='false'" role="radio"
               :aria-checked="(request.anylanguage=='false').toString()">
               <i v-if="request.anylanguage=='false'" class="check fas fa-check-circle"></i>
               <i v-else class="check far fa-circle"></i>
               No
            </V4Button>
            <span class="note">If yes, specify acceptable languages in the notes field.</span>
         </div>
         <div role="radiogroup" class="entry pure-control-group" aria-labelledby="alt-editiom-label">
            <label id="alt-edition-label">
               Will you accept an alternate edition of this item?
            </label>
            <V4Button id="alt-edition-yes" class="radio" mode="icon" @click="request.altedition='true'" role="radio"
               :aria-checked="(request.altedition=='true').toString()">
               <i v-if="request.altedition=='true'" class="check fas fa-check-circle"></i>
               <i v-else class="check far fa-circle"></i>
               Yes
            </V4Button>
            <V4Button class="radio" mode="icon" @click="request.altedition='false'" role="radio"
               :aria-checked="(request.altedition=='false').toString()">
               <i v-if="request.altedition=='false'" class="check fas fa-check-circle"></i>
               <i v-else class="check far fa-circle"></i>
               No
            </V4Button>
         </div>
         <div class="entry pure-control-group">
            <label for="notes">Notes or Special Instructions</label>
            <textarea id="notes" v-model="request.notes"></textarea>
            <span class="note">Put any information here that may help us find the item, as well as any other pertinent information.</span>
         </div>
         <div class="entry pure-control-group">
            <label for="citedin">Where did you find this item cited? Include title, volume, year, and pages.</label>
            <textarea id="citedin" v-model="request.citedin"></textarea>
            <span class="note">Examples are Dissertation Abstracts, Dialog (specify which database), or a specific journal or book.</span>
         </div>
         <div class="entry pure-control-group">
            <label for="doctype">Preferred pickup location</label>
            <select v-model="request.pickup" id="pickup">
               <option value="">Select a location</option>
               <template v-for="l in pickupLibraries">
                  <option :value="l.id" :key="l.id">{{l.name}}</option>
               </template>
            </select>
         </div>
      </div>
   </div>
</template>

<script>

import { mapGetters } from "vuex"
import { mapState } from "vuex"
export default {
   name: "openurl",
   data: function()  {
      return {
         errors: [],
         pageLengthError: false,
         required: {
            loan: ["title", "year", "pickup"],
            article: ["atitle", "aauthor", "pages"],
         },
         request: {
            type: "",
            title: "",
            author: "",
            publisher: "",
            pubplace: "",
            pubdate: "",
            edition: "",
            volume: "",
            issue: "",
            year: "",
            pages: "",
            issn: "",
            oclc: "",
            atitle: "",
            aauthor: "",
            bydate: "",
            anylanguage: "",
            altedition: "",
            citedin: "",
            notes: "",
            pickup: "",
         }
      }
   },
   components: {
   },
   computed: {
      ...mapState({
         sysError: state => state.system.error,
         buttonDisabled: state => state.requests.buttonDisabled,
         preferredPickupLibrary: state => state.preferences.pickupLibrary
      }),
      ...mapGetters({
         pickupLibraries: "user/libraries",
      })
   },
   methods: {
      hasError( val) {
         return this.errors.includes(val)
      },
   },
   created() {
      this.request.pickup = this.preferredPickupLibrary.id
   }
}
</script>
<style lang="scss" scoped>
.request {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
@media only screen and (min-width: 768px) {
   div.request-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.request-content  {
       width: 95%;
   }
}
.request-content {
   width: 60%;
   margin: 0 auto;
   text-align: left;
   margin-bottom: 25px;
   border-bottom: 1px solid var(--uvalib-grey-light);
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
</style>
