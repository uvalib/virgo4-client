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
import { mapState } from "vuex";
import { mapFields } from "vuex-map-fields";
import V4Spinner from "@/components/V4Spinner";
export default {
   name: "journals",
   components: {
      V4Spinner
   },
   computed: {
      ...mapState({
         error: state => state.system.error,
         searching: state => state.journals.searching
      }),
      ...mapFields("journals", ["query"])
   },
   data: function() {
      return {};
   },
   methods: {
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
</style>
