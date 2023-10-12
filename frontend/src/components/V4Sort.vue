<template>
   <div class="v4-sort">
      <label class="sort" for="sort-opt">Sort by</label>
      <select v-if="canSort" v-model="sortStore.activeSort" id="sort-opt" name="sort-opt" @change="sortChanged">
         <option v-for="(option) in poolStore.sortOptions(pool.id)" :key="option.id" :value="option.id ">
            {{ option.name }}
         </option>
      </select>
      <span v-else class="sort-type">Relevance</span>
   </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePoolStore } from "@/stores/pool"
import { useSortStore } from "@/stores/sort"
import { useRouter, useRoute } from 'vue-router'
import analytics from '@/analytics'

const router = useRouter()
const route = useRoute()
const poolStore = usePoolStore()
const sortStore = useSortStore()

const props = defineProps({
   pool: {
      type: Object,
      required: true
   },
})

const canSort = computed(() => {
   return poolStore.sortingSupport(props.pool.id)
})

const sortChanged = ( async () => {
   let query = Object.assign({}, route.query)
   query.sort = sortStore.activeSort
   analytics.trigger('Results', 'SORT_CHANGED', `${query.mode}|${sortStore.activeSort}`)
   router.push({query})
})
</script>

<style lang="scss" scoped>
div.v4-sort {
   background: white;
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
