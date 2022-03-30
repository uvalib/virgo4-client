import axios from 'axios'
import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"

export const usePoolStore = defineStore('pool', {
	state: () => ({
      list: [],
      lookingUp: false,
   }),

   getters: {
      poolDetails: state => {
         return (id) => {
            return state.list.find( p => p.id == id)
         }
      },
      sortedList: state => {
         return state.list.sort( (a,b) => {
            if (a.name < b.name) return -1
            if (a.name > b.name) return 1
            return 0
         })
      },
      hasInterLibraryLoan: state => {
         return (id) => {
            let pool = state.list.find( p => p.id == id)
            if (!pool) return false
            if (!pool.attributes) return false
            let attr = pool.attributes.find( a=> a.name=='ill_request')
            if (!attr) return false
            return attr.supported
         }
      },
      hasAvailability: state => {
         return (id) => {
            let pool = state.list.find( p => p.id == id)
            if (!pool) return false
            if (!pool.attributes) return false
            let attr = pool.attributes.find( a=> a.name=='availability')
            if (!attr) return false
            return attr.supported
         }
      },
      itemMessage: state => {
         return (id) => {
            let pool = state.list.find( p => p.id == id)
            if (!pool) return ""
            if (!pool.attributes) return ""
            let attr = pool.attributes.find( a=> a.name=='item_message')
            if (!attr || attr && attr.supported == false) return ""
            return attr.value
         }
      },
      facetSupport: state => {
         return (id) => {
            let pool = state.list.find( p => p.id == id)
            if (!pool) return false
            if (!pool.attributes) return true
            let attr = pool.attributes.find( a=> a.name=='facets')
            if (!attr) return true
            return attr.supported
         }
      },
      sortingSupport: state => {
         return (id) => {
            let pool = state.list.find( p => p.id == id)
            if (!pool) return false
            if (!pool.attributes) return false
            let attr = pool.attributes.find( a=> a.name=='sorting')
            if (!attr) return false
            return attr.supported
         }
      },
      sortOptions: state => {
         return (id) => {
            let pool = state.list.find( p => p.id == id)
            if (!pool) return []
            let out = []
            pool.sort_options.forEach( so => {
               if (/relevance/gi.test(so.id)) {
                  out.push({id: so.id+"_desc", name: so.label })
               } else {
                  let asc_label = "ascending"
                  if (so.asc && so.asc != "") {
                     asc_label = so.asc
                  }

                  let desc_label = "descending"
                  if (so.desc && so.desc != "") {
                     desc_label = so.desc
                  }

                  out.push({id: so.id+"_desc", name: so.label+": "+desc_label })
                  out.push({id: so.id+"_asc", name: so.label+": "+asc_label })
               }
            })
            return out
         }
      },
      logo: state => {
         return (id) => {
            let pool = state.list.find( p => p.id == id)
            if (!pool) return ""
            if (!pool.attributes) return ""
            let attr = pool.attributes.find( a=> a.name=='logo_url')
            if (!attr) return ""
            if (attr.supported == false) return ""

            // NOTE: this assumes all logo assets are seved by the pool and advertised with a
            // relative URL
            let logo = attr.value
            logo = logo.replace("./", "/")
            return pool.url+logo
         }
      },
      externalURL: state => {
         return (id) => {
            let pool = state.list.find( p => p.id == id)
            if (!pool) return ""
            if (!pool.attributes) return ""
            let attr = pool.attributes.find( a=> a.name=='external_url')
            if (!attr) return ""
            if (attr.supported == false) return ""
            return attr.value
         }
      },
      findProvider: state => {
         return (poolID, providerID) => {
            let pool = state.list.find( p => p.id == poolID)
            if (!pool) return null
            if (!pool.providers) return null
            let detail = pool.providers.find( p=> p.provider==providerID)
            if (!detail) return null
            return detail
         }
      },
   },

   actions: {
      setPools(data) {
         // Copy old items to preserve providers lists for each, then wipe out list
         let old = this.list.slice()
         this.list.splice(0, this.list.length)

         // copy new pools into list and add pre-existing providers data
         data.forEach( p => {
            let prior = old.find(op => op.name == p.name  )

            // no providers in new data?
            if ( !(p.providers && p.providers.length > 0) ) {
               if (prior) {
                  p.providers = prior.providers.slice()
               } else {
                  p.providers = []
               }
            } else {
               p.providers.forEach( pp => {
                  if ( pp.logo_url ) {
                     let logo = pp.logo_url
                     logo = logo.replace("./", "/")
                     pp.logo_url =  p.url+logo
                  }
               })
            }

            if (!p.sort_options) {
               p.sort_options=[]
            }
            this.list.push(p)
         })
      },

      async getPools() {
         const system = useSystemStore()
         this.lookingUp = true
         await axios.get( `${system.searchAPI}/api/pools` ).then( response => {
            this.setPools(response.data)
            this.lookingUp = false
            if (this.list.length == 0) {
               system.setFatal("No search sources found")
            }
         }).catch ( error => {
            system.setFatal(error)
            this.lookingUp = false
         })
      },
   }
})