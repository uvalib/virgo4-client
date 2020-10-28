<template>
   <div class="pool-options">
      <h2>Search Preferences</h2>
      <div class="sets" v-if="isDevServer">
         <p>Use the alternate set of sources for searching?</p>
         <div class="check">
            <label>
               <input id="alt-sources" @change="toggleAltSources" class="choice"
                  :checked="!isDefaultSources" type="checkbox"
                  aria-label="toggle alternate search sources"/>Use Alternate Sources
            </label>
         </div>
      </div>
      <p v-if="isDefaultSources">
         Select which {{sourceLabel}}s you want to include in your search results,
         and which {{sourceLabel}} you prefer to see results from most.
      </p>
      <p v-else>
         Select which {{sourceLabel}}s you want to include in your search results.
      </p>
      <div class="pools">
         <div
            class="pool"
            v-for="p in pools"
            :key="p.id"
            v-bind:class="{excluded: isPoolExcluded(p)}"
         >
            <div class="name">
               <span>
                  <b>{{p.name}}</b>
               </span>
            </div>
            <div class="description">
               <span v-html="p.description"></span>
            </div>
            <div class="source-controls">
               <div
                  class="toggle"
                  tabindex="0"
                  role="checkbox"
                  :aria-label="`toggle inclusion of ${p.name} in search results`"
                  :aria-checked="(!isPoolExcluded(p)).toString()"
                  @click="toggleExcludePool(p)"
                  @keyup.stop.enter="toggleExcludePool(p)"
                  @keydown.space.prevent.stop="toggleExcludePool(p)"
               >
                  <span class="label">Include</span>
                  <i v-if="isPoolExcluded(p)" class="excluded far fa-circle"></i>
                  <i v-else class="selected fas fa-check-circle"></i>
               </div>
            </div>
         </div>
      </div>
      <div class="grouping">
         <p>
            Related search results are grouped under a single search result. By default, these grouped results are
            all visible. Check the box below to collapse them by default.
         </p>
         <div class="check">
            <label>
               <input id="collapse-pref" @change="collapseGroupsClicked" class="choice" :checked="collapseGroups" type="checkbox"
                  aria-label="toggle barcode group collapse functionality"/>Collapse Grouped Results
            </label>
         </div>
      </div>
   </div>
</template>
<script>
import { mapGetters } from "vuex";
import { mapState } from "vuex"
export default {
   computed: {
      ...mapGetters({
         isPoolExcluded: "preferences/isPoolExcluded",
         pools: "pools/sortedList",
         excludedPools: "preferences/excludedPools",
         isDevServer: 'system/isDevServer',
      }),
      ...mapState({
         sourceSet: state => state.preferences.sourceSet,
         sourceLabel: state => state.preferences.sourceLabel,
         collapseGroups: state => state.preferences.collapseGroups,
      }),
      isDefaultSources() {
         return this.sourceSet == 'default'
      }
   },
   methods: {
      collapseGroupsClicked() {
         this.$store.dispatch("preferences/toggleCollapseGroups")
      },
      toggleAltSources() {
         this.$store.dispatch("preferences/toggleAltSources")
      },
      async toggleExcludePool(pool) {
         if ( this.excludedPools.length == this.pools.length-1 && this.isPoolExcluded(pool) == false) {
            this.$store.commit(
               "system/setError",
               "At least one resource must be included"
            )
            return
         }
         await this.$store.dispatch("preferences/toggleExcludePool", pool)
         if (this.isPoolExcluded(pool)) {
            this.$analytics.trigger('Preferences', 'IGNORE_POOL', pool.name)
         } else {
            this.$analytics.trigger('Preferences', 'INCLUDE_POOL', pool.name)
         }
      }
   }
};
</script>

<style lang="scss" scoped>
.grouping {
   border-top: 1px solid var(--uvalib-grey-light);
   padding: 5px 10px;
   margin-top: 15px;
   .choice {
      margin: 5px 10px;
      width: 15px;
      height: 15px;
   }
}
.pool-options {
   h2 {
      margin: 5px 0 10px 0;
   }
   .sets {
      border-bottom: 1px solid var(--uvalib-grey-light);
      padding-bottom: 25px;
      margin-bottom: 10px;
      .check {
         .choice {
            margin: 5px 10px 5px 15px;
            width: 15px;
            height: 15px;
         }
      }
   }
   .pools {
      display: flex;
      flex-flow: row wrap;
      justify-content: center;

      div.pool {
         text-align: left;
         padding: 0;
         border-radius: 5px;
         margin: 5px;
         width: 300px;
         display: inline-block;
         font-size: 0.9em;
         box-shadow: $v4-box-shadow-light;
      }
   }
}
div.pool.excluded div.name {
   background: #aaa;
}
div.name {
   color: white;
   background: var(--color-brand-blue);
   padding: 6px 8px;
   border-radius: 5px 5px 0 0;
}
div.description {
   padding: 15px;
   border-right: 1px solid #ccc;
   border-left: 1px solid #ccc;
   margin: 0;
   font-size: 0.8em;
}
div.source-controls {
   font-size: 0.85em;
   padding: 5px;
   border: 1px solid #ccc;
   background-color: #f5f5f5;
   border-radius: 0 0 5px 5px;
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   justify-content: space-between;
}
div.toggle {
   cursor: pointer;
   &:focus {
      @include be-accessible();
   }
}
i.fas.selected {
   color: var(--color-pale-blue);
   margin-left: 10px;
   cursor: pointer;
   font-size: 1.25em;
   position: relative;
   top: 2px;
}
i.far.excluded {
   color: #999;
   margin-left: 10px;
   cursor: pointer;
   font-size: 1.25em;
   position: relative;
   top: 2px;
}
i.far.fa-star {
   margin-right: 10px;
   color: #999;
   cursor: pointer;
   font-size: 1.15em;
}
i.fas.fa-star {
   color: gold;
   margin-right: 10px;
   cursor: pointer;
   font-size: 1.15em;
}
</style>