<template>
   <v-popover style="display:inline-block;">
      <span @click="getPools" class="pure-button pure-button-secondary">Pool Information</span>
      <div class="pools-container" slot="popover">
         <h4>
            Available Search Pools
            <i v-close-popover class="action close fas fa-times-circle"></i>
         </h4>
         <div class="pools-list">
            <div class="pool" v-for="p in pools" :key="p.id">
               <i @click="toggleTargetPool(p.url)" v-if="isTargetPool(p.url)" class="fas fa-star"></i>
               <i @click="toggleTargetPool(p.url)" v-else class="far fa-star"></i>
               <i @click="toggleExcludePool(p.url)" v-if="isPoolExcluded(p.url)" class="excluded fas fa-times-circle"></i>
               <i @click="toggleExcludePool(p.url)" v-else class="selected fas fa-check-circle"></i>
               <p class="pool-desc">{{p.description}}</p>
            </div>
         </div>
         <div class="toolbar">
            <span @click="includeAllClicked" class="pure-button pure-button-primary">Include All</span>
            <span @click="excludeAllClicked" class="pure-button pure-button-primary">Exclude All</span>
         </div>
      </div>
   </v-popover>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   components: {},
   computed: {
      ...mapState({
         pools: state => state.pools.list
      }),
      ...mapGetters({
         isPoolExcluded: "pools/isPoolExcluded",
         isTargetPool: "pools/isTargetPool"
      })
   },
   methods: {
      getPools() {
         this.$store.dispatch('pools/getPools')
      },
      includeAllClicked() {
         this.$store.commit("pools/includeAll")
      },
      excludeAllClicked() {
         this.$store.commit("pools/excludeAll")
      },
      toggleTargetPool(url) {
         this.$store.commit("pools/toggleTargetPool", url)
      },
      toggleExcludePool(url) {
         this.$store.commit("pools/toggleExcludePool", url)
      }
   }
};
</script>

<style scoped>
i.far.fa-star {
   opacity: 0.5;
   margin-right: 10px;
   color: #999;
   cursor: pointer;
   font-size: 1.1em;
}
i.fas.fa-star {
   opacity: 1;
   color: gold;
   margin-right: 10px;
   cursor: pointer;
   font-size: 1.1em;
}
i.fas.selected {
   color: green;
   margin-right: 10px;
   cursor: pointer;
   font-size: 1.1em;
}
i.fas.excluded {
   color: var(--color-error);;
   margin-right: 10px;
   cursor: pointer;
   font-size: 1.1em;
}
p.pool-desc {
   margin: 0;
   display: inline-block;
   cursor: default;
}
.toolbar {
   font-size: 0.9em;
   font-weight: bold;
   text-align: right;
   padding: 5px 15px 10px 0;
}
.toolbar .pure-button.pure-button-primary {
   padding: 3px 15px;
   margin-left: 5px;
   font-weight: 100;
   border-radius: 5px;
   opacity: 0.8;
}
.toolbar .pure-button.pure-button-primary:hover {
   opacity:1;
}
.pools-container {
   background: white;
   box-shadow: 2px 2px 10px #ccc;
   font-size: 0.9em;
   font-weight: 100;
   display: inline-block;
   padding-bottom: 5px;
   border-radius: 10px;
}
.pools-container h4 {
   padding: 5px 0;
   margin: 0;
   text-align: center;
   background: var(--color-primary-orange);
   color: white;
   font-weight: 100;
   border-radius: 10px 10px 0 0;
}
.pools-list {
   margin: 5px 0 5px 0;
   font-size: 0.9em;
   max-height: 350px;
   overflow-y: scroll;
}
.pool {
   text-align: left;
   padding: 6px 16px 4px 10px;
   position: relative;
}
.pool:hover {
   background: var(--color-hover-highight);
}
</style>
