<template>
   <div class="hit">
      <div class="group-header">
         <span>Grouped Result&nbsp;<span class="count">({{hit.count}} copies)</span></span>
         <i class="group-icon fas fa-layer-group"></i>
      </div>
      <div class="details">
         <table class="fields">
            <tr v-for="(field,idx) in hit.metadata" :key="idx">
               <td class="label">{{field.label}}:</td>
               <td class="value" v-html="fieldValueString(field)"></td>
            </tr>
         </table>
         <span @click="viewClicked" class="pure-button pure-button-primary all">
            See all {{hit.count}} copies
         </span>
      </div>
   </div>
</template>

<script>
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true},
      hitIdx: {type: Number, required: true}
   },
   methods: {
      fieldValueString( field ) {
         if ( Array.isArray(field.value)) {
            return field.value.join(", ")
         }
         return field.value
      },
      viewClicked() {
         this.$store.commit("selectGroupDetails", {pool: this.pool, hitIdx: this.hitIdx})
      }
   }
};
</script>

<style scoped>
.hit {
   width: 100%;
   border: 1px solid #ccc;
   border-top: none;
   padding: 00px;
   box-sizing: border-box;
   text-align: left;
   font-size: 0.8em;
}
.group-header {
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   justify-content: space-between;
   border-bottom: 1px solid #999;
   padding: 5px;
   background: #e5e5e5;
   font-weight: bold;
}
.group-header .count {
   font-weight: normal;
}
i.group-icon {
   font-size: 1.5em;
}
.details {
   padding: 10px;
   background: #f2f2f2
}
#app .details span.pure-button.pure-button-primary.all {
   margin: 10px 0 0 0;
   padding: 4px;
   box-sizing: border-box;
   width:100%;
   background-color: var(--color-pale-blue);
}
.hit table {
   table-layout: auto;
   border-collapse: collapse;
   width: 100%;
}
.hit table td.label {
   font-weight: bold;
   text-align: right;
   padding: 2px 5px;
   white-space: nowrap;
}
.hit table td.value {
   width: 100%;
   font-weight: normal;
}
</style>