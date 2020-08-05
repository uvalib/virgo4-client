import { getField, updateField } from 'vuex-map-fields'
import axios from 'axios'
const requests = {
   namespaced: true,
   state: {
      alertText: '',
      requestOptions: [],
      errors: {},

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
         type: 'Collab',
         title: '',
         chapter: '',
         author: '',
         volume: '',
         issue: '',
         year: '',
         pages: '',
         notes: '',
         library: ''
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
      reset(store) {
         store.activePanel = 'OptionsPanel'
         store.alertText = ''
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
            type: 'Collab',
            title: '',
            chapter: '',
            author: '',
            volume: '',
            issue: '',
            year: '',
            pages: '',
            notes: '',
            library: ''
         }
      }
   },
   actions: {
      async submitILLiadBorrowRequest(ctx, req) {
         await axios.post('/api/requests/standalone/borrow', req).catch(e =>
            ctx.commit('system/setError', e, { root: true })
         )
      },
      async submitILLiadScanRequest(ctx, req) {
         await axios.post('/api/requests/standalone/scan', req).catch(e =>
            ctx.commit('system/setError', e, { root: true })
         )
      },
      submitScan(ctx) {
         axios.post('/api/requests/scan', ctx.state.scan).then(response => {
            if (response.data.scan.errors) {
               ctx.commit('system/setError', response.data.scan.errors, { root: true })
            } else {
               ctx.commit('activePanel', "ConfirmationPanel")
            }
         }).catch(e =>
            ctx.commit('system/setError', e, { root: true })
         )
      },
      createHold(ctx) {
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
            )
      },
      deleteHold({ commit, dispatch }, holdId) {
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
            )
      },
      sendDirectLink(ctx) {
         let optionSettings = ctx.getters.getField("activeOption")
         axios.post(optionSettings.create_url)
            .then(_response => {
               // success

               ctx.commit('activePanel', "ConfirmationPanel")
            }).catch(e => {
               ctx.commit('activePanel', "OptionsPanel")
               let message = e.response.data.error || "There was a problem sending this order. Please try again later."
               ctx.commit('system/setError', message, { root: true })
            })
      },
      submitAeon(ctx) {
         let optionSettings = ctx.getters.getField("activeOption")
         let selected = ctx.getters.getField("aeon")
         if (selected.barcode == '') {
            ctx.commit('setErrors', {barcode: 'An item must be selected.'})
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
            aeonLink.query["Notes"] = selected.notes.substring(0,700) +
               "... (Notes have been shortened. Please see them in full at " + window.location.href + " )"
            aeonLink.search = null
         }
         window.open(url.format(aeonLink), "_blank")

         ctx.commit('activePanel', "ConfirmationPanel")
      }
   }
}

export default requests
