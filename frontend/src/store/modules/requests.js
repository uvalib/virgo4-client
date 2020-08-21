import { getField, updateField } from 'vuex-map-fields'
import axios from 'axios'
const requests = {
   namespaced: true,
   state: {
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

      activePanel: '',

      // Map request type to panel Name
      optionMap: {
         hold: 'PlaceHoldPanel',
         aeon: 'AeonPanel',
         pda: 'PDAPanel',
         scan: 'ScanPanel',
         directLink: 'directLink',
         videoReserve: 'VideoReservePanel'
      },

   },
   getters: {
      getField,
      alertText(store) {
         return store.alertText
      },
      findOption: (store) => (panelName) => {
         let option = store.requestOptions.find(opt => {
            let foundKey = Object.keys(store.optionMap).find(key => store.optionMap[key] === panelName)
            return opt.type == foundKey
         })
         return option
      }
   },
   mutations: {
      updateField,
      setOpenURLRequestGenre(state, genre) {
         // genre determines what type of form, and also a bunch of request values
         if (genre == "article" || genre == "preprint") {
            state.openurl.requestType = "Article"
            state.openurl.documentType = "Article"
            state.openurl.processType = "Borrowing"
         } else if ( genre == "bookitem" || genre == "conference" || genre == "proceeding") {
            state.openurl.requestType = "Article"
            state.openurl.documentType = "Book Chapter"
            state.openurl.processType = "Borrowing"
         }  else  {
            state.openurl.requestType = "Loan"
            state.openurl.documentType = "Book"
            state.openurl.processType = "Borrowing"
         }
      },
      activePanel(store, name) {
         store.activePanel = name
      },
      setRequestOptions(store, ro) {
         store.requestOptions = ro
      },
      setErrors(store, errors) {
         store.errors = errors
      },
      alertText(store, text) {
         store.alertText = text
      },
      disableButton(store, isDisabled) {
         store.buttonDisabled = isDisabled
      },
      reset(store) {
         store.activePanel = 'OptionsPanel'
         store.alertText = ''
         store.buttonDisabled = false
         store.errors =  {}
         store.hold = {
            itemBarcode: '',
            itemLabel: '',
            pickupLibrary: ''
         }
         store.aeon = {
            callNumber: '',
            barcode: '',
            notes: '',
            location: '',
            specialRequest: ''
         }
         store.scan = {
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
         store.openurl = {
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
         }
      }
   },
   actions: {
      async submitOpenURLRequest(ctx) {
         ctx.commit('disableButton', true)
         await axios.post('/api/requests/openurl', ctx.state.openurl
         ).catch(e =>
            ctx.commit('system/setError', e, { root: true })
         ).finally(()=>
            ctx.commit('disableButton', false)
         )
      },
      async submitILLiadBorrowRequest(ctx, req) {
         ctx.commit('disableButton', true)
         await axios.post('/api/requests/standalone/borrow', req
         ).catch(e =>
            ctx.commit('system/setError', e, { root: true })
         ).finally(()=>
            ctx.commit('disableButton', false)
         )
      },
      async submitILLiadScanRequest(ctx, req) {
         ctx.commit('disableButton', true)
         await axios.post('/api/requests/standalone/scan', req
         ).catch(e =>
            ctx.commit('system/setError', e, { root: true })
         ).finally(()=>
         ctx.commit('disableButton', false)
         )
      },
      submitScan(ctx) {
         ctx.commit('disableButton', true)
         axios.post('/api/requests/scan', ctx.state.scan).then(_response => {
            ctx.commit('activePanel', "ConfirmationPanel")
         }).catch(e =>
            ctx.commit('system/setError', e, { root: true })
         ).finally(()=>
            ctx.commit('disableButton', false)
         )
      },
      createHold(ctx) {
         ctx.commit('disableButton', true)
         let hold = ctx.getters.getField('hold')
         hold.pickupLibrary = ctx.rootGetters.getField('preferences.pickupLibrary').id
         axios.post('/api/requests/hold', hold)
            .then(response => {
               if (response.data.hold.errors) {
                  ctx.commit('setErrors', response.data.hold.errors)
                  //ctx.commit('system/setError', response.data.hold.errors, { root: true })
               } else {
                  ctx.commit('activePanel', "ConfirmationPanel")
               }
            }).catch(e =>
               // Connenction problem
               ctx.commit('system/setError', e, { root: true })
            ).finally(()=>
               ctx.commit('disableButton', false)
            )
      },
      deleteHold({ commit, dispatch }, holdId) {
         commit('disableButton', true)
         axios.delete('/api/requests/hold/' + holdId)
            .then(response => {
               if (response.status == 200) {
                  dispatch("user/getRequests", null, { root: true })
               } else {
                  commit('system/setError', response.data, { root: true })
               }
            }).catch(e =>
               // Connenction problem
               commit('system/setError', e, { root: true })
            ).finally(()=>
               commit('disableButton', false)
            )
      },
      sendDirectLink(ctx) {
         ctx.commit('disableButton', false)
         let optionSettings = ctx.getters.getField("activeOption")
         axios.post(optionSettings.create_url)
            .then(_response => {
               // success

               ctx.commit('activePanel', "ConfirmationPanel")
            }).catch(e => {
               ctx.commit('activePanel', "OptionsPanel")
               let message = e.response.data.error || "There was a problem sending this order. Please try again later."
               ctx.commit('system/setError', message, { root: true })
            }).finally(()=>{
               ctx.commit('disableButton', false)
            })
      },
      submitAeon(ctx) {
         ctx.commit('disableButton', true)
         let optionSettings = ctx.getters.getField("activeOption")
         let selected = ctx.getters.getField("aeon")
         if (selected.barcode == '') {
            ctx.commit('setErrors', {barcode: 'An item must be selected.'})
            ctx.commit('disableButton', false)
            return
         }

         const url = require('url')
         let aeonLink = url.parse(optionSettings.create_url, true)
         aeonLink.query["CallNumber"] = selected.callNumber
         aeonLink.query["ItemVolume"] = selected.callNumber
         aeonLink.query["ItemNumber"] = selected.barcode
         aeonLink.query["Notes"] = selected.notes
         aeonLink.query["Location"] = selected.location
         aeonLink.query["SpecialRequest"] = selected.specialRequest

         // needs to be null to regenerate query below
         aeonLink.search = null
         let aeonUrl = url.format(aeonLink)
         if (aeonUrl.length > 700){
            aeonLink.query["Notes"] = selected.notes.substring(0,800)
            aeonLink.search = null
         }
         window.open(url.format(aeonLink), "_blank")

         ctx.commit('disableButton', false)
         ctx.commit('activePanel', "ConfirmationPanel")
      }
   }
}

export default requests
