<template>
   <div class="access-urls">
      <template v-for="(p,idx) in urls">
         <div class='provider' :key="idx">
            <template v-if="p.links.length==1">
               <a class="link-button" :href="p.links[0].url" target='_blank'
                  :aria-label="`access ${title} online with ${providerLabel(p.provider)}`"
               >
                  {{ providerLabel(p.provider) }}
                  <template v-if="p.links[0].label"> ({{ p.links[0].label }})</template>
               </a>
            </template>
            <template v-else>
               <div v-if="hasProviderInfo" class="header" :class="{full: mode=='full'}">
                  <template v-if="providerHomepage(p.provider)">
                     <a :aria-label="`${providerLabel(p.provider)} home page`" :href="providerHomepage(p.provider)" target="_blank">
                        <img class="logo" v-if="mode=='full' && providerLogo(p.provider)" :src="providerLogo(p.provider)" />
                        <span v-else class="provider link">{{ providerLabel(p.provider) }}</span>
                     </a>
                  </template>
                  <template v-else>
                     <span class='provider'>{{ providerLabel(p.provider) }}</span>
                  </template>
               </div>
               <div class="links" :class="{full: mode=='full', indent: hasProviderInfo}">
                  <template v-for="(l,idx) in providerLinks(p)">
                     <div :key="`${l.url}-${idx}`">
                        <a :href="l.url" target="_blank" :aria-label="`access ${title} ${l.label} with ${providerLabel(p.provider)}`">
                           <template v-if="l.label">{{l.label}}</template>
                           <template v-else>{{l.url}}</template>
                        </a>
                     </div>
                  </template>
                  <template v-if="mode=='brief' && remainingLinks(p)">
                     <div>see {{remainingLinks(p)}} more on details page</div>
                  </template>
               </div>
            </template>
         </div>
      </template>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   name: "AccessURLDisplay",
   props: {
      mode: {
         type: String,
         default: "brief",
      },
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
   },
   computed: {
      ...mapGetters({
         findProvider: 'pools/findProvider'
      }),
      hasProviderInfo(provider) {
         return this.findProvider(this.pool, provider) != null
      },
   },
   methods: {
      providerLabel(provider) {
         let p = this.findProvider(this.pool, provider)
         if ( p ) return p.label
         return provider
      },
      providerLogo(provider) {
         let p = this.findProvider(this.pool, provider)
         if ( p ) return p.logo_url
         return ""
      },
      providerHomepage(provider) {
         let p = this.findProvider(this.pool, provider)
         if ( p ) return p.homepage_url
         return ""
      },
      providerLinks( details ) {
         if ( this.mode == "full") return details.links
         return details.links.slice(0,10)
      },
      remainingLinks( details ) {
         if ( this.mode == "full") return 0
         if ( details.links.length <= 10) return 0
         return details.links.length - 10
      }
   }
}
</script>

<style lang="scss" scoped>
.header.full {
   text-align: left;
   border-bottom: 1px solid var(--color-brand-blue);
   border-top: 1px solid var(--color-brand-blue);
   margin-bottom: 10px;
}
.provider {
   a.link-button {
      background-color: var(--uvalib-brand-blue-light);
      border: 1px solid var(--uvalib-brand-blue-light);
      color: white !important;
      padding: .5em 1em;
      border-radius: 5px;
      display: inline-block;
  margin: 0px 5px 5px 0 ;

      &:hover {
         background-color: var(--uvalib-brand-blue-lighter);
         border: 1px solid var(--uvalib-brand-blue-lighter);
         transition: all 0.3s ease;
         text-decoration: none !important;
      }
   }
}
span.sep {
   margin: 0 5px;
}
span.provider {
   color: var(--uvalib-grey);
   font-weight:  bold;
}
.header.full span.provider {
   font-size: 1.15em;
}
span.provider.link {
   color: var(--color-link);
   font-weight:  500 !important;
}
.links.indent {
   margin: 0 0 0 20px;
}
.links {
   word-break: break-word;
   -webkit-hyphens: auto;
   -moz-hyphens: auto;
   hyphens: auto;
   font-size: 0.9em;
}
.links.full {
   font-size: 1em;
}
img.logo {
   display: inline-block;
   height: 55px;
   width: auto !important;
   margin:0;
   padding: 10px 0 5px 0px;
}
</style>
