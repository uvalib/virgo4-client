<template>
   <div id="search-tips">
      <VirgoButton text ref="trigger" @click="showDialog = true" label="Help me search"/>
      <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Help me search" :draggable="false">
         <div class="tips">
            <div class="section">How to search</div>
            <ul class="dots">
               <li>Selecting "Everything" will result in a sorted list of any record in Virgo.</li>
               <li>Selecting "Catalog Only" results only in items UVA owns, minus articles and images.</li>
               <li>After searching, you can use Filters to narrow your query.</li>
            </ul>
            <div class="section">Search tips</div>
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
            <div class="note">
               <a href="https://guides.lib.virginia.edu/virgo" target="_blank" aria-describedby="guide-window">
                  Learn more about using Virgo<i style="margin-left:0.5rem;" class="fal fa-external-link-alt"></i>
               </a>
               <span id="guide-window" class="screen-reader-text">(opens in a new window)</span>
            </div>
         </div>
      </Dialog>
   </div>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import analytics from '@/analytics'
import { ref } from 'vue'

const showDialog = ref(false)
const trigger = ref(null)

const showDisclosure = (() => {
   analytics.trigger('Help', 'SEARCH_TIPS')
})
</script>

<style lang="scss" scoped>
div.tips {
   display: flex;
   flex-direction: column;
   gap: 1rem;
   .section {
      font-weight: bold;
   }
   ul.dots {
      list-style-type: disc;
   }
   ul {
      list-style-type: none;
      padding: 0 0 0 20px;
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
