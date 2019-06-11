<template>
   <div v-if="areWarningsEnabled && showWarn" class="warn-info">
      <p class="warn-header">Warnings</p>
      <div class="warn-list">
         <div class="info" v-for="(w, idx) in warnings" :key="idx">
            <span class="value">{{ w }}</span>
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
         showWarn: state => state.showWarn,
      }),
      ...mapGetters({
        areWarningsEnabled: 'areWarningsEnabled',
      }),
   },
   props: {
      warnings: Array,
   },
}
</script>

<style scoped>
.warn-info {
   text-align: left;
   padding: 0;
}
.warn-list {
   font-size: 0.9em;
   padding: 5px 20px;
   border: 1px solid #ccc;
   border-top: 0;
   border-radius: 0 0 10px 10px;
}
.warn-header {
   margin: 10px 0 0 0;
   padding: 2px 15px;
   background: #ecc;
   border-radius: 10px 10px 0 0;
   font-size: 0.9em;
}
</style>
