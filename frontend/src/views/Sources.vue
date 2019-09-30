<template>
   <main class="sources">
      <h1>Sources</h1>
      <div class="sources-content">
         <div class="working" v-if="lookingUp" >
            <div>Looking up sources...</div>
            <img src="../assets/spinner2.gif">
         </div>
         <div v-else>
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
         <BackToVirgo />
      </div>
   </main>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import BackToVirgo from "@/components/BackToVirgo"
export default {
   name: "sources",
   components: {
      BackToVirgo
   },
   computed: {
      ...mapState({
         lookingUp : state => state.pools.lookingUp,
         searchAPI: state => state.system.searchAPI
      }),
      ...mapGetters({
         isPoolExcluded: "pools/isPoolExcluded",
         isTargetPool: "pools/isTargetPool",
         pools: "pools/sortedList",
      })
   },
   methods: {
      toggleTargetPool(url) {
         this.$store.commit("resetSearchResults")
         this.$store.commit("pools/toggleTargetPool", url)
      },
      toggleExcludePool(url) {
         this.$store.commit("resetSearchResults")
         this.$store.commit("pools/toggleExcludePool", url)
      }
   },
   created() {
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
.sources {
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
.sources-content {
   width: 60%;
   margin: 0 auto;
}
@media only screen and (min-width: 768px) {
   div.sources-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.sources-content  {
       width: 95%;
   }
}
div.pool {
   text-align: left;
   padding: 0;
   border-radius: 5px;
   margin: 0 0 15px 0;
}
div.pool.excluded {
   opacity: 0.7;
}
div.pool.excluded div.name {
   background: #aaa;   
}
div.name {
   color: white;
   background: var(--color-primary-orange);
   padding: 6px 8px;
   border-radius: 5px 5px 0 0;
}
div.description {
   padding: 15px;
   border-right: 1px solid #ccc;
   border-left: 1px solid #ccc;
   margin:0;
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

