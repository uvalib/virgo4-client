<template>
   <v-popover placement="top-end" class="tips">
      <span class="text-button trigger">Search Tips&nbsp;<i class="fas fa-info-circle"></i></span>
      <div class="tips-popover" slot="popover">
         <div class="popover-title">
            Search Tips
            <i v-close-popover class="close fas fa-times-circle"></i>
         </div>
         <div class="tips">
            <ul>
               <li class="no-pad">
                  <p>Use quotation marks to find exact phrases:</p>
                  <p class="example">"grapes of wrath"</p>
               </li>
               <li>
                  <p>Use uppercase OR, AND, and NOT to create complex searches:</p>
                  <p class="example">kyoto NOT protocol</p>
                  <p class="example">"frida kahlo" AND exhibitions</p>
               </li>
               <li>
                  <p>Use parentheses to group parts of your search:</p>
                  <p class="example">(calico OR "tortoise shell") AND cats</p>
               </li>
            </ul>
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
   font-size: 1.1em;
   float:right;
   margin-right: 8px;
}
i.fas.fa-times-circle.close:hover {
   opacity: 1;
   cursor: pointer;
}
.tips-popover {
   background: white;
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
   color: var(--uvalib-text);
   font-size: 1em;
   font-weight: normal;
   display: inline-block;
   border-radius: 5px;
   border-bottom: 1px solid var(--uvalib-grey-dark);
}
.tips-popover .popover-title {
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
div.tips {
   margin: 0;
   padding: 10px 20px 10px 20px;
   font-weight: normal;
   border-right: 1px solid var(--uvalib-grey-dark);
   border-left: 1px solid var(--uvalib-grey-dark);
}
ul {
   list-style-type: none;
   padding:0;
   margin: 0;
}
ul p {
   margin: 0;
}
ul li {
   padding-top: 20px;
}
ul li.no-pad {
   padding-top: 5px;
}
p.example {
   margin: 5px 0 0 25px;
   font-family: monospace;
   font-size: 1.2em;
}
span.trigger:hover {
   text-decoration: underline;
}
span.text-button.trigger {
   opacity: 1;
   font-weight: normal;
}
div.v-popover.tips {
   margin:0;
   padding:0;
   border: 0;
}
</style>
