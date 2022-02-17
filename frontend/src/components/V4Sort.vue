<template>
   <div class="v4-sort">
      <label class="sort" for="sort-opt">Sort by</label>
      <select v-if="canSort" v-model="activeSort" id="sort-opt" name="sort-opt" @change="sortChanged">
         <option v-for="(option) in poolSortOptions(pool.id)" :key="option.id" :value="option.id ">
            {{ option.name }}
         </option>
      </select>
      <span v-else class="sort-type">Relevance</span>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
export default {
   props: {
      pool: {
         type: Object,
         required: true
      },
   },
   methods: {
      async sortChanged() {
         let query = Object.assign({}, this.$route.query)
         query.sort = this.activeSort
         this.$router.push({query})
      }
   },
   computed: {
      ...mapGetters({
         sortingSupport: 'pools/sortingSupport',
         poolSortOptions: 'pools/sortOptions',
         currentPoolSort: 'sort/currentPoolSort'
      }),
      ...mapFields({
         activeSort: 'sort.activeSort',
      }),
      canSort() {
         return this.sortingSupport(this.pool.id)
      }
   }
}
</script>

<style lang="scss" scoped>
$bkgcolor: white;

div.v4-sort {
   background: $bkgcolor;
   color: var(--uvalib-text);
   padding: 10px;
   margin-top: 3px;

   label {
      font-weight: bold;
   }
   select {
      margin-left: 10px;
      cursor: pointer;
      &:hover {
         text-decoration: underline;
      }
   }
   .sort-type {
      margin-left: 5px;
   }
}
</style>
