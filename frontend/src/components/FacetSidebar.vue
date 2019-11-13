<template>
   <div class="facet-sidebar">
      <div class="heading">
         <span>Filter By</span>
         <i class="fas fa-filter"></i>
      </div>
      <div class="body">
         <dl>
            <dt>Availability</dt>
            <dd v-for="avail in availabilityOpts" :key="avail.id" @click="availSelected(avail)">
               <i v-if="isAvailSelected(avail)" class="check far fa-check-circle"></i>
               <i v-else class="check far fa-circle"></i>                                
               {{avail.name}}
            </dd>
         </dl>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
import { mapFields } from 'vuex-map-fields'
export default {
   components: {
   },
   data: function() {
      return {
      };
   },
   computed: {
      ...mapState({
      }),
       ...mapGetters({
      }),
      ...mapFields('filters',[
         'globalAvailability',
      ]),
      availabilityOpts() {
         return [
            {id: "any", name: "Any"},
            {id: "online", name: "Online"},
            {id: "shelf", name: "On Shelf"},
         ]
      }
   },
   methods: {
      availSelected(avail) {
         this.globalAvailability = avail
         this.$store.dispatch("searchAllPools")
      },
      isAvailSelected(avail) {
         return this.globalAvailability.id == avail.id
      }
   },
   created() {
   }
}
</script>

<style scoped>
.facet-sidebar {
   margin: 0px 15px 25px 0;
   border-radius: 5px 5px 0 0;
   flex: 1 1 25%;
   min-width: 200px;
   display: inline-block;
}
.body {
   border: 3px solid var(--color-brand-blue);
   border-top: 0;
   border-radius: 0 0 5px 5px;
   text-align: left;
   padding: 10px;
   margin: 0;
   font-size: 0.9em;
}
.heading {
   background-color: var(--color-brand-blue);
   text-align: left;
   padding: 5px 10px;
   color: white;
   border-radius: 5px 5px 0 0;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: space-between;
}
dl  {
   margin: 0;
   color: #444;
}
dt {
   font-weight: bold;
}
dd {
   cursor: pointer;
   font-size: 0.9em;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
   padding: 2px;
}
i.check {
   margin-right: 10px;
   color: var(--color-brand-blue);
   font-size: 1.25em;
}
</style>
