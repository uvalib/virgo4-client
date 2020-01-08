<template>
   <div class="preferences">
      <h1>My Account</h1>
      <div class="preferences-content">
         <AccountActivities/>
         <div class="working" v-if="lookingUpPools || lookingUpAccount" >
            <V4Spinner message="Loading preferences..."/>
         </div>
         <div v-else>
            <p>
               Select which sources you want to include in your search results,
               and which source you prefer to see results from most.
            </p>
            <div class="pools">
               <div class="pool" v-for="p in pools" :key="p.id"
                  v-bind:class="{excluded: isPoolExcluded(p.url)}">
                  <div class="name">
                     <span><b>{{p.name}}</b></span>
                  </div>
                  <div class="description">
                     <span>{{p.description}}</span>
                  </div>
                  <div class="source-controls">
                     <div class="toggle" @click="toggleTargetPool(p.url)">
                        <i v-if="isTargetPool(p.url)" class="fas fa-star"></i>
                        <i v-else class="far fa-star"></i>
                        <span class="label">Preferred Source</span>
                     </div>
                     <div class="toggle"  @click="toggleExcludePool(p.url)">
                        <span class="label">Search this Source</span>
                        <i v-if="isPoolExcluded(p.url)" class="excluded far fa-circle"></i>
                        <i v-else class="selected fas fa-check-circle"></i>
                     </div>
                  </div>
               </div>
            </div>
            <transition name="message-transition"
                        enter-active-class="animated faster fadeIn"
                        leave-active-class="animated faster fadeOut">
               <p v-if="error" class="error">Unable to retrieve bookmarks: {{ error }}</p>
            </transition>
         </div>
      </div>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import AccountActivities from "@/components/AccountActivities"
import V4Spinner from "@/components/V4Spinner"
export default {
   name: "preferences",
   components: {
      AccountActivities, V4Spinner
   },
   computed: {
      ...mapState({
         lookingUpPools : state => state.pools.lookingUp,
         lookingUpAccount : state => state.user.lookingUp,
         searchAPI: state => state.system.searchAPI,
         error: state => state.system.error,
      }),
      ...mapGetters({
         isPoolExcluded: "preferences/isPoolExcluded",
         isTargetPool: "preferences/isTargetPool",
         pools: "pools/sortedList",
      })
   },
   methods: {
      toggleTargetPool(url) {
         this.$store.commit("resetSearchResults")
         this.$store.dispatch("preferences/toggleTargetPool", url)
      },
      toggleExcludePool(url) {
         this.$store.commit("resetSearchResults")
         this.$store.dispatch("preferences/toggleExcludePool", url)
      }
   },
   created() {
      this.$store.dispatch("user/getAccountInfo")
      if ( this.searchAPI.length == 0) {
         this.$store.dispatch('system/getConfig').then(_response => {
            this.$store.dispatch('pools/getPools')
         })
      } else {
         this.$store.dispatch('pools/getPools')
      }
   }
}
</script>
<style scoped>
.pools {
   display: flex;
   flex-flow: row wrap;
   justify-content: center;
}
.preferences {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
.working {
   text-align: center;
   font-size: 1.25em;
}
.working img {
   margin: 30px 0;
}
.preferences-content {
   width: 80%;
   margin: 0 auto;
}
@media only screen and (min-width: 768px) {
   div.preferences-content  {
       width: 80%;
   }
}
@media only screen and (max-width: 768px) {
   div.preferences-content  {
       width: 95%;
   }
}
div.pool {
   text-align: left;
   padding: 0;
   border-radius: 5px;
   margin: 5px;
   width: 400px;
   display: inline-block;
   font-size: 0.9em;
}
div.pool.excluded {
   opacity: 0.7;
}
div.pool.excluded div.name {
   background: #aaa;
}
div.name {
   color: white;
   background: var(--color-brand-blue);
   padding: 6px 8px;
   border-radius: 5px 5px 0 0;
}
div.description {
   padding: 15px;
   border-right: 1px solid #ccc;
   border-left: 1px solid #ccc;
   margin:0;
   font-size: 0.8em;
}
div.source-controls {
   font-size: 0.85em;
   padding: 5px;
   border: 1px solid #ccc;
   background-color: #f5f5f5;
   border-radius: 0 0 5px 5px;
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   justify-content: space-between;
}
div.toggle {
   cursor: pointer;
}
i.fas.selected {
   color: var(--color-pale-blue);
   margin-left: 10px;
   cursor: pointer;
   font-size: 1.25em;
   position: relative;
   top: 2px;
}
i.far.excluded {
   color: #999;
   margin-left: 10px;
   cursor: pointer;
   font-size: 1.25em;
   position: relative;
   top: 2px;
}
i.far.fa-star {
   margin-right: 10px;
   color: #999;
   cursor: pointer;
   font-size: 1.15em;
}
i.fas.fa-star {
   color: gold;
   margin-right: 10px;
   cursor: pointer;
   font-size: 1.15em;
}
</style>
