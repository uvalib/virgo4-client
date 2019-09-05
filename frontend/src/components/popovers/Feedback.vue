<template>
   <p class="feedback">
      <v-popover>
         <span class="text-button trigger">
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
   </p>
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
   background-color: var(--color-primary-orange);
   font-size: 1.15em;
   font-weight: bold;
   border-radius: 5px 5px 0 0;
}
.feedback-container {
   background: white;
   box-shadow: 1px 1px 15px #333;
   color: var(--color-primary-text);
   font-size: 0.9em;
   font-weight: 500;
   display: inline-block;
   padding: 0;
   border-radius: 5px;
}
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
span.text-button.trigger {
   opacity: 1;
   font-weight: 500;
   color: white;
}
p.feedback {
   display: inline-block;
   color: white;
   margin: 0;
}
div.message {
   padding: 20px;
   text-align: center;
   border-left: 5px solid var(--color-primary-orange);
   border-right: 5px solid var(--color-primary-orange);
   border-bottom: 5px solid var(--color-primary-orange);
   border-radius: 0 0 5px 5px;
}
a.feedback {
   color: var(--color-link);
   font-weight: 500;
   text-decoration: none;
}
#app p.feedback .text-button:hover {
   text-decoration: none;
} 
</style>
