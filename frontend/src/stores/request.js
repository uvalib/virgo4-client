import axios from 'axios'
import analytics from '../analytics'
import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"

export const useRequestStore = defineStore('request', {
	state: () => ({
      options: [],
      directLink: null,
      pdaLink: null,

      errors: {},
      working: false,
      failed: false,

      // info about the last successful request; used on confirm panel
      requestInfo: {
         itemLabel: "",
         pickupLibrary: "",
         callNumber: "",
         notes: ""
      },

      requestStats: {
         remediationRequests: 0,
         remediationLimit: 0,
         remediationDisabled: false,
         otherRequests: 0,
         otherRequestsLimit: 0,
         otherRequestsDisabled: false
      },

      openurl: {
         requestType: "Loan",
         documentType: "Book",
         processType: "Borrowing",
         title: "",
         article: "",
         author: "",
         publisher: "",
         edition: "",
         volume: "",
         issue: "",
         month: "",
         year: "",
         pages: "",
         issn: "",
         oclc: "",
         anylanguage: "true",
         citedin: "",
         notes: "",
         pickup: "",
         status: ""
      },

      activeRequest: 'none',
   }),

   getters: {
      isRemediateDisabled: (store) => {
         return store.requestStats.remediationDisabled
      },
      otherRequestsDisabled: (store) => {
         return store.requestStats.otherRequestsDisabled
      },
      hasOptions: (store) => {
         return store.options.length > 0
      },
      hasOption: (store) => {
         return (reqType) => {
            if (reqType == "directLink") {
               return (store.directLink != null)
            }
            if (reqType == "pda") {
               return (store.pdaLink != null)
            }
            let found = false
            store.options.some( (opt) => {
               found = opt.requests.includes(reqType)
               return found
            })
            return found
         }
      },
      optionItems: (store) => {
         let out = []
         if ( store.activeRequest != 'none' ) {
            store.options.map( opt => {
               if (opt.requests.includes(store.activeRequest)) {
                  out.push( {label: opt.callNumber, value: opt} )
               }
            })
         }
         return out
      },
      isStreamingReserve: (store) => {
         let found = false
         if ( store.activeRequest == 'videoReserve' ) {
            store.options.some( opt => {
               found = opt.streamingReserve
               return found
            })
         }
         return found
      }
   },
   actions: {
      clearAll() {
         this.$reset()
      },

      resetData() {
         // preserve the request options and restore them after the reset
         let saved = this.requestOptions.slice(0)
         this.$reset()
         this.requestOptions = saved
      },

      setOptions( data ) {
         this.$reset()
         if ( data ) {
            this.options = data.items
            if ( data.streamingVideoReserve ) {
               let requests = ["videoReserve"]
               this.options.push({ requests: requests, streamingReserve:  true} )
            }
            if ( data.hsaScanURL ) {
               this.directLink = data.hsaScanURL
            }
            if ( data.pdaURL ) {
               this.pdaLink = data.pdaURL
            }
         }
      },

      setOpenURLRequestGenre(genre) {
         // genre determines what type of form, and also a bunch of request values
         if (genre == "article" || genre == "preprint") {
            this.openurl.requestType = "Article"
            this.openurl.documentType = "Article"
            this.openurl.processType = "Borrowing"
         } else if ( genre == "bookitem" || genre == "conference" || genre == "proceeding") {
            this.openurl.requestType = "Article"
            this.openurl.documentType = "Book Chapter"
            this.openurl.processType = "Borrowing"
         }  else  {
            this.openurl.requestType = "Loan"
            this.openurl.documentType = "Book"
            this.openurl.processType = "Borrowing"
         }
      },

      getStandaloneRequestUsage() {
         this.working = true
         this.failed = false
         axios.get('/api/requests/standalone/outstanding').then( resp => {
            this.requestStats = resp.data
         }).catch(e => {
            console.log("unable to check request limits")
            console.error(e)
         }).finally(()=>
            this.working = false
         )
      },

      async submitOpenURLRequest() {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "openURL")
         this.working = true
         this.failed = false
         await axios.post('/api/requests/openurl', this.openurl
         ).catch(e =>
            useSystemStore().setError(e)
         ).finally(()=>
            this.working = false
         )
      },
      async submitILLiadBorrowRequest(req) {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "illiadBorrow")
         this.working = true
         this.failed = false
         await axios.post('/api/requests/standalone/borrow', req
         ).catch(e =>
            useSystemStore().setError(e)
         ).finally(()=>
            this.working = false
         )
      },
      async submitILLiadScanRequest(req) {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "illiadScan")
         this.working = true
         this.failed = false
         await axios.post('/api/requests/standalone/scan', req
         ).catch(e =>
            useSystemStore().setError(e)
         ).finally(()=>
            this.working = false
         )
      },
       async submitPDFRemediationRequest(req, file) {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "pdfRemediation")
         this.working = true
         this.failed = false

         let formData = new FormData()
         formData.append('file', file)
         formData.append('course', req.course)
         formData.append('work', req.work)
         formData.append('title', req.title)
         await axios.post('/api/requests/standalone/remediate', formData, {
            headers: {
               'Content-Type': 'multipart/form-data',
            }
         }).catch(e =>
            useSystemStore().setError(e)
         ).finally(()=>
            this.working = false
         )
      },
      async submitScan( scan ) {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "scan")
         this.working = true
         this.failed = false
         this.errors = {}

          // track this request so it can be displayed on confirmation panel
          this.requestInfo.pickupLibrary = ""
          this.requestInfo.callNumber = scan.callNumber
          this.requestInfo.notes = scan.notes

         await axios.post('/api/requests/scan', scan).catch( e => {
            useSystemStore().setError(e)
            this.failed = true
         }).finally(()=>
            this.working = false
         )
      },

      async createHold( item, pickupLibrary) {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "createHold")
         this.working = true
         this.failed = false
         this.errors = {}

         // track this request so it can be displayed on confirmation panel
         this.requestInfo.pickupLibrary = pickupLibrary
         this.requestInfo.callNumber = item.callNumber
         this.requestInfo.notes = ""

         let req = {itemBarcode: item.barcode, pickupLibrary: pickupLibrary}
         await axios.post('/api/requests/hold', req)
            .then(response => {
               if (response.data.hold.errors) {
                  this.errors = response.data.hold.errors
                  this.failed = true
               }
            }).catch(e => {
               // Connenction problem
               useSystemStore().setError(e)
               this.failed = true
            }).finally(()=>{
               this.working = false
            })
      },

      cancelHold(holdData) {
         const userStore = useUserStore()
         this.working = true
         axios
           .delete("/api/requests/hold", { data: holdData })
           .then((response) => {
             if (response.status == 200) {
               useSystemStore().setMessage("Your hold cancellation has been received.")
               userStore.getRequests();
             } else {
               useSystemStore().setError(response.data);
             }
           })
           .catch((e) => useSystemStore().setError(e))
           .finally(() => (this.working = false))
      },

      async submitPDARequest() {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "pda")
         this.working = true
         this.failed = false
         await axios.post(this.pdaLink)
            .catch(e => {
               let message = e.response.data.error || "There was a problem sending this order. Please try again later."
               useSystemStore().setError(message)
               this.failed = true
            }).finally(()=>{
               this.working = false
            })
      },
      submitAeon( item, specialInstructions) {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "aeon")
         this.working = true

         // track this request so it can be displayed on confirmation panel
         this.requestInfo.pickupLibrary = ""
         this.requestInfo.callNumber = item.callNumber
         this.requestInfo.notes = specialInstructions

         var url = item.aeonURL
         url += `&SpecialRequest=${encodeURIComponent(specialInstructions)}`
         window.open(url, "_blank")

         this.working = false
      },
   }
})
