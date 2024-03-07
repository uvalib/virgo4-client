import axios from 'axios'
import analytics from '../analytics'
import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"

export const useRequestStore = defineStore('request', {
	state: () => ({
      alertText: '',
      requestOptions: [],
      errors: {},
      buttonDisabled: false,

      // info about the last successful request; used on confirm panel
      requestInfo: {
         itemLabel: "",
         pickupLibrary: "",
         callNumber: "",
         notes: ""
      },

      // selected request option
      activeOption: {},

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

      activePanel: 'OptionsPanel',

      // Map request type to panel Name
      optionMap: {
         hold: 'PlaceHoldPanel',
         aeon: 'AeonPanel',
         pda: 'PDAPanel',
         scan: 'ScanPanel',
         directLink: 'directLink',
         videoReserve: 'VideoReservePanel'
      },
   }),

   getters: {
      hasRequestOptions: (store) => {
         return Array.isArray(store.requestOptions) && store.requestOptions.length > 0
      },
      findOption: (store) => {
         return (panelName) => {
            let option = store.requestOptions.find(opt => {
               let foundKey = Object.keys(store.optionMap).find(key => store.optionMap[key] === panelName)
               return opt.type == foundKey
            })
            return option
         }
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
         this.buttonDisabled = true
         await axios.post('/api/requests/openurl', this.openurl
         ).catch(e =>
            useSystemStore().setError(e)
         ).finally(()=>
            this.buttonDisabled = false
         )
      },
      async submitILLiadBorrowRequest(req) {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "illiadBorrow")
         this.buttonDisabled = true
         await axios.post('/api/requests/standalone/borrow', req
         ).catch(e =>
            useSystemStore().setError(e)
         ).finally(()=>
            this.buttonDisabled = false
         )
      },
      async submitILLiadScanRequest(req) {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "illiadScan")
         this.buttonDisabled = true
         await axios.post('/api/requests/standalone/scan', req
         ).catch(e =>
            useSystemStore().setError(e)
         ).finally(()=>
            this.buttonDisabled = false
         )
      },
      submitScan( scan ) {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "scan")
         this.buttonDisabled = true
         this.errors = {}

          // track this request so it can be displayed on confirmation panel
          this.requestInfo.itemLabel = scan.label
          this.requestInfo.pickupLibrary = ""
          this.requestInfo.callNumber = scan.callNumber
          this.requestInfo.notes = scan.notes

         axios.post('/api/requests/scan', scan).then(_response => {
            this.activePanel = "ConfirmationPanel"
         }).catch(e =>
            useSystemStore().setError(e)
         ).finally(()=>
            this.buttonDisabled = false
         )
      },
      createHold( item, pickupLibrary) {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "createHold")
         this.buttonDisabled = true
         this.errors = {}

         // track this request so it can be displayed on confirmation panel
         this.requestInfo.itemLabel = item.label
         this.requestInfo.pickupLibrary = pickupLibrary
         this.requestInfo.callNumber = ""
         this.requestInfo.notes = ""

         let req = {itemLabel: item.label, itemBarcode: item.barcode, pickupLibrary: pickupLibrary}
         axios.post('/api/requests/hold', req)
            .then(response => {
               if (response.data.hold.errors) {
                  this.errors = response.data.hold.errors
               } else {
                  this.activePanel = "ConfirmationPanel"
               }
            }).catch(e =>
               // Connenction problem
               useSystemStore().setError(e)
            ).finally(()=>
               this.buttonDisabled = false
            )
      },
      cancelHold(holdData) {
         const userStore = useUserStore()
         this.buttonDisabled = true
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
           .finally(() => (this.buttonDisabled = false));
      },
      sendDirectLink() {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "pda")
         this.buttonDisabled = false
         axios.post(this.activeOption.create_url)
            .then(_response => {
               this.activePanel = "ConfirmationPanel"
            }).catch(e => {
               this.activePanel = "OptionsPanel"
               let message = e.response.data.error || "There was a problem sending this order. Please try again later."
               useSystemStore().setError(message)
            }).finally(()=>{
               this.buttonDisabled = false
            })
      },
      submitAeon( item, specialInstructions) {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "aeon")
         this.buttonDisabled = true

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

         this.buttonDisabled = false
         this.activePanel = "ConfirmationPanel"
      },
   }
})
