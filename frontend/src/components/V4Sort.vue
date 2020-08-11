<template>
   <div class="v4-sort">
      <label class="sort" for="sort-opt">Sort by</label>
      <select v-if="canSort" v-model="activeSort" id="sort-opt" name="sort-opt" @change="sortChanged">
         <option v-for="(option) in sortOptions" :key="option.id" :value="option.id ">
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
      sortChanged() {
         let query = Object.assign({}, this.$route.query)
         query.sort = this.activeSort
         this.$store.dispatch("sort/applPoolSort", {poolID: this.pool.id, sort: this.activeSort})
         this.$store.dispatch("searches/updateHistory")
         this.$router.push({query})
      }
   },
   computed: {
      ...mapGetters({
         sortingSupport: 'pools/sortingSupport',
         currentPoolSort: 'sort/currentPoolSort'
      }),
      ...mapFields({
         activeSort: 'sort.activeSort',
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
               let asc_label = "ascending"
               if (so.asc !== "") {
                  asc_label = so.asc
               }

               let desc_label = "descending"
               if (so.desc !== "") {
                  desc_label = so.desc
               }

               out.push({id: so.id+"_asc", name: so.label+": "+asc_label })
               out.push({id: so.id+"_desc", name: so.label+": "+desc_label })
            }
         })
         return out
      },
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
      &:focus {
         @include be-accessible();
      }
   }
   .sort-type {
      margin-left: 5px;
   }
}
</style>
