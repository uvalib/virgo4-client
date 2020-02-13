<template>
  <div class="pool-options">
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

