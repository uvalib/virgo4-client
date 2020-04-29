<template>
   <div class="v4-sort">
      <label class="sort" for="sort-opt">Sort by</label>
      <select v-if="canSort" v-model="selectedSort" id="sort-opt" name="sort-opt" @change="sortChanged">
         <option v-for="(option) in sortOptions" :key="option.id" :value="option.id ">
            {{ option.name }}
         </option>
      </select>
      <span v-else class="sort-type">Relevance</span>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import { mapFields } from "vuex-map-fields"
export default {
   props: {
      pool: {
         type: Object,
         required: true
      },
   },
   methods: {
      sortChanged() {
         this.$router.push({ query: Object.assign({}, this.$route.query, { sort: this.selectedSort }) });
         this.$store.dispatch("applySearchSort")
      }
   },
   computed: {
      ...mapFields({
        selectedSort: 'selectedResultsSort',
      }),
      ...mapGetters({
         sortingSupport: 'pools/sortingSupport'
      }),
      canSort() {
         return this.sortingSupport(this.pool.id)
      },
      sortOptions() {
         let out = []
         this.pool.sort_options.forEach( so => {
            if (/relevance/gi.test(so.id)) {
               out.push({id: so.id+"_desc", name: so.label })
            } else {
               out.push({id: so.id+"_asc", name: so.label+" (Ascending)" })
               out.push({id: so.id+"_desc", name: so.label+" (Descending)" })
            }
         })
         return out
      },
   }
}
</script>

<style scoped>
.sort-type {
   margin-left: 5px;
}
label {
   font-weight: bold;
}
div.v4-sort {
   background: white;
   color: var(--uvalib-text);
   padding: 10px;
   margin-top: 3px;
}
select {
   margin-left: 10px;
}
</style>