import axios from 'axios'
import * as utils from '../../utils'

const item = {
   namespaced: true,
   state: {
      details: {searching: true, source: "", identifier:"", basicFields:[], detailFields:[], related:[] },
      digitalContent: [],
      googleBooksURL: "",
      googleBookThumbURL: "",
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
      isDigitalCollection: state => {
         return state.details.detailFields.findIndex( f=> f.name == 'digital_collection') > -1
      },
      collectionName: state => {
         let field = state.details.detailFields.find( f=> f.name == 'digital_collection')
         if (field) {
            return field.value
         }
         return ""
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
      setDigitalContentStatus(state, {pid, type, status}) {
         let dcIdx = state.digitalContent.findIndex( f=>f.pid==pid )
         if ( dcIdx >= 0) {
            let dc = state.digitalContent[dcIdx]
            if (type == "PDF") {
               dc.pdf.status = status
            }
            if ( type == "OCR") {
               if ( status.has_ocr ||  status.has_transcription) {
                  dc.ocr.status = "READY"
               } else if ( status.ocr_progress ) {
                  dc.ocr.status = status.ocr_progress
               } else {
                  dc.ocr.status = "NOT_AVAIL"
               }
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
         data.parts.forEach( item => {
            let dc = {
               oEmbedURL: item.oembed_url,
               name: item.label,
               pid: item.pid,
               thumbnail: item.thumbnail_url
            }
            if (item.pdf) {
               dc.pdf = {
                  status: "UNKNOWN",
                  url: item.pdf.urls.download,
                  generateURL: item.pdf.urls.generate,
                  statusURL: item.pdf.urls.status,
               }
            }
            if (item.ocr) {
               dc.ocr = {
                  status: "UNKNOWN",
                  url: item.ocr.urls.download,
                  generateURL: item.ocr.urls.generate,
                  statusURL: item.ocr.urls.status,
               }

            }
            state.digitalContent.push(dc)
         })
      },
      setGoogleBooksURL(state, data) {
         let done = false
         state.googleBookThumbURL = ""
         state.googleBooksURL = ""
         data.items.some( item => {
            if (item.accessInfo.viewability != "NO_PAGES") {
               if ( state.details.header.title.includes(item.volumeInfo.title)) {
                  if ( item.volumeInfo.canonicalVolumeLink ) {
                     state.googleBooksURL = item.volumeInfo.canonicalVolumeLink
                  } else if ( item.volumeInfo.infoLink ) {
                     state.googleBooksURL = item.volumeInfo.infoLink
                  }
                  else if (item.accessInfo.webReaderLink) {
                     state.googleBooksURL = item.accessInfo.webReaderLink
                  }
                  if (item.volumeInfo.imageLinks.smallThumbnail) {
                     state.googleBookThumbURL = item.volumeInfo.imageLinks.smallThumbnail
                  }
                  done = true
               }
            }
            return done == true
         })
      },
      clearDetails(state) {
         state.details = {searching: true, source: "", identifier:"", basicFields:[],
            detailFields:[], related:[]}
         state.googleBookThumbURL = ""
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
         let found = false
         data.pool_results.some( pr => {
            if (pr.group_list && pr.group_list.length == 1) {
               let obj = pr.group_list[0].record_list[0]
               if (obj) {
                  let source = pr.pool_id
                  let poolURL = pr.service_url
                  utils.preProcessHitFields( poolURL, [obj] )
                  obj.source = source
                  state.details = obj
                  found = true
               }
            }
            return found == true
         })
         state.details.searching = true
      }
   },

   actions: {
      async generatePDF(ctx, item ) {
         try {
            await axios.get(item.pdf.generateURL)
            await ctx.dispatch("getPDFStatus", item)
         } catch (err) {
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
      async generateOCR(ctx, {item, email} ) {
         let url = `${item.ocr.generateURL}?email=${email}`
         await axios.get(url).catch( () => {
            ctx.commit("setDigitalContentStatus", {pid: item.pid,  type: "PDF", status: "ERROR"})
         })
         await ctx.dispatch("getOCRStatus", item)
      },
      async getOCRStatus(ctx, item) {
         try {
            let response = await axios.get(item.ocr.statusURL)
            ctx.commit("setDigitalContentStatus", {pid: item.pid, type: "OCR", status: response.data})
         } catch(error) {
            ctx.commit("setDigitalContentStatus", {pid: item.pid,  type: "OCR", status: "NOT_AVAIL"})
         }
      },
      async downloadOCRText( ctx, item) {
         await axios.get(item.ocr.url).then( response => {
            const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: 'text/plain' }))
            const fileLink = document.createElement('a')
            fileLink.href =  fileURL
            fileLink.setAttribute('download', `${item.name}.txt`)
            document.body.appendChild(fileLink)
            fileLink.click()
            window.URL.revokeObjectURL(fileURL)
            ctx.commit("setDigitalContentStatus", {pid: item.pid, type: "OCR", status: {has_ocr: true}})
         }).catch( e => {
            console.error("Unable to download OCR text: "+e)
            ctx.commit("setDigitalContentStatus", {pid: item.pid, type: "OCR", status: "ERROR"})
         })
      },
      getDigitalContent(ctx) {
         let allFields = ctx.state.details.basicFields.concat(ctx.state.details.detailFields)
         let dcField = allFields.find( f=>f.name=="digital_content_url")
         if (!dcField) {
            ctx.commit("setDigitalContentFromDetails")
            return
         }
         ctx.commit("setDigitalContentLoading", true)
         axios.get(dcField.value).then((response) => {
            ctx.commit("setDigitalContentData", response.data)
            ctx.commit("setDigitalContentLoading", false)

            // Get the status of each OCR object. Those that are ready will be available
            // for all to download
            let ocrs = ctx.state.digitalContent.filter( item => item.ocr && item.ocr.status == "UNKNOWN")
            let timerID = setInterval( () => {
               if ( ocrs.length > 0) {
                  let dcOCR = ocrs.pop()
                  ctx.dispatch("getOCRStatus", dcOCR)
               } else {
                  clearInterval(timerID)
               }
            }, 250)

         }).catch((_error) => {
            ctx.commit("setDigitalContentLoading", false)
         })
      },

     getGoogleBooksURL(ctx) {
         let detail = ctx.state.details
         let done = false
         let fields = ["isbn", "lccn", "oclc"]
         let tgtName = ""
         let tgtValue = ""
         fields.some(  fName => {
            let idField = detail.basicFields.find( f => f.name == fName )
            if (!idField) {
               idField = detail.detailFields.find( f => f.name == fName )
            }
            if ( idField ) {
               tgtName = fName
               tgtValue = idField.value[0]
               done = true
            }
            return done == true
         })

         // no identifier to search. nothing to do
         if (tgtName == "") return

         let url = `https://www.googleapis.com/books/v1/volumes?q=${tgtName}:${tgtValue}`
         axios.get(url).then((response) => {
            if (response.data.totalItems > 0) {
               ctx.commit('setGoogleBooksURL', response.data)
            }
         }).catch( (_error) => {
            // NO-OP
         })

      },

      async getDetails(ctx, { source, identifier }) {
         ctx.commit('clearDetails')
         ctx.commit('clearAvailability')

         // get source from poolID
         let baseURL = ""
         let pool = null
         let pools = ctx.rootState.pools.list
         pool = pools.find( p => p.id == source)

         if (!pool) {
           ctx.commit('clearSearching')
           this.router.push(`/not_found`)
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

         // strip punctuation that may be lingeraing at end of key from a bad cut/paste
         catalogKey = cleanIdentifier(catalogKey)

         let req = {
            query: `identifier: {${catalogKey}}`,
            pagination: { start: 0, rows: 1 },
         }

         try {
            let response = await axios.post(`${ctx.rootState.system.searchAPI}/api/search`, req)
            if (response.data.total_hits == 1 ) {
               ctx.commit('setCatalogKeyDetails', response.data)
               // NOTE:  the result above only contains basic fields. the redirect below
               // will trigger a full record get
               let redirect = `/sources/${ctx.state.details.source}/items/${ctx.state.details.identifier}`
               await this.router.replace(redirect)
            } else {
               ctx.commit("clearDetails")
               let q = `identifier: {${catalogKey}}`
               await this.router.replace(`/search?mode=advanced&q=${encodeURIComponent(q)}`)
            }
         } catch(error) {
            ctx.commit('clearSearching')
            ctx.commit("clearDetails")
            if ( error.response && error.response.status == 404) {
               console.warn(`Catalog Key ${catalogKey} not found`)
               this.router.push(`/not_found`)
            }
         }
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
