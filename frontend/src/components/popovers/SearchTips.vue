<template>
   <V4Popover class="search-tips inline" id="tips" title="Search Tips">
      <template v-slot:trigger>Search Tips</template>
      <template v-slot:content>
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
            <div class="note">
               <b>NOTE: </b>Nested parentheses within a query are not supported
            </div>
         </div>
      </template>
   </V4Popover>
</template>

<script>
export default {
}
</script>

<style lang="scss" scoped>

div.tips {
   margin: 0;
   font-weight: normal;

   .note {
      margin: 25px 0 10px 0;
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
}
</style>
