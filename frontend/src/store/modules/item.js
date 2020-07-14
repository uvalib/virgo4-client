import axios from 'axios'
import * as utils from './utils'
import router from '../../router'

const item = {
   namespaced: true,
   state: {
      details: {searching: true, source: "", identifier:"", basicFields:[], detailFields:[], related:[], digitalContent: []},
      availability: {searching: true, titleId: '', columns: [], items: []}
   },

   getters: {
      hasDetails: state => (identifier) => {
         return state.identifier == identifier
      },
      availability: state => {
        if ( state.availability == null ) return []
        return state.availability
      },
      getPDF: state => (name) => {
         return state.details.digitalContent.find( dc=>dc.name==name && dc.type=="PDF")
      },
   },

   mutations: {
      setDetails(state, {source, details}) {
         utils.preProcessHitFields( [details] )
         details.digitalContent = []
         details.source = source
         state.details = details
         state.details.searching = false
      },
      setDigitalContentStatus(state, data) {
         let dc = state.details.digitalContent.find( f=>f.name==data.name && f.type==data.type)
         if ( dc ) {
            dc.status = data.status
         }
      },
      setDigitalContentData(state, data) {
         state.details.digitalContent.splice(0, state.details.digitalContent.length)
         let pdfs = data.parts.filter( dc => dc.pdf && dc.pdf.status != "FAILED" && dc.pdf.status != "PROCESSING" && dc.pdf.status != "100%")
         pdfs.forEach( item => {
            if ( item.pdf.status == "READY") {
               state.details.digitalContent.push({type: "PDF", status: "READY", url: item.pdf.urls.download, name: item.label})
            } else if ( item.pdf.status.includes("%")) {
               state.details.digitalContent.push({type: "PDF", status: "PENDING", url: item.pdf.urls.download,
                  statusURL: item.pdf.urls.status, name: item.label})
            } else {
               state.details.digitalContent.push({type: "PDF", status: "NOT_AVAIL", url: item.pdf.urls.download,
                  generateURL: item.pdf.urls.generate, statusURL: item.pdf.urls.status, name: item.label})
            }
         })
         let ocrs = data.parts.filter( dc => dc.ocr && dc.ocr.status == "READY" )
         ocrs.forEach( item => {
            state.details.digitalContent.push({type: "OCR", url: item.pdf.urls.download})
         })
      },
      clearDetails(state) {
         state.details = {searching: true, source: "", identifier:"", basicFields:[], detailFields:[], related:[], digitalContent: []}
      },
      setAvailability(state, {titleId, response}) {
        state.availability.titleId = titleId
        state.availability.columns = response.columns
        state.availability.items = response.items
        state.availability.searching = false
      },
      clearAvailability(state) {
        state.availability = {searching: true, titleId: '', columns: [], items: []}
      },
      clearSearching(state){
        state.details.searching = false
        state.availability.searching = false
      },

      setCatalogKeyDetails(state, data) {
         if (data.total_hits == 0 || data.total_hits > 1) {
            state.details.searching = false
            state.availability.searching = false
            return
         }
         let found = false
         data.pool_results.some( pr => {
            if (pr.group_list && pr.group_list.length == 1) {
               let obj = pr.group_list[0].record_list[0]
               if (obj) {
                  let source = pr.pool_id
                  utils.preProcessHitFields( [obj] )
                  obj.source = source
                  state.details = obj
                  found = true
               }
            }
            return found == true
         })
      }
   },

   actions: {
      async generateDigitalContent(ctx, data ) {
         let oldAuth = axios.defaults.headers.common['Authorization']
         delete axios.defaults.headers.common['Authorization']
         let dc = ctx.state.details.digitalContent.find( f=>f.name==data.name && f.type==data.type)
         try {
            await axios.get(dc.generateURL)
            ctx.dispatch("getDigitalContentStatus", data.name)
         } catch (_err) {
            ctx.commit("setDigitalContentStatus", {name: data.name,  type: data.type, status: "ERROR"})
         } finally {
            axios.defaults.headers.common['Authorization'] = oldAuth
         }
      },
      async getDigitalContentStatus(ctx, data) {
         let oldAuth = axios.defaults.headers.common['Authorization']
         delete axios.defaults.headers.common['Authorization']
         try {
            let dc = ctx.state.details.digitalContent.find(  f=>f.name==data.name && f.type==data.type)
            let response = await axios.get(dc.statusURL)
            ctx.commit("setDigitalContentStatus", {name: data.name, type: data.type, status: response.data})
         } catch(error) {
            ctx.commit("setDigitalContentStatus", {name: data.name,  type: data.type, status: "ERROR"})
         } finally {
            axios.defaults.headers.common['Authorization'] = oldAuth
         }
      },
      async getDigitalContentURLs(ctx) {
         let dcField = ctx.state.details.basicFields.find( f=>f.name=="digital_content_url")
         if (!dcField) return

         axios.get(dcField.value).then((response) => {
            ctx.commit("setDigitalContentData", response.data)
         }).catch((_error) => {
           // NO-OP; there just wont be any DC links
         })
      },
      async getDetails(ctx, { source, identifier }) {
         if (ctx.getters.hasDetails(identifier)) {
            return
         } else {
            ctx.commit('clearDetails')
         }

         // get source from poolID
         let baseURL = ""
         let pool = null
         let pools = ctx.rootState.pools.list
         if (pools.length == 0) {
            if (ctx.rootState.system.searchAPI == "") {
               await ctx.dispatch("system/getConfig", null, {root:true})
            }
            await ctx.dispatch("pools/getPools", null, {root:true})
            pools = ctx.rootState.pools.list
            pool = pools.find( p => p.id == source)
            baseURL = pool.url
         } else {
            pool = pools.find( p => p.id == source)
            baseURL = pool.url
         }

         let url = baseURL + "/api/resource/" + identifier
         axios.get(url).then((response) => {
            let details = response.data
            ctx.commit("setDetails", {source:source, details: details})
            ctx.dispatch("getDigitalContentURLs")
         }).catch((error) => {
           ctx.commit('clearSearching')
           ctx.commit('system/setError', error, { root: true })
         })
      },

      async getAvailability(ctx, titleId ) {
        ctx.commit('clearAvailability')
        axios.get("/api/availability/" + titleId).then((response) => {
          ctx.commit("setAvailability", {titleId: titleId, response: response.data.availability})
          ctx.commit("requests/setRequestOptions", response.data.availability.request_options, {root: true})
        }).catch((error) => {
          ctx.commit('clearSearching')
          if (error.response.status != 404){
            ctx.commit('system/setError', error, {root: true})
          }
        })
      },

      // This is used to lookup a catalog key without a source. end result of this action is a redirect
      async lookupCatalogKeyDetail(ctx, catalogKey) {
         if (ctx.getters.hasDetails(catalogKey)) {
            return
         } else {
            ctx.commit('clearDetails')
         }
         await ctx.dispatch("pools/getPools", null, {root:true})

         let req = {
            query: `identifier: {${catalogKey}}`,
            pagination: { start: 0, rows: 1 },
            preferences: {
              target_pool: "",
              exclude_pool: [],
            }
         }
         let url = ctx.rootState.system.searchAPI + "/api/search?intuit=1&debug=1"
         return axios.post(url, req).then((response) => {
            if (response.data.total_hits == 0 ) {
               //ctx.commit('clearSearching')
               //router.push("/not_found")
               // Redirect to V3 for now
               window.location.href = "https://v3.lib.virginia.edu/catalog/"+catalogKey
            } else if (response.data.total_hits == 1 ) {
               ctx.commit('setCatalogKeyDetails', response.data)
               ctx.dispatch("getDigitalContentURLs")
               let redirect = `/sources/${ctx.state.details.source}/items/${ctx.state.details.identifier}`
               router.replace(redirect)
            } else {
               router.push(`/search?mode=advanced&q=identifier:{${catalogKey}}`)
            }
         }).catch((_error) => {
            ctx.commit('clearSearching')
            router.push("/not_found")
         })
      }
   }
}

export default item
