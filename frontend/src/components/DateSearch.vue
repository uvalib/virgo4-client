<template>
   <tr>
      <td class="label">Date Is</td>
      <td class="dates">
          <select class="date-range-type" v-model="dateRangeType">
            <option value="EQUAL">EQUAL TO</option>
            <option value="AFTER">AFTER</option>
            <option value="BEFORE">BEFORE</option>
            <option value="BETWEEN">BETWEEN</option>
         </select>
         <input @keyup.enter="searchClicked" v-model="date0" type="text">
         <span v-if="dateRangeType=='BETWEEN'">
            <span class="date-sep">-</span>
            <input @keyup.enter="searchClicked" v-model="date1" type="text">
         </span>
      </td>
      <td class="op"><SearchOpPicker v-model="dateRangeOp"/></td>
   </tr>
</template>

<script>
import { mapFields } from 'vuex-map-fields'
import SearchOpPicker from "@/components/SearchOpPicker"
export default {
   components: {
     SearchOpPicker
   },
   computed: {
      ...mapFields('query',[
         'date0', 'date1',
         'dateRangeType',
         'dateRangeOp',
      ]),
   },
   methods: {
      searchClicked() {
        this.$store.dispatch("doSearch")
      },
   }
};
</script>

<style scoped>
td.dates {
   text-align: left;
}
td.label {
  font-weight: 500;
  text-align: right;
  padding-right: 10px;
  width:1%;
  white-space:nowrap;
  color: #777;
}
.date-range-type {
   margin-right: 10px;
}
table td.op{
  width:1%;
  white-space:nowrap;
  padding: 0 0 0 10px;
  color: #777;
}
.date-sep {
   font-weight: bold;
   margin: 0 1vw;
}
</style>
