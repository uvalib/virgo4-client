<template>
   <div class="journals">
      <V4Spinner v-if="searching" message="Searching..." v-bind:overlay="true" />
      <div class="search-journals-panel pure-form">
         <h1>Browse Journals</h1>
         <div class="search">
            <input
               @keyup.enter="searchClicked"
               v-model="query"
               autocomplete="off"
               type="text"
               placeholder="Browse Virgo journals by title"
            />
            <div class="note"><b>NOTE:</b> This search is case-sensitive</div>
         </div>
         <div class="controls">
            <span @click="searchClicked" class="pure-button pure-button-primary">Search</span>
         </div>
         <div class="basic">
            <span class="text-button basic-link" @click="basicClicked">
               Basic Search&nbsp;
               <i class="fas fa-undo-alt"></i>
            </span>
         </div>
      </div>
      <div v-if="!searching && browseTotal >= 0" class="browse-results shady">
         <div class="summary">
            Browse by journal title "{{query}}"
         </div>
         <div v-if="browseTotal==0" class="browse none">
            No matching journals found
         </div>
         <div v-else class="browse">
            <ol>
               <li v-for="(t,idx) in titles" :key="idx">
                  <AccordionContent class="item" :title="itemTitle(t)" borderWidth="0" layout="wide" style="width:100%">
                     <dl class="fields" v-for="(i,idx2) in t.items" :key="idx2">
                        <dt>Details:</dt> 
                        <dd>
                           <router-link :to="itemURL(i)">Full Virgo details</router-link>
                        </dd>
                        <dt>Published:</dt> 
                        <dd>{{i.published}}</dd>
                        <dt>Format:</dt> 
                        <dd>{{i.format.join(", ")}}</dd>
                        <dt>Availability:</dt> 
                        <dd>{{i.availability}}</dd>
                        <template v-for="(u,uidx) in i.url">
                           <dt :key="uidx">Online Access:</dt> 
                           <dd :key="u">
                              <a :href="u" target="_blank">{{u}}</a>
                           </dd>
                        </template>
                     </dl>
                  </AccordionContent>
               </li>
            </ol>
         </div>
      </div>
      <transition
         name="message-transition"
         enter-active-class="animated faster fadeIn"
         leave-active-class="animated faster fadeOut"
      >
         <p v-if="error" class="error">{{ error }}</p>
      </transition>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapFields } from "vuex-map-fields"
import V4Spinner from "@/components/V4Spinner"
import AccordionContent from "@/components/AccordionContent"
export default {
   name: "journals",
   components: {
      V4Spinner, AccordionContent
   },
   computed: {
      ...mapState({
         error: state => state.system.error,
         searching: state => state.journals.searching,
         titles: state => state.journals.titles,
         browseTotal: state => state.journals.browseTotal
      }),
      ...mapFields("journals", ["query"])
   },
   data: function() {
      return {};
   },
   methods: {
      itemTitle(item) {
         let title = ""
         if (item.items.length == 1) {
            title =  item.title
         } else {
            title = `${item.title} <span class='cnt'>(${item.items.length} items)</span>`
         }
         if (item.alt_titles) {
            title += `<span class='alt-titles'><b>Alternate Titles:</b> ${item.alt_titles.join(' | ')}</span>`
         }
         return title
      },
      itemURL(item) {
         return "/sources/journals/items/"+item.id
      },
      searchClicked() {
         if ( this.query == "") {
            this.$store.commit(
               "system/setError",
               "Please enter a search query"
            )
            return
         }
         this.$store.dispatch("journals/searchJournals")
      },
      basicClicked() {
         this.$store.commit("query/setBasicSearch")
         this.$router.push("/")
      },
   },
   created(){
     this.$store.dispatch("restore/loadJournals")
   }
};
</script>

<style scoped>
.journals {
   min-height: 400px;
   position: relative;
}
.controls {
   padding: 10px 0;
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   justify-content: flex-end;
}
.controls > * {
   flex: 0 1 auto;
}
p.error {
   font-weight: bold;
   margin: 0;
   color: var(--color-error);
   opacity: 1;
   visibility: visible;
}
.search-journals-panel {
   margin: 0 auto 0 auto;
   text-align: center;
   max-width: 800px;
   padding: 10px 2vw 10px 2vw;
   font-size: 0.95em;
}
#app .pure-form input[type="text"] {
   font-size: 1.15em;
   padding: 0.5vw 0.75vw;
   outline: none;
   border: 1px solid #ccc;
   margin: 0;
   border-radius: 5px;
   min-width: 100px;
   width: 100%;
}
div.basic {
   text-align: right;
}
.text-button.basic-link {
   margin-top: 10px;
   font-size: 1em;
}
.text-button.basic-link:hover {
   text-decoration: underline;
}
.shady {
   margin: 0;
   padding: 10px 25px;
   background-color: var(--uvalib-grey-lightest);
}
.summary {
   font-weight: 700;
   font-size: 1.1em;
}
.browse {
   text-align: left;
   color: var(--color-primary-text);
   margin: 10px auto 30px auto;
   background: white;
   box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.12);
}
@media only screen and (min-width: 768px) {
   div.browse {
      width: 60%;
      padding: 10px  5vw;
   }
}
@media only screen and (max-width: 768px) {
   div.browse {
      padding: 10px  2vw;
      width: 95%;
   }
}
ol {
  list-style: none;
  counter-reset: title-counter;
  font-size: 1.15em;
  padding:0;
}
ol li {
   counter-increment: title-counter;
   display: flex;
   flex-flow: row nowrap;
   border-bottom: 1px solid var(--uvalib-grey-lightest);
   margin-bottom: 3px;
   padding-bottom: 3px;
   align-items: flex-start;
}
ol li:first-of-type {
    border-top: 1px solid var(--uvalib-grey-lightest);
    padding-top: 3px;
}
li span.count {
   margin-left: auto;
   font-size: 0.8em;
   color:  var(--uvalib-grey);
}
li span {
   align-self: center;
   text-transform: capitalize;
}
ol li::before {
  content: counter(title-counter) ". ";
  font-weight: bold;
  margin-right: 15px;
  display: inline-block;
  width: 30px;
  text-align: right;
  line-height: 1.5em;
}
div.note {
   text-align: left;
   margin-top: 10px;
   float: left;
}
dl {
   font-size: 0.85em;
   border-bottom: 1px solid var(--uvalib-grey-light);
   margin: 10px 0 15px 25px;
   padding-bottom: 15px;
   display: inline-grid;
   grid-template-columns: max-content 2fr;
   grid-column-gap: 10px;
}
dt {
   font-weight: bold;
   text-align: right;
}
dd {
   margin: 0 0 5px 0;
}
.item >>> .cnt {
   font-size: 0.8em;
   font-style: italic;
}
.item >>> .alt-titles {
   font-size: 0.85em;
   display: block;
   margin-top: 2px;
   color: var(--uvalib-grey);
}
</style>
