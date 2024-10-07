<template>
   <section class="online" aria-live="polite">
      <div class="panel">
         <div class="gutter"></div>
         <div class="content">
            <h3>Access online</h3>
            <div class="header">Source</div>
            <div class='sources'>
               <div class='source' v-for="s in props.sources">
                  <div class="name">
                     <a v-if="providerHomepage(s.provider)" class="provider-link"
                        :aria-label="`${providerLabel(s.provider)} home page`"
                        :href="providerHomepage(s.provider)" target="_blank" >
                        {{ providerLabel(s.provider) }}
                     </a>
                     <span v-else>
                        {{providerLabel(s.provider)}}
                     </span>
                  </div>
                  <div class="links">
                     <template  v-for="l in s.links">
                        <VirgoButton as="a" :label="linkLabel(l)" :href="l.url" target="_blank"
                           :aria-label="`access ${props.title} ${l.label} with ${providerLabel(s.provider)}`"/>
                     </template>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </section>
</template>

<script setup>
import { usePoolStore } from "@/stores/pool"

const poolStore = usePoolStore()

const props = defineProps({
   title: {
      type: String,
      required: true
   },
   pool: {
      type: String,
      required: true
   },
   sources: {
      type: Array,
      required: true
   }
})

const providerLabel = ((provider) => {
   let p = poolStore.findProvider(props.pool, provider)
   if ( p ) return p.label
   return provider
})

const providerHomepage = ((provider) => {
   let p = poolStore.findProvider(props.pool, provider)
   if ( p ) return p.homepage_url
   return ""
})

const linkLabel = (( providerLink ) => {
   if (providerLink.label) return providerLink.label
   return providerLink.url
})

</script>

<style lang="scss" scoped>
.online {
   text-align: left;
   .panel {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: stretch;
      border-radius: 0.5rem;
      .gutter {
         flex: 0 0 17px;
         border-radius: 0.5rem  0 0 0.5rem;
         background-color:#BFE7F7;
      }
      .content {
         flex: 1;
         padding: 5px 25px 25px 25px;
         border: 1px solid var(--uvalib-grey-light);
         border-radius:  0 0.5rem  0.5rem 0;
         border-left: 0;
         h3 {
            font-size: 1.15em;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--uvalib-grey-light);
            margin-bottom: 10px;
         }
         .header {
            font-size: 0.97em;
            font-weight: bold;
         }
         .sources {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 15px;
            .source {
               display: flex;
               flex-flow: row wrap;
            }
            .links {
               display: flex;
               flex-flow: row wrap;
               gap: 10px;
               .p-button {
                  flex-grow: 1;
               }
            }
         }
      }
   }
}
@media only screen and (min-width: 768px) {
   .source {
      gap: 15px;
      align-items: center;
      // align-items: flex-start; // for vertical layout
   }
}
@media only screen and (max-width: 768px) {
   .source {
      gap: 15px;
      align-items: flex-start;
      // align-items: flex-start; // for vertical layout
   }
   .links {
      margin-left: 20px;
   }
}
</style>