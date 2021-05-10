<template>
   <V4Disclosure id="iiif-info" :closeOnBlur="false" ref="disclosure" align="left">
      <template v-slot:summary>
         <span>About this collection</span>
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
#iiif-info {
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
