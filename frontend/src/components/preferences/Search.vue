<template>
   <div class="pool-options">
      <h2>Search Preferences</h2>
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
import { mapState } from "vuex"
export default {
   computed: {
      ...mapState({
         collapseGroups: state => state.preferences.collapseGroups,
      }),
   },
   methods: {
      collapseGroupsClicked() {
         this.$store.dispatch("preferences/toggleCollapseGroups")
      },
   }
};
</script>

<style lang="scss" scoped>
h2 {
   margin: 0;
   padding: 10px 15px;
   background: var(--uvalib-grey-lightest);
   border-bottom: 1px solid var(--uvalib-grey-light);
   font-size: 1.2em;
}
.grouping {
   padding: 5px 20px 20px 20px;
   .choice {
      margin: 5px 10px;
      width: 15px;
      height: 15px;
   }
}
div.toggle {
   cursor: pointer;
   &:focus {
      @include be-accessible();
   }
}
</style>