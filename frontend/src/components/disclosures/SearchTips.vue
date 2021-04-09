<template>
   <V4Disclosure id="search-tips" ref="tipsdisclose" @click="clicked">
      <template v-slot:summary>
         <span>Help me search</span>
      </template>
      <template v-slot:content>
         <div class="tips">
            <p class="section">How to search</p>
            <ul class="dots">
               <li>Selecting "Everything" will result in a sorted list of any record in Virgo.</li>
               <li>Selecting "Catalog Only" results only in items UVA owns, minus articles and images.</li>
               <li>After searching, you can use Filters to narrow your query.</li>
            </ul>
             <p class="section pad">Search tips</p>
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
               <li>
                  <p>Use an asterisk ( * ) for wildcard searches:</p>
                  <p class="example">octo*<br/>Returns both "octopus" and "octothorpe".</p>
               </li>
            </ul>
            <div class="note">
               <b>NOTE: </b>Nested parentheses within a query are not supported.
            </div>
         </div>
       </template>
   </V4Disclosure>
</template>

<script>
export default {
   methods: {
      clicked() {
         if ( this.$refs.tipsdisclose.showFull) {
            this.$analytics.trigger('Help', 'SEARCH_TIPS')
         }
      }
   }
}
</script>

<style lang="scss" scoped>
div.tips {
   margin: 5px 10px;
   font-weight: normal;
   p.section {
      font-weight: bold;
      margin: 15px 0 0 0;
      font-size: 1.15em;
   }
   .section.pad {
      margin-top: 30px;
   }

   .note {
      margin: 25px 0 10px 0;
   }
   ul.dots {
      list-style-type: disc;
   }
   ul {
      list-style-type: none;
      padding: 0px 0 0 20px;
      margin: 0;
   }
   ul p {
      margin: 0;
      font-weight: 500;
   }
   ul li {
      padding-top: 10px;
   }
   p.example {
      margin: 5px 0 0 25px;
      font-family: monospace;
      font-size: 1.2em;
   }
}
</style>
