import axios from 'axios'
import { defineStore } from 'pinia'
import { usePoolStore } from "@/stores/pool"
import { useSystemStore } from "@/stores/system"
import { useRequestStore } from "@/stores/request"
import * as utils from '../utils'

export const useItemStore = defineStore('item', {
	state: () => ({
      details: {searching: true, source: "", identifier:"", basicFields:[], detailFields:[], related:[] },
      digitalContent: [],
      googleBooksURL: "",
      googleBookThumbURL: "",
      loadingDigitalContent: false,
      availability: {searching: true, titleId: "", display: [], items: [], bound_with: [], error: ""},
   }),

   getters: {
      identifier: state => {
         return state.details.identifier
      },
      generalFormat: state => {
         let genTypeF = state.details.basicFields.find( bf => bf.name == "general_format")
         if (!genTypeF) {
            return ""
         }
         return genTypeF.value
      },
      isDigitalCollection: state => {
         return state.details.detailFields.findIndex( f=> f.name == 'digital_collection') > -1
      },
      digitalCollectionName: state => {
         let field = state.details.detailFields.find( f=> f.name == 'digital_collection')
         if (field) {
            return field.value
         }
         return ""
      },
      collectionPosition: state => {
         let field = state.details.detailFields.find( f=> f.name == 'collection_position')
         if (field) {
            return field.value.replace(/^\w/, c => c.toUpperCase())
         }
         return ""
      },
      isCollection: state => {
         return state.details.detailFields.findIndex( f=> f.name == 'collection_context') > -1
      },
      isCollectionHead: state => {
         return state.details.detailFields.findIndex( f=> f.name == 'collection_head') > -1
      },
      collectionName: state => {
         let field = state.details.detailFields.find( f=> f.name == 'collection_context')
         if (field) {
            return field.value
         } else {
            field = state.details.detailFields.find( f=> f.name == 'collection_head')
            if (field) {
               return field.value
            }
         }
         return ""
      },
      hasDigitalContent: state => {
         if ( !state.digitalContent) return false
         return state.digitalContent.length > 0
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

   actions: {
      setDigitalContentStatus( pid, type, status ) {
         let dcIdx = this.digitalContent.findIndex( f=>f.pid==pid )
         if ( dcIdx >= 0) {
            let dc = this.digitalContent[dcIdx]
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
            this.digitalContent.splice(dcIdx, 1, dc)
         }
      },
      setDigitalContentData(data) {
         this.digitalContent.splice(0, this.digitalContent.length)
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
            this.digitalContent.push(dc)
         })
      },
      clearDetails() {
         this.$reset()
      },
      clearAvailability() {
        this.availability = {searching: true, titleId: '', display: [], items: [], bound_with: [], error: ""}
      },
      clearSearching() {
        this.details.searching = false
        this.availability.searching = false
      },
      setCatalogKeyDetails(data) {
         let found = false
         data.pool_results.some( pr => {
            if (pr.group_list && pr.group_list.length == 1) {
               let obj = pr.group_list[0].record_list[0]
               if (obj) {
                  let source = pr.pool_id
                  let poolURL = pr.service_url
                  utils.preProcessHitFields( poolURL, [obj] )
                  obj.source = source
                  this.details = obj
                  found = true
               }
            }
            return found == true
         })
         this.details.searching = true
      },

      async generatePDF(item) {
         try {
            await axios.get(item.pdf.generateURL)
            await this.getPDFStatus(item)
         } catch (err) {
            this.setDigitalContentStatus(item.pid, "PDF", "ERROR")
         }
      },
      async getPDFStatus(item) {
         try {
            let response = await axios.get(item.pdf.statusURL)
            this.setDigitalContentStatus(item.pid, "PDF", response.data)
         } catch(error) {
            this.setDigitalContentStatus(item.pid, "PDF", "NOT_AVAIL")
         }
      },
      async generateOCR({item, email} ) {
         let url = `${item.ocr.generateURL}?email=${email}`
         await axios.get(url).catch( () => {
            this.setDigitalContentStatus( item.pid, "PDF", "ERROR")
         })
         await this.getOCRStatus(item)
      },
      async getOCRStatus(item) {
         try {
            let response = await axios.get(item.ocr.statusURL)
            this.setDigitalContentStatus(item.pid, "OCR", response.data)
         } catch(error) {
            this.setDigitalContentStatus(item.pid, "OCR", "NOT_AVAIL")
         }
      },
      async downloadOCRText(item) {
         await axios.get(item.ocr.url).then( response => {
            const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: 'text/plain' }))
            const fileLink = document.createElement('a')
            fileLink.href =  fileURL
            fileLink.setAttribute('download', `${item.name}.txt`)
            document.body.appendChild(fileLink)
            fileLink.click()
            window.URL.revokeObjectURL(fileURL)
            this.setDigitalContentStatus(item.pid, "OCR", {has_ocr: true})
         }).catch( e => {
            console.error("Unable to download OCR text: "+e)
            this.setDigitalContentStatus(item.pid, "OCR", "ERROR")
         })
      },
      getDigitalContent() {
         let allFields = this.details.basicFields.concat(this.details.detailFields)
         let dcField = allFields.find( f=>f.name=="digital_content_url")
         if (!dcField) {
            this.details.detailFields.filter( f => f.type == "oembed-url").forEach( o => {
               this.digitalContent.push({
                  oEmbedURL: o.value,
                  pid: this.details.identifier,
               })
            })
            return
         }
         this.loadingDigitalContent = true
         axios.get(dcField.value).then((response) => {
            this.setDigitalContentData(response.data)
            this.loadingDigitalContent = false

            // Get the status of each OCR object. Those that are ready will be available
            // for all to download
            let ocrs = this.digitalContent.filter( item => item.ocr && item.ocr.status == "UNKNOWN")
            let timerID = setInterval( () => {
               if ( ocrs.length > 0) {
                  let dcOCR = ocrs.pop()
                  this.getOCRStatus(dcOCR)
               } else {
                  clearInterval(timerID)
               }
            }, 250)

         }).catch((_error) => {
             this.loadingDigitalContent = false
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
            let done = false
            this.googleBookThumbURL = ""
            this.googleBooksURL = ""
            response.data.items.some( item => {
               if (item.accessInfo.viewability != "NO_PAGES") {
                  if ( this.details.header.title.includes(item.volumeInfo.title)) {
                     if ( item.volumeInfo.canonicalVolumeLink ) {
                        this.googleBooksURL = item.volumeInfo.canonicalVolumeLink
                     } else if ( item.volumeInfo.infoLink ) {
                        this.googleBooksURL = item.volumeInfo.infoLink
                     }
                     else if (item.accessInfo.webReaderLink) {
                        this.googleBooksURL = item.accessInfo.webReaderLink
                     }
                     if (item.volumeInfo.imageLinks.smallThumbnail) {
                        this.googleBookThumbURL = item.volumeInfo.imageLinks.smallThumbnail
                     }
                     done = true
                  }
               }
               return done == true
            })
         }).catch( () => {
            // NO-OP
         })
      },

      async getDetails( source, identifier ) {
         this.clearDetails()
         this.clearAvailability()

         // get source from poolID
         const poolStore = usePoolStore()
         let baseURL = ""
         let pool = null
         let pools = poolStore.list
         pool = pools.find( p => p.id == source)

         if (!pool) {
           this.clearSearching()
           this.router.push(`/not_found`)
           return
         }

         baseURL = pool.url
         let url = baseURL + "/api/resource/" + identifier
         await axios.get(url).then((response) => {
            let details = response.data
            utils.preProcessHitFields( pool.url, [details] )
            if ( details.related ) {
               // strip out this item info from related
               details.related = details.related.filter(  r => r.id != details.identifier)
            }
            details.source = source
            details.searching = true
            this.details = details
            this.digitalContent.splice(0, this.digitalContent.length)

            this.getDigitalContent()
            this.getGoogleBooksURL()
            this.clearSearching()
         }).catch( async (error) => {
            if ( error.response && error.response.status == 404) {
               console.warn(`Item ID ${identifier} not found in ${source}; try a lookup`)
               await this.lookupCatalogKeyDetail(identifier)
            } else {
               this.clearSearching()
               useSystemStore().setError(error)
            }
         })
      },

      async getAvailability(titleId) {
         const system = useSystemStore()
         const requestStore = useRequestStore()

         this.clearAvailability()
         let url = `${system.availabilityURL}/item/${titleId}`
         axios.get(url).then((response) => {
            if (response.data) {
               this.availability.titleId = titleId
               this.availability.display = response.data.availability.display
               this.availability.items = response.data.availability.items
               this.availability.bound_with = response.data.availability.bound_with
               this.availability.searching = false
               requestStore.setRequestOptions(response.data.availability.request_options)
            }
            this.clearSearching()
         }).catch((error) => {
            this.clearSearching()
            if (error.response && error.response.status != 404) {
               this.availability.error = error.response.data
            }
         })
      },

      // This is used to lookup a catalog key without a source. end result of this action is a redirect
      async lookupCatalogKeyDetail(catalogKey) {
         this.clearDetails()
         this.clearAvailability()

         // strip punctuation that may be lingeraing at end of key from a bad cut/paste
         catalogKey = cleanIdentifier(catalogKey)

         let req = {
            query: `identifier: {${catalogKey}}`,
            pagination: { start: 0, rows: 1 },
         }

         try {
            const system = useSystemStore()
            let response = await axios.post(`${system.searchAPI}/api/search`, req)
            if (response.data.total_hits == 1 ) {
               this.setCatalogKeyDetails(response.data)
               // NOTE:  the result above only contains basic fields. the redirect below
               // will trigger a full record get
               let redirect = `/sources/${this.details.source}/items/${this.details.identifier}`
               await this.router.replace(redirect)
            } else {
               this.clearDetails()
               let q = `identifier: {${catalogKey}}`
               await this.router.replace(`/search?mode=advanced&q=${encodeURIComponent(q)}`)
            }
         } catch(error) {
            this.clearSearching()
            this.clearDetails()
            if ( error.response && error.response.status == 404) {
               console.warn(`Catalog Key ${catalogKey} not found`)
               this.router.push(`/not_found`)
            }
         }
      },

      async getCitations({format, itemURL}) {
         const system = useSystemStore()
         let url = `${system.citationsURL}/format/${format}?item=${encodeURI(itemURL)}`
         return axios.get(url)
      },
   }
})

function cleanIdentifier(identifier) {
   // strip spaces and punctuation that may be attached to an identifier that was cut and pasted
   let clean = identifier.trim()
   clean = clean.replace(/(:|;|,|-|"|!|'|\?|\.|\]|\))+$/, '')
   return clean
}
