<template>
   <div class="filter-sidebar" :class="{overlay: !startExpanded}" v-if="resultStore.hasResults == false && !resultStore.searching">
      <div class="filters">
          <AccordionContent class="filter" id="acc-filter-sidebar"
            background="var(--uvalib-brand-blue)"
            color="white" :expanded="startExpanded"
            borderColor="var(--uvalib-brand-blue)"
            :invert="!startExpanded">
            <template v-slot:title>Filters</template>
            <div class="body">
               <div v-if="filters.getPresearchFacets" class="working">
                  <V4Spinner message="Loading filters..."/>
               </div>

               <template v-else v-for="filterInfo in filters.preSearchFilters.filter( f=> f.hidden !== true)" :key="filterInfo.id">
                  <AccordionContent
                     :id="`${filterInfo.id}-acc`"
                     class="filter-list"
                     background="var(--uvalib-grey-lightest)"
                     borderWidth="1px"
                  >
                     <template v-slot:title>
                        <span :aria-label="`see more ${filterInfo.name} filters`">{{filterInfo.name}}</span>
                     </template>
                     <div class="expanded-item" v-for="fv in filterInfo.buckets.filter(f => f.value)" :key="fv.value">
                        <Checkbox  v-model="fv.selected" :inputId="`${filterInfo.id}-${fv.value}`" :binary="true" />
                        <label :for="`${filterInfo.id}-${fv.value}`" class="cb-label">{{fv.value}}</label>
                        <span class="cnt" v-if="fv.count">({{$formatNum(fv.count)}})</span>
                     </div>
                  </AccordionContent>
               </template>

            </div>
          </AccordionContent>
      </div>
   </div>
</template>

<script setup>
import AccordionContent from "@/components/AccordionContent.vue"
import Checkbox from 'primevue/checkbox'
import { computed } from 'vue'
import { useSystemStore } from "@/stores/system"
import { useResultStore } from "@/stores/result"
import { useFilterStore } from "@/stores/filter"

const resultStore = useResultStore()
const systemStore = useSystemStore()
const filters = useFilterStore()

const startExpanded = computed(()=> {
   return systemStore.displayWidth > 810
})

</script>
<style lang="scss" scoped>
.filter-sidebar.overlay {
   position: fixed;
   left: 0px;
   right: 0px;
   z-index: 5000;
   bottom: 0px;
   padding: 0;
   margin: 0 5px;
   display: flex;
   flex-flow: row nowrap;
   justify-content: space-between;
   border-radius: 0;
   min-height: 25px;
   background: transparent;
   border-top: 2px solid white;
   border-right: 2px solid white;
   border-left: 2px solid white;
   .filters {
      width: 100%;
   }
   .body {
      max-height: 400px;
      overflow: scroll;
   }
}
.working {
   color: var(--uvalib-text);
   text-align: center;
   background: white;
   position: absolute;
   left: 0;
   right: 0;
   padding: 25px 15px;
   bottom: 0;
   top: 0;
   z-index: 50;
   opacity: 0.9;
   font-size: 1.25em;
   font-weight: bold;
}
.filter-sidebar {
   margin: 0px 25px 15px 0px;
   border-radius: 5px 5px 0 0;
   flex-basis: 25%;
   min-width: 200px;
   display: inline-block;

   .filters {
      outline: 1px solid var(--uvalib-grey-light);
      .body {
         border-top: 0;
         text-align: left;
         padding: 10px;
         margin: 0;
         background: white;
         position: relative;
         min-height: 80px;
         min-height: 150px;
      }
   }
}
.heading {
   background-color: var(--uvalib-brand-blue);
   text-align: left;
   padding: 5px 10px;
   color: white;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: space-between;
   cursor: pointer;
}
.filter-list {
   margin-bottom: 10px;
}
.expanded-item {
   padding: 3px 0 3px 10px;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: flex-start;
   font-weight: normal;
   border-bottom: 1px solid var(--uvalib-grey-lightest);
}
.expanded-item:first-child {
   margin-top: 10px;
}
span.cnt {
   margin-right: 10px;
   margin-left: auto;
   font-size: 0.8em;
}
</style>
