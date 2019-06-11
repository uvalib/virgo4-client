<template>
   <div v-if="isDebugEnabled && showDebug" class="debug-info">
      <p class="debug-header">Debug Information</p>
      <div class="debug-list">
         <div class="info" v-for="(val, key) in debugInfo" :key="key">
            <label>{{ key }}:</label>
            <span class="value">{{ val }}</span>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import { mapGetters } from "vuex"
export default {
   computed: {
      ...mapState({
         showDebug: state => state.showDebug,
      }),
      ...mapGetters({
        isDebugEnabled: 'isDebugEnabled',
      }),
   },
   props: {
      debugInfo: Object,
   },
}
</script>

<style scoped>
.debug-info {
   text-align: left;
   padding: 0;
}
.debug-list {
   font-size: 0.9em;
   padding: 5px 20px;
   border: 1px solid #f0f0f0;
   border-top: 0;
   border-radius: 0 0 10px 10px;
}
.debug-header {
   margin: 10px 0 0 0;
   padding: 2px 10px;
   background: #f0f0f0;
   border-radius: 10px 10px 0 0;
   font-size: 0.9em;
}
label {
   font-weight: bold;
   text-align: right;
   margin-right: 10px;
   display: inline-block;
   text-transform: capitalize;
}
i.fas.fa-bug {
   font-size: 0.8em;
   color: #999;
}
</style>
