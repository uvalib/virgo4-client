<template>
   <v-popover>
      <span class="trigger">
         <span v-if="icon"><i class="fas fa-comments"></i>&nbsp;</span>
         <span>Questions? Ask a Librarian</span>
      </span>
      <div class="feedback-container" slot="popover">
         <div class="popover-header">
            <span>Coming in 2020!</span>
            <i v-close-popover class="close fas fa-times-circle"></i>
         </div>
         <div class="message">
            <p>For now, direct all Virgo4 feedback to:</p>
            <p>
               <a class="feedback"
                  href="mailto:lib-virgo4-feedback@virginia.edu">lib-virgo4-feedback@virginia.edu</a>
            </p>
         </div>
      </div>
   </v-popover>
</template>

<script>

export default {
   props: {
      icon: Boolean
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
.feedback-container {
   background: white;
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
   color: var(--uvalib-text);
   font-size: 1em;
   font-weight: normal;
   display: inline-block;
   padding: 0;
   border-radius: 5px;
}
i.fas.fa-times-circle.close {
   font-size: 1.1em;
   float:right;
   margin-right: 8px;
}
i.fas.fa-times-circle.close:hover {
   opacity: 1;
   cursor: pointer;
}
div.message {
   padding: 20px;
   text-align: center;
   border-left: 1px solid var(--uvalib-grey-dark);
   border-right: 1px solid var(--uvalib-grey-dark);
   border-bottom: 1px solid var(--uvalib-grey-dark);
   border-radius: 0 0 5px 5px;
}
a.feedback {
   color: var(--color-link);
   font-weight: 500;
   text-decoration: none;
}
a.feedback:hover {
  text-decoration: underline;
}
</style>
