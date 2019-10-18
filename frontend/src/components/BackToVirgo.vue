<template>
   <div class="controls">
      <router-link :to="backURL">
         <span class="pure-button pure-button-primary"><i class="fas fa-arrow-circle-left"></i>&nbsp;Return to search</span>
      </router-link>
   </div>
</template>

<script>
export default {
   props: {
      backURL: {
         type: String,
         default: "/"
      }
   },
}
</script>

<style scoped>
.controls {
   margin: 25px 0;
   text-align: right;
   font-size: 0.9em;
}
</style>
