<template>
   <div class="v4-sort">
      <label class="sort" for="sort-opt">Sort by</label>
      <select v-model="selectedSort" id="sort-opt" name="sort-opt">
         <option v-for="(option) in sortOptions" :key="option.id" :value="option.id ">
            {{ option.name }}
         </option>
      </select>
   </div>
</template>

<script>
export default {
   props: {
      pool: {
         type: Object,
         required: true
      },
      sort: {
         type: Object,
         required: true
      }
   },
   data: function()  {
      return {
         selectedSort: this.sortIdString
      }
   },
   computed: {
      sortIdString() {
         return this.sort.sort_id+this.sort.order
      },
      sortOptions() {
         let out = [] 
         this.pool.sort_options.forEach( so => {
            if (so.id === 'SortRelevance') {
               out.push({id: so.id, name: so.label })
            } else {
               out.push({id: so.id+"ASC", name: so.label+" (Ascending)" })   
               out.push({id: so.id+"DESC", name: so.label+" (Descending)" })     
            }
         })
         return out
      }
   }
}
</script>

<style scoped>
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