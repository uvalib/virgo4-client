<template>
   <div class="access-urls">
      <template v-for="(p) in urls" :key="idx">
         <div class='provider'>
            <template v-if="p.links.length==1">
               <a class="link-button" :href="p.links[0].url" target='_blank'
                  :aria-label="`access ${props.title} online with ${providerLabel(p.provider)}`"
               >
                  {{ providerLabel(p.provider) }}
                  <template v-if="p.links[0].label && hasProviderInfo(p.provider)">
                     ({{ p.links[0].label }})
                  </template>
                  <template v-else-if="p.links[0].label">
                     {{ p.links[0].label }}
                  </template>
               </a>
            </template>
            <template v-else>
               <div v-if="hasProviderInfo(p.provider)" class="header" :class="{full: props.mode=='full'}">
                  <template v-if="providerHomepage(p.provider)">
                     <a class="provider-link" :aria-label="`${providerLabel(p.provider)} home page`" :href="providerHomepage(p.provider)" target="_blank">
                        <img v-if="props.mode=='full' && providerLogo(p.provider)" :src="providerLogo(p.provider)" />
                        {{ providerLabel(p.provider) }}
                     </a>
                  </template>
                  <template v-else>
                     <span class='provider'>{{ providerLabel(p.provider) }}</span>
                  </template>
               </div>
               <div class="links" :class="{full: props.mode=='full', indent: hasProviderInfo}">
                  <div v-for="(l,idx) in providerLinks(p)" :key="`${l.url}-${idx}`">
                     <VirgoButton as="a" :label="linkLabel(l)" :href="l.url" target="_blank" :aria-label="`access ${props.title} ${l.label} with ${providerLabel(p.provider)}`"/>
                  </div>
                  <template v-if="remainingLinks(p)">
                     <div>see {{remainingLinks(p)}} more on details page</div>
                  </template>
               </div>
            </template>
         </div>
      </template>
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
function providerLogo(provider) {
   let p = poolStore.findProvider(props.pool, provider)
   if ( p ) return p.logo_url
   return ""
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
.header.full {
   text-align: left;
}
span.provider {
   color: var(--uvalib-grey);
   font-weight:  bold;
}
.header.full span.provider {
   font-size: 1.15em;
}

.links.indent {
   margin: 0 0 0 20px;
}
.links, div.provider {
   word-break: break-word;
   -webkit-hyphens: auto;
   -moz-hyphens: auto;
   hyphens: auto;
   font-size: 0.9em;
   display: flex;
   flex-direction: column;
   gap: 5px;
   justify-content: flex-start;
   align-items: flex-start;
}
.links.full {
   font-size: 1em;
}
.provider-link {
   display: inline-flex;
   align-items: center;
   color: var(--color-link);
   font-weight: 500 !important;
   img {
      height: 55px;
      width: auto !important;
      margin: 3px 5px 3px 0;
   }
}
</style>
