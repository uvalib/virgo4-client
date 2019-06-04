<template>
   <v-popover style="display:inline-block;" offset="10" placement="bottom-end">
      <span class="pools pure-button pure-button-secondary">Pool Information</span>
      <div class="pools-container" slot="popover">
         <h4>
            Available Search Pools
         </h4>
         <div class="toolbar">
            <span @click="includeAllClicked" class="pure-button pure-button-primary">Include All</span>
            <span @click="clearAllClicked" class="pure-button pure-button-primary">Exclude All</span>
         </div>
         <div class="pools-list">
            <div class="pool" v-for="p in pools" :key="p.id">
               <i @click="toggleTargetPool(p.url)" v-if="isTargetPool(p.url)" class="fas fa-star"></i>
               <i @click="toggleTargetPool(p.url)" v-else class="far fa-star"></i>
               <i @click="toggleExcludePool(p.url)" v-if="isPoolExcluded(p.url)" class="excluded fas fa-times-circle"></i>
               <i @click="toggleExcludePool(p.url)" v-else class="selected fas fa-check-circle"></i>
               <p class="pool-desc">{{p.description}}</p>
            </div>
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
         pools: state => state.pools
      }),
      ...mapGetters({
         isPoolExcluded: "isPoolExcluded",
         isTargetPool: "isTargetPool"
      })
   },
   methods: {
      closeClicked() {
         this.$store.commit("showPoolsOverlay", false)
      },
      includeAllClicked() {
         this.$store.commit("includeAll")
      },
      clearAllClicked() {
         this.$store.commit("excludeAll")
      },
      toggleTargetPool(url) {
         this.$store.commit("toggleTargetPool", url)
      },
      toggleExcludePool(url) {
         this.$store.commit("toggleExcludePool", url)
      }
   }
};
</script>

<style scoped>
.pure-button.pure-button-secondary {
   background: rgb(66, 184, 221); 
   color: white;
   border-radius: 5px;
}
i.far.fa-star {
   opacity: 0.5;
   margin-right: 10px;
   color: #999;
   cursor: pointer;
   font-size: 1.1em;
}
i.fas.fa-star {
   opacity: 1;
   color: goldenrod;
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
   color: firebrick;
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
   font-size: 0.75em;
   font-weight: bold;
   text-align: right;
   padding: 10px 10px 5px 0;
}
.toolbar .pure-button.pure-button-primary {
   padding: 3px 15px;
   margin-left: 5px;
   font-weight: 100;
}
.pools-container {
   background: white;
   box-shadow: 2px 2px 10px #ccc;
   color: #555;
   font-size: 0.9em;
   font-weight: 100;
   display: inline-block;
   padding-bottom: 5px;
}
.pools-container h4 {
   padding: 5px 40px;
   margin: 0;
   text-align: center;
   background: #0078e7;
   color: white;
   position: relative;
   font-weight: 100;
}
.pools-list {
   margin: 5px 0 10px 0;
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
   background: #f5f5ff;
}
</style>
