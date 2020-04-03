<template>
   <div class="access-urls">
      <template v-for="(p,idx) in urls">
         <div class='provider' :key="idx">
            <template v-if="p.links.length==1">
               <a :href="p.links[0].url" target='_blank'>{{ providerLabel(p.provider) }}</a>
            </template>
            <template v-else>
               <div class="header" :class="{full: mode=='full'}">
                  <img class="logo" v-if="mode=='full' && providerLogo(p.provider)" :src="providerLogo(p.provider)">
                  <template v-if="providerHomepage(p.provider)">
                     <a :href="providerHomepage(p.provider)" target="_blank">
                        <span class="provider link">{{ providerLabel(p.provider) }}</span>
                     </a>
                  </template>
                  <span v-else class='provider'>{{ providerLabel(p.provider) }}</span>     
               </div>
               <div class="links" :class="{full: mode=='full'}">
                  <template v-for="(l) in providerLinks(p)">
                     <div :key="l.url">
                        <a :href="l.url" target="_blank" >
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

<style scoped>
.header.full {
   display: flex;
   flex-flow: row nowrap;
   align-items: center;  
   border-bottom: 1px solid var(--color-brand-blue);
   border-top: 1px solid var(--color-brand-blue);
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
.links {
   margin: 10px;
   word-break: break-word;
   -webkit-hyphens: auto;
   -moz-hyphens: auto;
   hyphens: auto;
   font-size: 0.9em;
}
.links.full {
   font-size: 1em;
}
.logo {
   display: inline-block;
   width: 50px;
   margin-right: 15px;
}
</style>
