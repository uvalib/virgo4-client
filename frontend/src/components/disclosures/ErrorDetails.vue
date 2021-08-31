<template>
   <V4Disclosure id="error-detail" :closeOnBlur="false" ref="disclosure"
      backgroundColor="white"
      borderColor="white"
      mode="inline"
   >
      <template v-slot:summary>
         <span>Details</span>
      </template>
      <template v-slot:content>
         <div class="content" v-html="details"></div>
      </template>
   </V4Disclosure>
</template>

<script>
export default {
   props: {
      details: {
         type: String,
         required: true
      }
   },
   methods: {
      blurred() {
         this.$refs.disclosure.hide()
      }
   }
}
</script>

<style lang="scss" scoped>
</style>
