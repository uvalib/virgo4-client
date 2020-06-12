<template>
   <V4Disclosure id="iiif-info" :closeOnBlur="false" ref="disclosure">
      <template v-slot:summary>
         <span>What is <img src="../../assets/iiif_icon.png"/>&nbsp;?</span>
         
      </template>
      <template v-slot:content>
         <div class="content">
            IIIF is an initialism that stands for the International Image Interoperability Framework.
            For more details, click <a @blur="blurred" href="https://iiif.io/community/faq/#what-is-iiif" target="_blank">here</a>.
            <p>To view the IIIF manifest for this image, click the IIIF icon. This manifest can be used to view the 
               image in a variety of 3rd party viewers.
            </p>
         </div>
      </template>
   </V4Disclosure>
</template>

<script>
export default {
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
