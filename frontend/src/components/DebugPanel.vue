<template>
   <div class="debug-info">
      <div class="info" v-for="(val, key) in debugInfo" :key="key">
         <label><i class="fas fa-bug"></i>&nbsp;{{ key }}:</label>
         <span class="value">{{ val }}</span>
      </div>
   </div>
</template>

<script>
export default {
   props: {
      debugInfo: Object,
   },
}
</script>

<style scoped>
.debug-info {
   border-top: 1px solid #eee;
   margin-top: 10px;
   padding-top: 10px;
}
label {
   font-weight: bold;
   width: 80px;
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
