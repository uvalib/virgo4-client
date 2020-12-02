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
.grouping {
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
}
div.toggle {
   cursor: pointer;
   &:focus {
      @include be-accessible();
   }
}
</style>