<template>
   <div class="filters">
      <div class="filters-head">Search Filters</div>
      <template v-if="hasFilter">
      </template>
      <div v-else class="no-filter">
         None
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   computed: {
      ...mapState({
      }),
      ...mapGetters({
         hasFilter: 'filters/hasFilter',
      }),
   },
}
</script>

<style scoped>
.filters {
   background: white;
   color: #666;
   font-size: 0.8em;
   padding: 4px;
   margin-top: 5px;
}
.filters-head {
   font-weight: bold;
   border-bottom: 1px solid #ccc;
   margin-bottom: 5px;
}
.no-filter {
   margin-left: 15px;
}
</style>
