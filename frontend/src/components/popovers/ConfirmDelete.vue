<template>
   <v-popover>
      <span class="trigger">
         <i class="trash fas fa-trash-alt"></i>
      </span>
      <div class="confirm-container" slot="popover">
         <div class="popover-header">
            <span>Confirm Delete</span>
         </div>
         <div class="message">
            <slot/>
            <p>Continue?</p>
         </div>
         <div class="confirm-controls">
            <span v-close-popover class="pure-button pure-button-secondary">Cancel</span>
            <span class="pure-button pure-button-primary"
               @click="$emit('delete-approved')" v-close-popover >
               OK
            </span>
         </div>
      </div>
   </v-popover>
</template>

<script>

export default {
};
</script>

<style scoped>
i.trash {
   color: #999;
   cursor: pointer;
   font-size: 1.2em;
   padding: 2px 8px 2px 0;
   margin-right: 5px;
}
div.popover-header {
   padding: 5px 15px;
   color: white;
   background-color: var(--color-primary-orange);
   font-weight: 500;
   text-align: center;
   border-radius: 5px 5px 0 0;
}
.confirm-container {
   background: white;
   box-shadow: 1px 1px 15px #333;
   color: var(--color-primary-text);
   font-size: 0.9em;
   font-weight: 500;
   display: inline-block;
   padding: 0;
   border-radius: 5px;
}
div.message {
   padding: 10px 10px 0 10px;
   border-left: 3px solid var(--color-primary-orange);
   border-right: 3px solid var(--color-primary-orange);
}
.message p {
   margin: 0;
   padding: 5px 0;
   text-align: right;
}
.confirm-controls {
   font-size: 0.9em;
   padding: 10px;
   text-align: right;
   border-left: 3px solid var(--color-primary-orange);
   border-right: 3px solid var(--color-primary-orange);
   border-bottom: 3px solid var(--color-primary-orange);
   border-radius: 0 0 5px 5px;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: space-evenly;
}
.confirm-controls .pure-button {
   margin-left: 5px;
}
span.pure-button {
   margin: 0 0 0 10px;
   border-radius: 5px;
   color: white;
   background-color: var(--color-primary-blue);
   flex: 1 1 auto;
} 

span.pure-button.pure-button-secondary {
   background-color: var(--color-pale-blue);
}
</style>
