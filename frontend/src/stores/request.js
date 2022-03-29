import axios from 'axios'
import analytics from '../analytics'
import urlModule from 'url'
import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import { useItemStore } from "@/stores/item"

export const useRequestStore = defineStore('request', {
	state: () => ({
      alertText: '',
      requestOptions: [],
      errors: {},
      buttonDisabled: false,

      // selected request option
      activeOption: {},

      hold: {
         itemBarcode: '',
         itemLabel: '',
         pickupLibrary: ''
      },
      aeon: {
         barcode: '',
         notes: '',
         callNumber: '',
         specialRequest: '',
         location: ''
      },
      scan: {
         barcode: '',
         issn: '',
         type: 'Article',
         title: '',
         chapter: '',
         author: '',
         volume: '',
         issue: '',
         year: '',
         pages: '',
         notes: '',
         library: '',
         location: '',
         callNumber: ''
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
         bydate: "",
         anylanguage: "false",
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
      hasRequestOptions(store) {
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
         this.$reset()
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
      submitScan() {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "scan")
         this.buttonDisabled = true
         axios.post('/api/requests/scan', this.scan).then(_response => {
            this.activePanel = "ConfirmationPanel"
         }).catch(e =>
            useSystemStore().setError(e)
         ).finally(()=>
            this.buttonDisabled = false
         )
      },
      createHold() {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "createHold")
         this.buttonDisabled = true
         this.hold.pickupLibrary = this.preferencesStore.pickupLibrary.id
         if(this.hold.pickupLibrary == ""){
            this.errors = {sirsi: ["A pickup location is required."]}
            this.buttonDisabled = false
            return
         }
         axios.post('/api/requests/hold', this.hold)
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
      deleteHold(holdId) {
         const userStore = useUserStore()
         this.buttonDisabled = true
         axios.delete('/api/requests/hold/' + holdId)
            .then(response => {
               if (response.status == 200) {
                  userStore.getRequests()
               } else {
                  useSystemStore().setError(response.data)
               }
            }).catch(e =>
               useSystemStore().setError(e)
            ).finally(()=>
               this.buttonDisabled = false
            )
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
      submitAeon() {
         analytics.trigger('Requests', 'REQUEST_SUBMITTED', "aeon")
         this.buttonDisabled = true
         if (this.aeon.barcode == '') {
            this.errors = {barcode: 'An item must be selected.'}
            this.buttonDisabled = false
            return
         }

         let aeonLink = urlModule.parse(this.activeOption.create_url, true)
         aeonLink.query["CallNumber"] = this.aeon.callNumber
         aeonLink.query["ItemVolume"] = this.aeon.callNumber
         aeonLink.query["ItemNumber"] = this.aeon.barcode
         aeonLink.query["Notes"] = this.aeon.notes
         aeonLink.query["Location"] = this.aeon.location
         aeonLink.query["SpecialRequest"] = this.aeon.specialRequest

         // search needs to be null to regenerate query below
         aeonLink.search = null
         let aeonUrl = aeonLink.format(aeonLink)
         if (aeonUrl.length > 650){
            aeonLink.query["Notes"] = this.aeon.notes.substring(0,650) + '...'
            aeonLink.search = null
         }
         window.open(aeonLink.format(aeonLink), "_blank")

         this.buttonDisabled = false
         this.activePanel = "ConfirmationPanel"
      },
      reload(){
         const itemStore = useItemStore()
         let ident = itemStore.identifier
         if (ident) {
            itemStore.getAvailability(ident)
         }
      }
   }
})
