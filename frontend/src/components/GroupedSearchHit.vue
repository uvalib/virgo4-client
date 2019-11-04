<template>
   <div class="grouped-hit">
      <div class="group-header">
         <span>Grouped Result&nbsp;<span class="count">({{hit.count}} copies)</span></span>
         <i class="group-icon fas fa-layer-group"></i>
      </div>
      <div class="details">
         <SearchHitHeader :hit="hit" :pool="pool"/>
         <span v-if="hit.count>0" @click="toggleExpandClicked" class="pure-button pure-button-primary all">
            {{detailsButtonText}}
         </span>
         <transition name="grow"
            v-on:before-enter="beforeEnter" v-on:enter="enter"
            v-on:before-leave="beforeLeave" v-on:leave="leave">
            <div v-if="hit.expanded" class="expanded">
               <div class="group-item-wrapper" v-for="(groupHit,idx) in hit.group" :key="idx">
                  <SearchHit :pool="pool" :hit="groupHit" :key="idx"/>
               </div>
            </div>
         </transition>
      </div>
   </div>
</template>

<script>
import SearchHitHeader from '@/components/SearchHitHeader'
import SearchHit from '@/components/SearchHit'
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true},
      hitIdx: {type: Number, required: true}
   },
   components: {
      SearchHitHeader, SearchHit
   },
   computed: {
      detailsButtonText() {
         if (this.hit.expanded) {
            return "Hide all copies"
         }
         return "See all copies"
      }
   },
   methods: {
      fieldValueString( field ) {
         if ( Array.isArray(field.value)) {
            return field.value.join(", ")
         }
         return field.value
      },
      toggleExpandClicked() {
         this.$store.commit("toggleGroupExpanded", this.hitIdx)
      },
       beforeEnter: function(el) {
         el.style.height = '0'
      },
      enter: function(el) {
         el.style.height = (el.scrollHeight-20) + 'px'
         this.expandedItem = el
      },
      beforeLeave: function(el) {
         el.style.height = (el.scrollHeight-20) + 'px'
         this.expandedItem = el
      },
      leave: function(el) {
         el.style.height = '0'
      }
   }
};
</script>

<style scoped>
.grouped-hit {
   width: 100%;
   border-top: none;
   border-left: 5px solid var(--color-lightest-blue);
   padding: 00px;
   box-sizing: border-box;
   text-align: left;
   font-size: 0.8em;
}
.expanded {
   overflow: hidden;
   transition: 250ms ease-out;
}
.summary {
   padding-bottom: 5px;
   display: flex; 
   flex-flow: row nowrap;
   justify-content: center;
}
.collapse {
   margin-left: auto;
   font-size: 1.5em;
   color: var(--color-light-blue);
   cursor: pointer;
}
.group-item-wrapper {
   border-top: 1px solid #ccc;
}
.group-item-wrapper:first-child {
   border-top: 0;
}
.grouped-hit:nth-last-of-type(2n+0) /*clear bottom border on last hit*/ {
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
