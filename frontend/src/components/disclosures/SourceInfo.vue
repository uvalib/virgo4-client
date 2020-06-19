<template>
   <V4Disclosure @click="clicked" ref="infodisclose" id="source-info">
      <template v-slot:summary>
         <span>What am I searching&nbsp;</span>
         <i class="fas fa-question-circle"></i>
      </template>
      <template v-slot:content>
         <p>
            Resource Types are collections of related items that are available to be searched by Virgo.
         </p>
       </template>
   </V4Disclosure>
</template>

<script>
export default {
   methods: {
      clicked() {
         if ( this.$refs.infodisclose.showFull) {
            this.$analytics.trigger('Help', 'WHAT_AM_I_SEARCHING')
         }
      }
   }
}
</script>

<style lang="scss" scoped>
   p {
      margin: 15px;
      padding: 0;
   }
</style>
