<template>
   <v-popover class="popover" trigger="manual" :open="isOpen" @hide="hide">
      <V4Button mode="icon" :aria-pressed="isOpen" @click="toggle" @esc="hide">
         <i class="fas fa-exclamation-triangle"></i>
      </V4Button>
      <div class="container" slot="popover">
         <div class="popover-header">
            <span>Availability Notice</span>
            <i v-close-popover class="close fas fa-times-circle"></i>
         </div>
         <div class="message">
            <p style="white-space: pre-line;">{{ message }}</p>
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
   props: {
      message: String
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
};
</script>

<style scoped>
div.popover-header {
   padding: 6px 0px 6px 8px;
   color: white;
   background-color: var(--uvalib-grey-dark);
   font-size: 1.15em;
   font-weight: bold;
   border-radius: 5px 5px 0 0;
}
.container {
   max-width: 30em;
   background: white;
   box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
   color: var(--uvalib-text);
   font-size: 1em;
   font-weight: normal;
   display: inline-block;
   padding: 0;
   border-radius: 5px;
}
i.fas.fa-times-circle.close {
   font-size: 1.1em;
   float: right;
   margin-right: 8px;
}
i.fas.fa-times-circle.close:hover {
   opacity: 1;
   cursor: pointer;
}
div.message {
   padding: 20px;
   border-left: 1px solid var(--uvalib-grey-dark);
   border-right: 1px solid var(--uvalib-grey-dark);
   border-bottom: 1px solid var(--uvalib-grey-dark);
   border-radius: 0 0 5px 5px;
}
.popover {
   display: inline;
}
.trigger {
   color: var(--uvalib-yellow);
}
</style>
