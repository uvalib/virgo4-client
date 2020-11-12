import axios from 'axios'
import * as utils from './utils'
import router from '../../router'
import analytics from '../../analytics'

const item = {
   namespaced: true,
   state: {
      details: {searching: true, source: "", identifier:"", basicFields:[], detailFields:[],
         related:[], digitalContent: [], embeddedMedia: [] },
      loadingDigitalContent: false,
      availability: {searching: true, titleId: "", display: [], items: [], bound_with: [], error: ""},
      googleBooksURL: ""
   },

   getters: {
      identifier: state => {
         return state.details.identifier
      },
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
         details.digitalContent = []
         details.embeddedMedia = []
         details.source = source
         details.searching = true
         state.details = details
      },
      setDigitalContentStatus(state, data) {
         let dc = state.details.digitalContent.find( f=>f.name==data.name && f.type==data.type)
         if ( dc ) {
            dc.status = data.status
         }
      },
      setDigitalContentLoading(state, flag) {
         state.loadingDigitalContent = flag
      },
      setDigitalContentData(state, data) {
         state.details.digitalContent.splice(0, state.details.digitalContent.length)
         let pdfs = data.parts.filter( dc => dc.pdf && dc.pdf.status != "FAILED" && dc.pdf.status != "PROCESSING" && dc.pdf.status != "100%")
         pdfs.forEach( item => {
            if ( item.pdf.status == "READY") {
               state.details.digitalContent.push({type: "PDF", status: "READY", url: item.pdf.urls.download,
                  name: item.label, thumbnail: item.thumbnail_url})
            } else if ( item.pdf.status.includes("%")) {
               state.details.digitalContent.push({type: "PDF", status: "PENDING", url: item.pdf.urls.download,
                  statusURL: item.pdf.urls.status, name: item.label, thumbnail: item.thumbnail_url})
            } else {
               state.details.digitalContent.push({type: "PDF", status: "NOT_AVAIL", url: item.pdf.urls.download,
                  generateURL: item.pdf.urls.generate, statusURL: item.pdf.urls.status, name: item.label, thumbnail: item.thumbnail_url})
            }
         })
         let ocrs = data.parts.filter( dc => dc.ocr && dc.ocr.status == "READY" )
         ocrs.forEach( item => {
            state.details.digitalContent.push({type: "OCR", url: item.pdf.urls.download})
         })
      },
      setGoogleBooksURL(state, data) {
         state.googleBooksURL = data.items[0].volumeInfo.previewLink
      },
      addEmbeddedMedia( state, html ) {
         state.details.embeddedMedia.push(html)
      },
      clearDetails(state) {
         state.details = {searching: true, source: "", identifier:"", basicFields:[],
            detailFields:[], related:[], digitalContent: [], embeddedMedia: []}
         state.googleBooksURL = ""
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
      async generateDigitalContent(ctx, item ) {
         try {
            ctx.commit("setDigitalContentStatus", {name: item.name,  type: item.type, status: "0%"})
            await axios.get(item.generateURL)
            ctx.dispatch("getDigitalContentStatus", item.name)
         } catch (_err) {
            ctx.commit("setDigitalContentStatus", {name: item.name,  type: item.type, status: "ERROR"})
         }
      },
      async getDigitalContentStatus(ctx, item) {
         try {
            let response = await axios.get(item.statusURL)
            ctx.commit("setDigitalContentStatus", {name: item.name, type: item.type, status: response.data})
         } catch(error) {
            ctx.commit("setDigitalContentStatus", {name: item.name,  type: item.type, status: "ERROR"})
         }
      },

      getDigitalContent(ctx) {
         let allFields = ctx.state.details.basicFields.concat(ctx.state.details.detailFields)
         let dcField = allFields.find( f=>f.name=="digital_content_url")
         if (!dcField) return

         const noAuthAxios = axios.create({
            timeout: 5000,
         })
         delete noAuthAxios.defaults.headers.common['Authorization']

         ctx.commit("setDigitalContentLoading", true)
         console.log("GET DIGIAL CONTENT: "+dcField.value)
         noAuthAxios.get(dcField.value).then((response) => {
            ctx.commit("setDigitalContentData", response.data)
            ctx.commit("setDigitalContentLoading", false)
         }).catch((_error) => {
            ctx.commit("setDigitalContentLoading", false)
         })
      },

      getOEmbedMedia(ctx) {
         const noAuthAxios = axios.create({
            timeout: 5000,
         })
         delete noAuthAxios.defaults.headers.common['Authorization']

         let screenW = ctx.rootState.system.displayWidth-30;
         let oembed = ctx.state.details.detailFields.filter( f => f.type == "oembed-url")
         oembed.forEach( async oe => {
            try {
               let resp = await noAuthAxios.get(oe.value+"&maxwidth="+screenW+"&maxheight=600")
               ctx.commit("addEmbeddedMedia", resp.data.html)
            } catch (err) {
               console.error("Unable to get oEmbed media from "+oe.value+": "+err)
            }
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
           return
         }

         baseURL = pool.url
         let url = baseURL + "/api/resource/" + identifier
         await axios.get(url).then((response) => {
            let details = response.data
            ctx.commit("setDetails", {source: source, poolURL: pool.url, details: details})
            ctx.dispatch("getDigitalContent")
            ctx.dispatch("getGoogleBooksURL")
            ctx.dispatch("getOEmbedMedia")
            ctx.commit('clearSearching')
         }).catch( async (error) => {
            if ( error.response && error.response.status == 404) {
               console.warn(`Item ID ${identifier} not found in ${source}; try a lookup`)
               await ctx.dispatch("lookupCatalogKeyDetail", {identifier: identifier, v3Redirect: false})
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
            ctx.commit("setAvailability", { titleId: titleId, response: response.data.availability })
            ctx.commit("requests/setRequestOptions", response.data.availability.request_options, { root: true })
         }).catch((error) => {
            ctx.commit('clearSearching')
            if (error.response && error.response.status != 404) {
               ctx.commit("setAvailabilityError", error.response.data)
            }
         })
      },

      // This is used to lookup a catalog key without a source. end result of this action is a redirect
      async lookupCatalogKeyDetail(ctx, data) {
         let catalogKey = data.identifier
         let v3Redirect = data.v3Redirect
         ctx.commit('clearDetails')

         let pools = ctx.rootState.pools.list
         if (pools.length == 0) {
            await ctx.dispatch("pools/getPools", null, {root:true})
         }

         // strip punctuation that may be lingeraing at end of key from a bad cut/paste
         catalogKey = cleanIdentifier(catalogKey)

         let req = {
            query: `identifier: {${catalogKey}}`,
            pagination: { start: 0, rows: 1 },
            preferences: {
              target_pool: "",
              exclude_pool: [],
            }
         }

         let srcSet = ctx.rootState.preferences.sourceSet
         let url = `${ctx.rootState.system.searchAPI}/api/search?sources=${srcSet}`
         return axios.post(url, req).then((response) => {
            if (response.data.total_hits == 0 ) {
               if ( v3Redirect ) {
                  analytics.trigger('Navigation', 'VIRGO3_REDIRECT', `/items/${catalogKey}`)
                  window.location.href = "https://v3.lib.virginia.edu/catalog/"+catalogKey
               } else {
                  ctx.commit('clearSearching')
               }
            } else if (response.data.total_hits == 1 ) {
               ctx.commit('setCatalogKeyDetails', response.data)
               // NOTE:  the result above only contains basic fields. the redirect below
               // will trigger a full record get
               let redirect = `/sources/${ctx.state.details.source}/items/${ctx.state.details.identifier}`
               router.push(redirect)
            } else {
               router.push(`/search?mode=advanced&q=identifier:{${catalogKey}}`)
            }
         }).catch((error) => {
            if ( error.response && error.response.status == 404) {
               console.warn(`Catalog Key ${catalogKey} not found`)
               ctx.commit("clearDetails")
            } else {
               ctx.commit('system/setError', error, { root: true })
            }
            ctx.commit('clearSearching')
         })
      },

      async getCitations(ctx, {format, itemURL}) {
        let url = `${ctx.rootState.system.citationsURL}/format/${format}?item=${encodeURI(itemURL)}`
      //   console.log("Get citations from: "+url)
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
