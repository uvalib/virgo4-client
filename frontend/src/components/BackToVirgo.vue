<template>
   <div class="controls">
      <span @click="goBack" class="pure-button pure-button-primary"><i class="fas fa-arrow-circle-left"></i>&nbsp;Return to search</span>
   </div>
</template>

<script>
export default {
   methods: {
      goBack() {
         this.$router.go(-1)
      }
   }
}
</script>

<style scoped>
.controls {
   margin: 25px 0;
   text-align: right;
   font-size: 0.9em;
}
</style>
