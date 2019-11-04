<template>
   <div class="hit">
      <div class="group-header">
         <span>Grouped Result&nbsp;<span class="count">({{hit.count}} copies)</span></span>
         <i class="group-icon fas fa-layer-group"></i>
      </div>
      <div class="details">
         <SearchHitHeader :hit="hit" :pool="pool"/>
         <span v-if="hit.count>0" @click="viewClicked" class="pure-button pure-button-primary all">
            See all {{hit.count}} copies<i class="more-icon fas fa-external-link-alt"></i>
         </span>
      </div>
   </div>
</template>

<script>
import SearchHitHeader from '@/components/SearchHitHeader'
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true},
      hitIdx: {type: Number, required: true}
   },
   components: {
      SearchHitHeader
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
   border-top: none;
   border-left: 5px solid var(--color-lightest-blue);
   padding: 00px;
   box-sizing: border-box;
   text-align: left;
   font-size: 0.8em;
}
.hit:nth-last-of-type(2n+0) /*clear bottom border on last hit*/ {
  border-bottom: none;
}
.group-header {
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   justify-content: space-between;
   padding: 10px;
   font-weight: bold;
   text-transform: uppercase;
   background-color: var(--color-lightest-blue);
}
.group-header .count {
   font-weight: normal;
}
i.group-icon {
   font-size: 1.5em;
}
i.more-icon {
   margin-left: 8px;
}
.details {
   padding: 10px;
   background-color: white;
}
#app .details span.pure-button.pure-button-primary.all {
   margin: 10px 0 0 0;
   padding: 4px 8px;
   font-weight: bold;
   box-sizing: border-box;
   background-color: var(--color-light-blue);
}
</style>
