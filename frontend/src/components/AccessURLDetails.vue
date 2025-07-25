<template>
   <div class="access-urls">
      <div class='provider' v-for="p in urls">
         <template v-if="p.links.length==1">
            <VirgoButton as="a" :href="p.links[0].url" target="_blank" size="small">
               {{ providerLabel(p.provider) }}
               <template v-if="p.links[0].label && p.links[0].label !='Access Online'">
                  ({{ p.links[0].label }})
               </template>
            </VirgoButton>
         </template>
         <template v-else>
            <div v-if="hasProviderInfo(p.provider)" class="header">
               <template v-if="providerHomepage(p.provider)">
                  <a class="provider-link" :aria-label="`${providerLabel(p.provider)} home page`" :href="providerHomepage(p.provider)" target="_blank" aria-describedby="new-window">
                     {{ providerLabel(p.provider) }}
                  </a>
               </template>
               <template v-else>
                  <span class='provider'>{{ providerLabel(p.provider) }}</span>
               </template>
            </div>
            <div class="links" :class="{indent: hasProviderInfo}">
               <div v-for="(l,idx) in providerLinks(p)" :key="`${l.url}-${idx}`">
                  <VirgoButton as="a" :label="linkLabel(l)" :href="l.url" target="_blank" aria-describedby="new-window" size="small"
                     :aria-label="`access ${props.title} ${l.label} with ${providerLabel(p.provider)}`"/>
               </div>
               <template v-if="props.mode=='brief' && remainingLinks(p)">
                  <div>see {{remainingLinks(p)}} more on details page</div>
               </template>
            </div>
         </template>
      </div>
   </div>
</template>

<script setup>
import { usePoolStore } from "@/stores/pool"

const props = defineProps({
   title: {
      type: String,
      required: true
   },
   pool: {
      type: String,
      required: true
   },
   urls: {
      type: Array,
      required: true
   }
})

const poolStore = usePoolStore()

const linkLabel = (( providerLink ) => {
   if (providerLink.label) return providerLink.label
   return providerLink.url
})

function hasProviderInfo(provider) {
   return poolStore.findProvider(props.pool, provider) != null
}
function providerLabel(provider) {
   let p = poolStore.findProvider(props.pool, provider)
   if ( p ) return p.label
   return provider
}
function providerHomepage(provider) {
   let p = poolStore.findProvider(props.pool, provider)
   if ( p ) return p.homepage_url
   return ""
}
function providerLinks( details ) {
   return details.links.slice(0,10)
}
function remainingLinks( details ) {
   if ( details.links.length <= 10) return 0
   return details.links.length - 10
}
</script>

<style lang="scss" scoped>
.access-urls {
   display: flex;
   flex-direction: column;
   gap: 5px;
}
span.provider {
   color: $uva-grey;
   font-weight:  bold;
}

.links.indent {
   margin: 0 0 0 20px;
}
.links, div.provider {
   word-break: break-word;
   -webkit-hyphens: auto;
   -moz-hyphens: auto;
   hyphens: auto;
   font-size: 1em;
   display: flex;
   flex-direction: column;
   gap: 5px;
   justify-content: flex-start;
   align-items: flex-start;
}
.provider-link {
   display: inline-flex;
   align-items: center;
   color: $uva-blue-alt-A;
   font-weight: 500 !important;
}
</style>
