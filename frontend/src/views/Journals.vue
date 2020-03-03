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
                        <template v-if="i.callNumber">
                           <dt>Call Number:</dt> 
                           <dd>{{i.callNumber.join(", ")}}</dd>
                        </template>
                        <template v-if="i.location">
                           <dt>Location:</dt> 
                           <dd>{{i.location.join(", ")}}</dd>
                        </template>
                        <template v-if="i.availability">
                           <dt>Availability:</dt> 
                           <dd>{{i.availability}}</dd>
                        </template>
                        <template  v-if="i.accessURL">
                           <dt>Online Access:</dt> 
                           <dd v-html="urlList(i)"></dd>
                        </template>
                     </dl>
                  </AccordionContent>
               </li>
            </ol>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
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
         searching: state => state.journals.searching,
         titles: state => state.journals.titles,
         browseTotal: state => state.journals.browseTotal
      }),
      ...mapGetters({
         findProvider: 'pools/findProvider'
      }),
      ...mapFields("journals", ["query"]),
   },
   data: function() {
      return {};
   },
   methods: {
      urlList(item) {
         // all links in solr are from the same provider. Just grab first
         let u = item.accessURL[0]
         let linkText = u.provider
         let hasProvider = false
         if (linkText) {
            hasProvider = true
            let pDetail = this.findProvider("journals", u.provider)
            if (pDetail.label) {
               linkText = pDetail.label   
            }
         } else {
            linkText = u.url
         }

         // if there is only 1 link, no need to deal with the item part of the data
         if (item.accessURL.length == 1) {
            let u = item.accessURL[0]
            return `<a href="${u.url}" target="_blank">${linkText}</a>`   
         } 

         let out = []
         item.accessURL.slice(0,10).forEach( u=> {
            let url =`<a href="${u.url}" target="_blank">${u.item}</a>`
            out.push(url)
         })
         if (item.accessURL.length > 10 ) {
             out.push(`...see ${item.accessURL.length -10} more on details page`)   
         }
         if (hasProvider) {
            return `<strong>${linkText}&nbsp-</strong>&nbsp${out.join(" | ")}`
         }
         return out.join(" | ")
      },
      itemTitle(item) {
         let title = ""
         if (item.items.length == 1) {
            title =  item.title
         } else {
            title = `${item.title} <span class='cnt'>(${item.items.length} titles)</span>`
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
   border-bottom: 1px solid var(--uvalib-grey-lightest);
   font-size: 0.85em;
   margin: 10px 0 15px 0;
   padding-bottom: 15px;
   display: grid;
   grid-template-columns: max-content 2fr;
   grid-column-gap: 10px;
}
dl:last-child {
 border-bottom:0;  
}
dt {
   font-weight: bold;
   text-align: right;
}
dd {
   margin: 0 0 5px 0;
   word-break: break-word;
   -webkit-hyphens: auto;
   -moz-hyphens: auto;
   hyphens: auto;
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
strong {
   color: var(--uvalib-grey);
}
</style>
