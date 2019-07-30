<template>
   <div class="filters">
      <div class="filters-head">
         <span>Search Filters</span>
         <span v-if="!addingFilter" @click="addClicked" class="add">Add</span>
      </div>
      <template v-if="hasFilter">
      </template>
      <div v-else class="no-filter">
         <span>None</span>
      </div>
      <AddFilter v-if="addingFilter"/>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import AddFilter from '@/components/AddFilter'
export default {
   components: {
      AddFilter
   },
   computed: {
      ...mapState({
         addingFilter: state => state.filters.adding,
         poolIdx: state => state.explorePoolIdx,
      }),
      ...mapGetters({
         hasFilter: 'filters/hasFilter',
         poolFacets: 'filters/poolFacets',
      }),
   },
   methods: {
      addClicked(event) {
         event.stopPropagation()
         this.$store.commit("filters/showAdd")
      },
   }
}
</script>

<style scoped>
.filters {
   background: white;
   color: #666;
   font-size: 0.8em;
   padding: 5px 0 5px 8px;
   margin-top: 5px;
   border-radius: 5px 0 0 0;
}
.filters-head {
   font-weight: bold;
   border-bottom: 1px solid #ccc;
   margin-bottom: 5px;
}
.no-filter {
   margin-left: 15px;
}
.add {
   background: var(--color-primary-blue);;
   float: right;
   margin-right: 6px;
   color: white;
   font-size:0.8em;
   padding: 1px 20px;
   border-radius: 5px;
   cursor:pointer;
   opacity: 0.7;
}
.add:hover {
   opacity: 1;
}
.slide-enter-active {
   transition: all 0.1s ease;
}

.slide-leave-active {
  transition: all 0.1s ease;
}

.slide-enter-to, .slide-leave {
   max-height: auto;
   overflow: hidden;
}

.slide-enter, .slide-leave-to {
   overflow: hidden;
   max-height: 0;
}
</style>
