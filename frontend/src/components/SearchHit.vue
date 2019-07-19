<template>
   <div class="hit">
      <div>
         <label>Identifier:</label>
         <span class="value">{{hit.id}}</span>
      </div>
      <div>
         <label>Title:</label>
         <span class="value">{{fullTitle()}}</span>
      </div>
      <div>
         <label>Author:</label>
         <span class="value">{{hit.author}}</span>
      </div>
      <DebugPanel v-if="hit.debug" :debugInfo="hit.debug"/>
   </div>
</template>

<script>
import DebugPanel from "@/components/diagnostics/DebugPanel"
export default {
   props: {
      hit: { type: Object, required: true}
   },
   components: {
      DebugPanel
   },
   methods: {
      fullTitle() {
         if (this.hit.subtitle) {
            return this.hit.title + " " + this.hit.subtitle
         }
         return this.hit.title
      },
   }
};
</script>

<style scoped>
.hit {
   width: 100%;
   border: 1px solid #ccc;
   border-top: none;
   padding: 10px;
   box-sizing: border-box;
   text-align: left;
}
label {
   font-weight: bold;
   width: 80px;
   text-align: right;
   margin-right: 10px;
   display: inline-block;
}
</style>