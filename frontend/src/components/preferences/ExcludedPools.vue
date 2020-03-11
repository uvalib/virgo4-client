<template>
  <div class="pool-options">
    <h2>Source Preferences</h2>
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
          <span v-html="p.description"></span>
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
  </div>
</template>
<script>
import { mapGetters } from "vuex"
//import { mapState } from "vuex"
export default {
  computed: {
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
  }
}
</script>

<style scoped>
.pools {
   display: flex;
   flex-flow: row wrap;
   justify-content: center;
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