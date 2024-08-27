import axios from 'axios'
import analytics from '../analytics'
import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"

export const useRequestStore = defineStore('request', {
	state: () => ({
      // option types:
      // hold, aeon, pda, scan, directLink, videoReserve
      requestOptions: [],
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

      activePanel: 'none',  // TODO RENAME
   }),

   getters: {
      hasRequestOptions: (store) => {
         return Array.isArray(store.requestOptions) && store.requestOptions.length > 0
      },
      hasRequestOption: (store) => {
         return (reqType) => {
            let optIdx  = store.requestOptions.findIndex( ro => ro.type == reqType)
            return optIdx > -1
         }
      },
      requestOption: (store) => {
         return (reqType) => {
            return store.requestOptions.find( ro => ro.type == reqType)
         }
      },
      items: (store) => {
         var opts = store.requestOptions.find( ro => ro.type == store.activePanel)
         if (opts) {
            return opts.item_options
         }
         return []
      }
   },
   actions: {
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
      reset() {
         // preserve the request options and restore them after the reset
         let saved = this.requestOptions.slice(0)
         this.$reset()
         this.requestOptions = saved
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
      submitScan( scan ) {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "scan")
         this.working = true
         this.failed = false
         this.errors = {}

          // track this request so it can be displayed on confirmation panel
          this.requestInfo.itemLabel = scan.label
          this.requestInfo.pickupLibrary = ""
          this.requestInfo.callNumber = scan.callNumber
          this.requestInfo.notes = scan.notes

         axios.post('/api/requests/scan', scan).then(_response => {
            this.activePanel = "ConfirmationPanel"
         }).catch( e => {
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
         this.requestInfo.itemLabel = item.label
         this.requestInfo.pickupLibrary = pickupLibrary
         this.requestInfo.callNumber = ""
         this.requestInfo.notes = ""

         let req = {itemLabel: item.label, itemBarcode: item.barcode, pickupLibrary: pickupLibrary}
         await axios.post('/api/requests/hold', req)
            .then(response => {
               if (response.data.hold.errors) {
                  this.errors = response.data.hold.errors
               }
            }).catch(e => {
               // Connenction problem
               useSystemStore().setError(e)
               this.failed = true
            }).finally(()=>{
               this.working = false
               console.log("DONE REQEST")
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
      sendDirectLink() {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "pda")
         this.working = false
         axios.post(this.activeOption.create_url)
            .then(_response => {
               this.activePanel = "ConfirmationPanel"
            }).catch(e => {
               this.activePanel = "OptionsPanel"
               let message = e.response.data.error || "There was a problem sending this order. Please try again later."
               useSystemStore().setError(message)
            }).finally(()=>{
               this.working = false
            })
      },
      submitAeon( item, specialInstructions) {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "aeon")
         this.working = true

         // track this request so it can be displayed on confirmation panel
         this.requestInfo.itemLabel = ""
         this.requestInfo.pickupLibrary = ""
         this.requestInfo.callNumber = item.label
         this.requestInfo.notes = specialInstructions

         var url = new URL(this.activeOption.create_url)
         let params = new URLSearchParams(url.search)
         params.set("CallNumber", item.label)
         params.set("ItemVolume", item.label)
         params.set("ItemNumber", item.barcode)
         params.set("Notes", item.notes)
         params.set("Location", item.location)
         params.set("SpecialRequest", specialInstructions)

         let aeonUrl = url.origin+url.pathname+"?"+params.toString()
         window.open(aeonUrl, "_blank")

         this.working = false
         this.activePanel = "ConfirmationPanel"
      },
   }
})
