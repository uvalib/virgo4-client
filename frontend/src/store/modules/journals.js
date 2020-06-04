import { getField, updateField } from 'vuex-map-fields'
import axios from 'axios'

const journals = {
   namespaced: true,
   state: {
      query: "",
      searching: false,
      titles: [],
      browseTotal: -1
   },
   getters: {
      getField,
      query(state) {
        return state.query
      },
   },
   mutations: {
      updateField,
      setSearching(state, flag) {
         state.searching = flag
      },
      setTitleResults(state, results) {
         state.titles.splice(0, state.titles.length)
         results.forEach( res => {
            res.items.forEach( item => {
               if ( !item.accessURL ) return 

               // Group all access_url data just like the main search results so 
               // display code can be resued...
               // format: {url, item, provider}
               let origURLs = item.accessURL.slice()
               let processed = []
               origURLs.forEach(field => {
                  let provider = field.provider 
                  let newLink = {url: field.url}
                  if ( field.item ) {
                     newLink.label = field.item   
                  }
                  let provData = processed.find( f => f.provider == provider)
                  if (!provData) {
                     // a provider group does not exist; create one and set it to currProvider
                     provData = {provider: provider, links: []}
                     processed.push(provData)
                  } 
                  provData.links.push(newLink)
               })
               item.accessURL = processed
            })
            state.titles.push( res )
         })
         state.browseTotal = results.length
      },
      setQuery(state, q) {
        state.query = q
      }

   },
   actions: {
      async searchJournals(ctx) {
         ctx.commit("setSearching", true)
         await ctx.dispatch("pools/getPools", null, {root:true})
         
         let q = ctx.state.query
         try {
            let response = await axios.get(`/api/journals/browse?title=${q}`)
            let titles = []
            response.data.forEach( res => {
               titles.push(res.title)
            })
            let data = {titles: titles}
            let details = await axios.post(`/api/journals/`, data)
            ctx.commit("setTitleResults", details.data)
            ctx.commit("setSearching", false)
         } catch (error) {
            ctx.commit('system/setError', error, { root: true })
         }
      }
   }
}

export default journals
