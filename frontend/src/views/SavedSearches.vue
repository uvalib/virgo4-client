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
               <ol>
                  <li v-for="saved in searches"  :key="saved.token">
                     <span class="public">
                        <label>
                           <input v-model="saved.public" @change="publicClicked(saved)" type="checkbox"/>
                           <span>&nbsp;Public</span>
                        </label>
                     </span>
                     <span><router-link :to="searchURL(saved.token)">{{saved.name}}</router-link></span>
                     <span class="icon"><router-link :to="searchURL(saved.token)"><i class="fas fa-search"></i></router-link></span>
                  </li>
               </ol>
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
      publicClicked(saved) {
         this.$store.dispatch("user/saveSearchVisibility", saved);
      },
      formatDate(date) {
         return date.split("T")[0];
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
}
.public input {
   width: 15px;
   height: 15px;
   cursor: pointer;
}
.public label {
   font-size: 0.85em;
   cursor: pointer;
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
.details {
   text-align: left
}
.none {
   text-align: center;
   font-size: 1.25em;
   margin-top: 35px;
}
ol {
  list-style: none;
  counter-reset: search-counter;
  font-size: 1.15em;
  padding:0;
}
ol li {
   counter-increment: search-counter;
   display: flex;
   flex-flow: row nowrap;
   border-bottom: 1px solid var(--uvalib-grey-lightest);
   margin-bottom: 3px;
   padding-bottom: 3px;
   align-items: flex-start;
}
ol li span.icon {
   margin-left: auto;
}
ol li span.icon i {
   color: var(--uvalib-text);;
}
ol li::before {
  content: counter(search-counter) ". ";
  font-weight: bold;
  margin-right: 15px;
  display: inline-block;
  width: 30px;
  text-align: right;
  line-height: 1.5em;
}
</style>
