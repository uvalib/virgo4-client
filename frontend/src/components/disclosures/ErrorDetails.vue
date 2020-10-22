<template>
   <V4Disclosure id="error-detail" :closeOnBlur="false" ref="disclosure"
      backgroundColor="white"
      borderColor="var(--uvalib-red)"
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
#error-detail {
   .content {
      margin: 15px;
      padding: 0;
   }
   img {
      height: 15px;
   }
   p {
      margin: 5px 0;
   }
}
</style>
