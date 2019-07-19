<template>
   <p class="tips">
      <v-popover placement="top-end">
         <span class="trigger">Search Tips&nbsp;<i class="fas fa-info-circle"></i></span>
         <div class="tips-container" slot="popover">
            <h4>
               Search Tips
               <i v-close-popover class="close fas fa-times-circle"></i>
            </h4>
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
   </p>
</template>

<script>

export default {
};
</script>

<style scoped>
.tips-container {
   background: white;
   box-shadow: 2px 2px 10px #ccc;
   color: var(--color-primary-text);;
   font-size: 0.9em;
   font-weight: 100;
   display: inline-block;
   padding-bottom: 5px;
   border-radius: 10px;
}
.tips-container h4 {
   padding: 5px 40px;
   margin: 0;
   text-align: center;
   background: var(--color-primary-orange);
   color: white;
   position: relative;
   font-weight: 100;
   font-size: 0.9em;
   border-radius: 10px 10px 0 0;
}
div.tips {
   margin: 0;
   font-size: 0.9em;
   padding: 0px 20px 10px 20px;
}
ul {
   list-style-type: none;
   padding:0;
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
   opacity: 1;
}
p.tips {
  font-weight: bold;
  color:var(--color-link);
  cursor:pointer;
  margin:20px 0;
  opacity: 0.8;
  font-size: 12px;
  position: absolute;
  right:0;
  bottom:5px;
  margin:0;
}
p.tips:hover {
  opacity:1;
}
</style>
