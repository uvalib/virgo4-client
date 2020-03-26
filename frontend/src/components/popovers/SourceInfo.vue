<template>
   <v-popover placement="top-end" class="source-info">
      <span class="text-button trigger">What am I searching&nbsp;<i class="fas fa-question-circle"></i></span>
      <div class="source-info-popover" slot="popover">
         <div class="popover-title">
            <i v-close-popover class="close fas fa-times-circle"></i>
         </div>
         <div class="source-info">
            Resource Types are collections of related items that are available to be searched by Virgo.
         </div>
      </div>
   </v-popover>
</template>

<script>

export default {
};
</script>
<style scoped>
i.fas.fa-times-circle.close {
   opacity: 0.8;
   font-size: 1.25em;
   float:right;
   margin-right: 8px;
   display:block;
   cursor: pointer;
}
.source-info-popover {
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
.source-info-popover .popover-title {
   padding: 8px 0 12px 0;
   margin: 0;
   text-align: right;
   background: white;
   border: 1px solid var(--uvalib-grey-dark);
   border-bottom: 0;
   border-radius: 5px 5px 0 0;
}
div.source-info {
   margin: 0;
   padding: 15px 20px 15px 20px;
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
div.v-popover.source-info {
   margin:0;
   padding:0;
   border: 0;
}
</style>
