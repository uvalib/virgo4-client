import axios from 'axios'
import * as utils from './utils'
import router from '../../router'

const item = {
   namespaced: true,
   state: {
      details: {searching: true, source: "", identifier:"", basicFields:[], detailFields:[], related:[] },
      digitalContent: [],
      googleBooksURL: "",
      loadingDigitalContent: false,
      availability: {searching: true, titleId: "", display: [], items: [], bound_with: [], error: ""},
   },

   getters: {
      identifier: state => {
         return state.details.identifier
      },
      hasDetails: state => (identifier) => {
         return state.identifier == identifier
      },
      hasDigitalContent: state => {
         if ( !state.digitalContent) return false
         return state.digitalContent.length > 0
      },
      availability: state => {
        if ( state.availability == null ) return []
        return state.availability
      },
      hasBoundWithItems: state => {
         return Array.isArray(state.availability.bound_with) && state.availability.bound_with.length > 0
      },
      boundIn: state => {
         return state.availability.bound_with.filter(item => item.is_parent == true)

      },
      boundWith: state => {
         return state.availability.bound_with.filter(item => item.is_parent == false)
      }
   },

   mutations: {
      setDetails(state, {source, poolURL, details}) {
         utils.preProcessHitFields( poolURL, [details] )
         if ( details.related ) {
            // strip out this item info from related
            details.related = details.related.filter(  r => r.id != details.identifier)
         }
         details.source = source
         details.searching = true
         state.details = details
         state.digitalContent.splice(0, state.digitalContent.length)
      },
      setDigitalContentStatus(state, data) {
         let dcIdx = state.digitalContent.findIndex( f=>f.pid==data.pid )
         if ( dcIdx >= 0) {
            let dc = state.digitalContent[dcIdx]
            if (data.type == "PDF") {
               dc.pdf.status = data.status
            }
            // splice is reactive, use it to replace the item in array
            state.digitalContent.splice(dcIdx, 1, dc)
         }
      },
      setDigitalContentLoading(state, flag) {
         state.loadingDigitalContent = flag
      },
      setDigitalContentFromDetails(state) {
         state.details.detailFields.filter( f => f.type == "oembed-url").forEach( o => {
            state.digitalContent.push({
               oEmbedURL: o.value,
               pid: state.details.identifier,
            })
         })
      },
      setDigitalContentData(state, data) {
         state.digitalContent.splice(0, state.digitalContent.length)
         data.parts.filter( dc => dc.pdf).forEach( item => {
            state.digitalContent.push({
               pdf: {
                  status: "UNKNOWN",
                  url: item.pdf.urls.download,
                  generateURL: item.pdf.urls.generate,
                  statusURL: item.pdf.urls.status,
               },
               oEmbedURL: item.oembed_url,
               name: item.label,
               pid: item.pid,
               thumbnail: item.thumbnail_url
            })
         })
         // TODO support OC... just merge the OCR links info into the digital content above
      },
      setGoogleBooksURL(state, data) {
         if (data.items[0].accessInfo.webReaderLink) {
            state.googleBooksURL = data.items[0].accessInfo.webReaderLink
         }
      },
      clearDetails(state) {
         state.details = {searching: true, source: "", identifier:"", basicFields:[],
            detailFields:[], related:[]}
         state.googleBooksURL = ""
         state.digitalContent.splice(0, state.digitalContent.length)
      },
      setAvailability(state, {titleId, response}) {
        state.availability.titleId = titleId
        state.availability.display = response.display
        state.availability.items = response.items
        state.availability.bound_with = response.bound_with
        state.availability.searching = false
      },
      setAvailabilityError(state, error) {
         state.availability.error = error
      },
      clearAvailability(state) {
        state.availability = {searching: true, titleId: '', display: [], items: [], bound_with: [], error: ""}
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
                  let poolURL = pr.service_url
                  utils.preProcessHitFields( poolURL, [obj] )
                  obj.source = source
                  obj.searching = true
                  state.details = obj
                  found = true
               }
            }
            return found == true
         })
      }
   },

   actions: {
      async generatePDF(ctx, item ) {
         try {
            await axios.get(item.pdf.generateURL)
            ctx.dispatch("getDigitalContentStatus", item.name)
         } catch (err) {
            console.error("Unable to generate PDF "+item.pdf.url+": "+err)
            ctx.commit("setDigitalContentStatus", {pid: item.pid,  type: "PDF", status: "ERROR"})
         }
      },
      async getPDFStatus(ctx, item) {
         try {
            let response = await axios.get(item.pdf.statusURL)
            ctx.commit("setDigitalContentStatus", {pid: item.pid, type: "PDF", status: response.data})
         } catch(error) {
            ctx.commit("setDigitalContentStatus", {pid: item.pid,  type: "PDF", status: "NOT_AVAIL"})
         }
      },

      getDigitalContent(ctx) {
         let allFields = ctx.state.details.basicFields.concat(ctx.state.details.detailFields)
         let dcField = allFields.find( f=>f.name=="digital_content_url")
         if (!dcField) {
            ctx.commit("setDigitalContentFromDetails")
            return
         }

         // the URL is for a manifest stored in S3. Auth headers must be removed or request will fail
         const noAuthAxios = axios.create({
            timeout: 5000,
         })
         delete noAuthAxios.defaults.headers.common['Authorization']

         ctx.commit("setDigitalContentLoading", true)
         noAuthAxios.get(dcField.value).then((response) => {
            ctx.commit("setDigitalContentData", response.data)
            ctx.commit("setDigitalContentLoading", false)
         }).catch((_error) => {
            ctx.commit("setDigitalContentLoading", false)
         })
      },

      async getGoogleBooksURL(ctx) {
         // The books API must be accessed without any auth headers or it will 401.
         // There may be other requests going on at the same time
         // this request is made that DO require auth, so a new axios instance must be created and have
         // the auth header stripped
         const axInst = axios.create({
            timeout: 1000,
         })
         delete axInst.defaults.headers.common['Authorization']
         let detail = ctx.state.details
         let done = false
         let fields = ["isbn", "oclc", "lccn"]
         fields.some( name => {
            let idField = detail.basicFields.find( f => f.name == name )
            if (!idField) {
               idField = detail.detailFields.find( f => f.name == name )
            }
            if ( idField ) {
               idField.value.some( async v => {
                  let url = `https://www.googleapis.com/books/v1/volumes?q=${name}:${v}`
                  try {
                     let response = await axInst.get(url)
                     if (response.data.totalItems > 0 && response.data.items[0].accessInfo.viewability != "NO_PAGES") {
                        ctx.commit('setGoogleBooksURL', response.data)
                        done = true
                     }
                  } catch(_error) {
                    // NO-OP
                  }
                  return done == true
               })
            }
            return done == true
         })
      },

      async getDetails(ctx, { source, identifier }) {
         ctx.commit('clearDetails')
         ctx.commit('clearAvailability')

         // get source from poolID
         let baseURL = ""
         let pool = null
         let pools = ctx.rootState.pools.list
         if (pools.length == 0) {
            await ctx.dispatch("pools/getPools", null, {root:true})
            pools = ctx.rootState.pools.list
         }

         pool = pools.find( p => p.id == source)

         if (!pool) {
           ctx.commit('clearSearching')
           router.push(`/not_found`)
           return
         }

         baseURL = pool.url
         let url = baseURL + "/api/resource/" + identifier
         await axios.get(url).then((response) => {
            let details = response.data
            ctx.commit("setDetails", {source: source, poolURL: pool.url, details: details})
            ctx.dispatch("getDigitalContent")
            ctx.dispatch("getGoogleBooksURL")
            ctx.commit('clearSearching')
         }).catch( async (error) => {
            if ( error.response && error.response.status == 404) {
               console.warn(`Item ID ${identifier} not found in ${source}; try a lookup`)
               await ctx.dispatch("lookupCatalogKeyDetail", identifier)
            } else {
               ctx.commit('clearSearching')
               ctx.commit('system/setError', error, { root: true })
            }
         })
      },

      async getAvailability(ctx, titleId) {
         ctx.commit('clearAvailability')
         let url = `${ctx.rootState.system.availabilityURL}/item/${titleId}`
         axios.get(url).then((response) => {
            ctx.commit('clearSearching')
            if (response.data) {
               ctx.commit("setAvailability", { titleId: titleId, response: response.data.availability })
               ctx.commit("requests/setRequestOptions", response.data.availability.request_options, { root: true })
            }
         }).catch((error) => {
            console.log(error)
            ctx.commit('clearSearching')
            if (error.response && error.response.status != 404) {
               ctx.commit("setAvailabilityError", error.response.data)
            }
         })
      },

      // This is used to lookup a catalog key without a source. end result of this action is a redirect
      async lookupCatalogKeyDetail(ctx, catalogKey) {
         ctx.commit('clearDetails')
         ctx.commit('clearAvailability')

         let pools = ctx.rootState.pools.list
         if (pools.length == 0) {
            await ctx.dispatch("pools/getPools", null, {root:true})
         }

         // strip punctuation that may be lingeraing at end of key from a bad cut/paste
         catalogKey = cleanIdentifier(catalogKey)

         let req = {
            query: `identifier: {${catalogKey}}`,
            pagination: { start: 0, rows: 1 },
         }

         return axios.post(`${ctx.rootState.system.searchAPI}/api/search`, req).then((response) => {
            ctx.commit('clearSearching')
            if (response.data.total_hits == 1 ) {
               ctx.commit('setCatalogKeyDetails', response.data)
               // NOTE:  the result above only contains basic fields. the redirect below
               // will trigger a full record get
               let redirect = `/sources/${ctx.state.details.source}/items/${ctx.state.details.identifier}`
               router.push(redirect)
            } else {
               ctx.commit("clearDetails")
               router.push(`/not_found`)
            }
         }).catch((error) => {
            ctx.commit('clearSearching')
            ctx.commit("clearDetails")
            if ( error.response && error.response.status == 404) {
               console.warn(`Catalog Key ${catalogKey} not found`)
               router.push(`/not_found`)
            } else {
               ctx.commit('system/setError', error, { root: true })
            }

         })
      },

      async getCitations(ctx, {format, itemURL}) {
        let url = `${ctx.rootState.system.citationsURL}/format/${format}?item=${encodeURI(itemURL)}`
        return axios.get(url)
      },

   }
}

function cleanIdentifier(identifier) {
   // strip spaces and punctuation that may be attached to an identifier that was cut and pasted
   let clean = identifier.trim()
   clean = clean.replace(/(:|;|,|-|"|!|'|\?|\.|\]|\))+$/, '')
   return clean
}

export default item
