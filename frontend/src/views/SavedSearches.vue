<template>
   <div class="searches">
      <h1>Saved Searches</h1>
      <div class="searches-content">
         <AccountActivities/>
         <div class="working" v-if="lookingUp" >
            <V4Spinner message="Loading up requests..."/>
         </div>
         <div class="details">
            <template v-if="searches.length == 0">
               <div v-if="!lookingUp" class="none">You currently have no saved searches</div>
            </template>
            <template v-else>
                  <div class="row" v-for="(saved,idx) in searches"  :key="saved.token">
                     <div class="saved-search">
                        <span class="num">{{idx+1}}.</span>
                        <span class="public"  @click="publicClicked(saved)" >
                           <i v-if="saved.public" class="check fas fa-check-circle"></i>
                           <i v-else class="check far fa-circle"></i>
                           <span>&nbsp;Public</span>
                        </span>
                        <span><router-link :to="searchURL(saved.token)">{{saved.name}}</router-link></span>
                        <span class="icon"><router-link :to="searchURL(saved.token)"><i class="fas fa-search"></i></router-link></span>
                     </div>
                     <div v-if="saved.public" class="public-controls">
                        <a  class="view" :href="searchURL(saved.token)" target="_blank">
                           <span>View published search</span>
                           <i class="link fas fa-external-link-alt"></i>
                        </a>
                        <span class="sep">|</span>
                        <span @click="copyURL(saved.token)" class="text-button">Copy published URL to clipboard</span>
                     </div>
                  </div>
            </template>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import V4Spinner from "@/components/V4Spinner"
import AccountActivities from "@/components/AccountActivities"
export default {
   name: "requests",
   components: {
      V4Spinner, AccountActivities
   },
   computed: {
      ...mapState({
         searches: state => state.user.searches,
         lookingUp: state => state.user.lookingUp,
      })
   },
   methods: {
      copyURL(token) {
         let URL = this.publicURL(token)  
         this.$copyText(URL).then( ()=> {
            this.$store.commit("system/setMessage", "Public search URL copied to clipboard.")
         }, e => {
            this.$store.commit("system/setError", "Unable to copy public search URL: "+e)
         })
      },
      publicClicked(saved) {
         saved.public = !saved.public
         this.$store.dispatch("user/saveSearchVisibility", saved)
      },
      formatDate(date) {
         return date.split("T")[0];
      },
      publicURL(key) {
         let base = window.location.href 
         return `${base}/${key}` 
      },
      searchURL(key) {
         return `/search/${key}`
      }
   },
   created() {
      this.$store.dispatch("user/getSavedSearches")
   }
};
</script>

<style scoped>
.public {
   margin-right: 20px;
   cursor: pointer;
   font-size: 0.85em;
   cursor: pointer;
   display: inline-block;
}
.searches {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}

div.searches-content {
   width: 60%;
   margin: 0 auto;
   text-align: center;
}
@media only screen and (min-width: 768px) {
   div.searches-content {
      width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.searches-content {
      width: 95%;
   }
} 
div.saved-search {
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
   font-size: 1.1em;
   align-items: center;
}
.public-controls {
   text-align: left;
   margin: 5px 0 5px 45px;
   font-size: 0.9em;
}
div.row {
   border-bottom: 1px solid var(--uvalib-grey-light);
   margin-bottom: 5px;
   padding-bottom: 5px;
}
span.icon {
   margin-left: auto;
   display: inline-block;
}
span.icon i.fas {
   color: var(--uvalib-text);
}
i.link {
   margin: 0 0 0 5px;
}
span.num {
  font-weight: bold;
  margin-right: 15px;
  display: inline-block;
  width: 30px;
  text-align: right;
  line-height: 1.5em;
  color: var(--uvalib-grey);
}
.sep {
   margin: 0 10px;
}
</style>
