<template>
   <V4Popover class="iiif-info" id="iiifpop" title="What is IIIF?" maxWidth="350px">
      <template v-slot:trigger>
         <i class="fas fa-question-circle"></i>
      </template>
      <template v-slot:content>
         <div class="iiif-info">
            IIIF is an initialism that stands for the International Image Interoperability Framework.
            For more details, click <a href="https://iiif.io/community/faq/#what-is-iiif" target="_blank">here</a>.
            <p>To view the IIIF manifest for this image, click the IIIF icon. This manifest can be used to view the 
               image in a variety of 3rd party viewers.
            </p>
         </div>
      </template>
   </V4Popover>
</template>

<script>
export default {
}

</script>
<style lang="scss" scoped>
</style>
