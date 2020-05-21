<template>
   <v-popover placement="top-end" class="source-info" trigger="manual" :open="isOpen" @hide="hide" @show="opened">
      <V4Button mode="text" :aria-pressed="isOpen" @click="toggle" @esc="hide">
         What am I searching&nbsp;<i class="fas fa-question-circle"></i>
      </V4Button>
      <div class="source-info-popover" slot="popover">
         <div tabindex="-1" id="what-pop" class="popover-title">
            What am I searching?
         </div>
         <div class="source-info">
            Resource Types are collections of related items that are available to be searched by Virgo.
         </div>
         <div class="ctls">
             <V4Button mode="tertiary" class="close" @click="hide">Close</V4Button>
         </div>
      </div>
   </v-popover>
</template>

<script>
export default {
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
      },
      opened() {
         setTimeout(()=>{
            document.getElementById("what-pop").focus()
         },300)
      },
   }
};
</script>
<style lang="scss" scoped>
.source-info-popover {
   background: white;
   box-shadow: $v4-box-shadow;
   color: var(--uvalib-text);
   font-size: 0.9em;
   font-weight: normal;
   display: inline-block;
   border-radius: 5px;
   border: 1px solid var(--uvalib-grey-dark);
   max-width: 350px;

   .popover-title {
      padding: 5px 10px;
      color: white;
      background-color: var(--uvalib-grey-dark);
      font-weight: 500;
      text-align: center;
   }

   .source-info {
      margin: 0;
      padding: 15px 20px;
      font-weight: normal;
   }

   .ctls {
      font-size: 0.9em;
      text-align: right;
      margin: 0 5px;
   }
}
</style>
