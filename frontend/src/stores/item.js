import axios from 'axios'
import { defineStore } from 'pinia'
import { usePoolStore } from "@/stores/pool"
import { useSystemStore } from "@/stores/system"
import { useRequestStore } from "@/stores/request"
import * as utils from '../utils'
import analytics from '@/analytics'

export const useItemStore = defineStore('item', {
	state: () => ({
      details: {searching: true, source: "", identifier:"", fields:[], related:[] },
      digitalContent: [],
      loadingDigitalContent: false,
      availability: {searching: true, titleId: "", display: [], libraries: [], bound_with: [], error: ""},
      primaryFields: ["author", "format", "published_date", "subject", "subject_summary"]
   }),

   getters: {
      generalFormat: state => {
         let genTypeF = state.details.fields.find( bf => bf.name == "general_format")
         if (!genTypeF) {
            return ""
         }
         return genTypeF.value
      },
      onlineAccessSources: state => {
         let sources = state.details.fields.find(f => f.name=="access_url")
         if (sources) {
            return sources.value
         }
         return []
      },
      hasContentAdvisory: state => {
         let idx = state.details.fields.findIndex( f=> f.name=="content_advisory")
         return idx > -1
      },
      isDigitalCollection: state => {
         return state.details.fields.findIndex( f=> f.name == 'digital_collection') > -1
      },
      digitalCollectionName: state => {
         let field = state.details.fields.find( f=> f.name == 'digital_collection')
         if (field) {
            return field.value
         }
         return ""
      },
      collectionPosition: state => {
         let field = state.details.fields.find( f=> f.name == 'collection_position')
         if (field) {
            return field.value.replace(/^\w/, c => c.toUpperCase())
         }
         return ""
      },
      isCollection: state => {
         return state.details.fields.findIndex( f=> f.name == 'collection_context') > -1
      },
      isCollectionHead: state => {
         return state.details.fields.findIndex( f=> f.name == 'collection_head') > -1
      },
      collectionName: state => {
         let field = state.details.fields.find( f=> f.name == 'collection_context')
         if (field) {
            return field.value
         } else {
            field = state.details.fields.find( f=> f.name == 'collection_head')
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
         if (state.availability && state.availability.bound_with){
            return state.availability.bound_with.filter(item => item.is_parent == true)
         }else{
            return []
         }
      },
      boundWith: state => {
         if (state.availability && state.availability.bound_with){
            return state.availability.bound_with.filter(item => item.is_parent == false)
         }else{
            return []
         }
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
               analytics.trigger('PDF', 'PDF_LINK_PRESENTED', item.pid)
            }
            if (item.ocr) {
               dc.ocr = {
                  status: "UNKNOWN",
                  url: item.ocr.urls.download,
                  generateURL: item.ocr.urls.generate,
                  statusURL: item.ocr.urls.status,
               }
               analytics.trigger('OCR', 'OCR_LINK_PRESENTED', item.pid)
            }
            this.digitalContent.push(dc)
         })
      },
      clearDetails() {
         this.$reset()
      },
      clearAvailability() {
        this.availability = {searching: true, titleId: '', display: [], libraries: [], bound_with: [], error: ""}
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
      async generateOCR(item, email) {
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
         let dcField = this.details.fields.find( f=>f.name=="digital_content_url")
         if (!dcField) {
            this.details.fields.filter( f => f.type == "oembed-url").forEach( o => {
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

      getItemURL( source, identifier ) {
         // get source from poolID
         const poolStore = usePoolStore()
         let baseURL = ""
         let pool = null
         let pools = poolStore.list
         pool = pools.find( p => p.id == source)

         if (!pool) {
           return ""
         }

         baseURL = pool.url
         let url = baseURL + "/api/resource/" + identifier

         return url
      },

      async getDetails( source, identifier ) {
         this.details.searching = true

         // get source from poolID
         const poolStore = usePoolStore()
         let baseURL = ""
         let pool = null
         let pools = poolStore.list
         pool = pools.find( p => p.id == source)

         if (!pool) {
           this.details.searching = false
           this.router.push(`/not_found`)
           return
         }

         baseURL = pool.url
         let url = baseURL + "/api/resource/" + identifier
         return axios.get(url).then((response) => {
            let details = response.data
            utils.preProcessHitFields( pool.url, [details] )
            if ( details.related ) {
               // strip out this item info from related
               details.related = details.related.filter(  r => r.id != details.identifier)
               // Add this to force all related images to have an advisory for testing
               // details.related.forEach( r => {
               //    r.content_advisory = "ADVISORY"
               // })
            }

            this.details.source = source
            this.details.identifier = identifier
            this.details.itemURL = details.itemURL
            if ( details.cover_image ) {
               this.details.cover_image = details.cover_image
            }
            this.details.header = details.header
            this.details.fields = details.fields
            if ( details.related) {
               this.details.related = details.related
            }
            this.details.holdings = details.holdings
            this.details.searching = false
            this.digitalContent.splice(0, this.digitalContent.length)

            this.getDigitalContent()
            if (poolStore.hasAvailability(this.details.source)){
               this.getAvailability()
            } else {
               this.clearAvailability()
               this.availability.searching = false
            }
            this.details.searching = false
         }).catch( async (error) => {
            if ( error.response && error.response.status == 404) {
               console.warn(`Item ID ${identifier} not found in ${source}; try a lookup`)
               await this.lookupCatalogKeyDetail(identifier)
            } else {
               this.details.searching = false
               useSystemStore().setError(error)
            }
         })
      },

      async getAvailability() {
         const requestStore = useRequestStore()

         this.clearAvailability()
         let url = `/api/availability/${this.details.identifier}`
         return axios.get(url).then((response) => {
            if (response.data) {
               this.availability.titleId = response.data.title_id
               this.availability.bound_with = response.data.bound_with

               // split availability items into library groupings
               this.availability.libraries = []
               if (response.data.items) {
                  response.data.items.forEach( i => {
                     let libInfo = {name: i.library, id: i.library_id, items: []}
                     delete i.library
                     delete i.library_id
                     let existingLib = this.availability.libraries.find( al => al.id == libInfo.id)
                     if ( existingLib ) {
                        existingLib.items.push( i )
                     } else {
                        libInfo.items.push( i )
                        this.availability.libraries.push( libInfo )
                     }
                  })
               }

               // sort avvailability libraries by name
               this.availability.libraries.sort( (a,b) => {
                  if (a.name > b.name) return 1
                  if (a.name < b.name) return -1
                  return 0
               })

               // // HACK IN A SPECIAL ITEM OPTION
               // if ( response.data.request_options.length > 0) {
               //    if ( response.data.request_options[0].item_options.length > 1) {
               //       let last = response.data.request_options[0].item_options.length -1
               //       response.data.request_options[0].item_options[last].label += " (Ivy limited circulation)"
               //    }
               // }
               requestStore.requestOptions = response.data.request_options
            }
            this.availability.searching = false
         }).catch((error) => {
            console.error(error)
            this.details.searching = false
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
            this.details.searching = false
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
