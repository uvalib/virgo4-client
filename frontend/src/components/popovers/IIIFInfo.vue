<template>
   <v-popover placement="top-end" class="iiif-info" trigger="manual" :open="isOpen" @hide="hide">
      <V4Button mode="icon" :aria-pressed="isOpen" @click="toggle" @esc="hide">
         <i class="fas fa-question-circle"></i>
      </V4Button>
      <div class="iiif-info-popover" slot="popover">
         <div class="popover-title">
            What is IIIF?
            <i v-close-popover class="close fas fa-times-circle"></i>
         </div>
         <div class="iiif-info">
            IIIF is an initialism that stands for the International Image Interoperability Framework.
            For more details, click <a href="https://iiif.io/community/faq/#what-is-iiif" target="_blank">here</a>.
            <p>To view the IIIF manifest for this image, click the IIIF icon. This manifest can be used to view the 
               image in a variety of 3rd party viewers.
            </p>
         </div>
      </div>
   </v-popover>
</template>

<script>
import V4Button from "@/components/V4Button"
export default {
   components: {
     V4Button
   },
   data: function() {
      return {
         isOpen: false
      }
   },
   methods: {
      hide() {
         this.isOpen = false
      },
      toggle() {
         this.isOpen = !this.isOpen
      }
   }
}

</script>
<style scoped>
i.fas.fa-times-circle.close {
   opacity: 0.8;
   font-size: 1.1em;
   float:right;
   margin-right: 8px;
}
i.fas.fa-times-circle.close:hover {
   opacity: 1;
   cursor: pointer;
}
.iiif-info-popover {
   background: white;
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
   color: var(--uvalib-text);
   font-size: 1em;
   font-weight: normal;
   display: inline-block;
   border-radius: 5px;
   border-bottom: 1px solid var(--uvalib-grey-dark);
    max-width: 350px;
}
.iiif-info-popover .popover-title {
   padding: 8px 0 6px 0;
   margin: 0;
   text-align: center;
   background: var(--uvalib-grey-dark);
   color: white;
   font-weight: normal;
   border-radius: 5px 5px 0 0;
   border-top: 1px solid var(--uvalib-grey-dark);
   border-left: 1px solid var(--uvalib-grey-dark);
   border-right: 1px solid var(--uvalib-grey-dark);
   font-size: 1.25em;
   font-weight: bold;
}
div.iiif-info {
   margin: 0;
   padding: 10px 20px 10px 20px;
   font-weight: normal;
   border-right: 1px solid var(--uvalib-grey-dark);
   border-left: 1px solid var(--uvalib-grey-dark);
}
span.trigger:hover {
   text-decoration: underline;
}
span.text-button.trigger {
   opacity: 1;
   font-weight: normal;
}
div.v-popover.iiif-info {
   margin:0;
   padding:0;
   border: 0;
}
</style>
