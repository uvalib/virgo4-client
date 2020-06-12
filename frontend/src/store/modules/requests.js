import { getField, updateField } from 'vuex-map-fields'
import axios from 'axios'
const requests = {
  namespaced: true,
  state: {
    alertText: '',
    requestOptions: [],

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
      specialRequest: ''
    },

    activePanel: '',
    nextPanel: '',

    // Map request type to panel Name
    optionMap: {
      hold: 'PlaceHoldPanel',
      aeon: 'AeonPanel',
      pda: 'PDAPanel'
    },

  },
  getters: {
    getField,
    nextPanel(store){
      return store.nextPanel
    },
    alertText(store){
      return store.alertText
    },
    totalSteps(store){
      return store.steps.length
    },
    findOption: (store) => (panelName) => {
      let option = store.requestOptions.find(opt =>{
        let foundKey = Object.keys(store.optionMap).find(key => store.optionMap[key] === panelName)
        return opt.type == foundKey
      })
      return option
    }
  },
  mutations: {
    updateField,
    activePanel(store, name){
      store.activePanel = name
    },
    setRequestOptions(store, ro){
      store.requestOptions = ro
    },
    alertText(store, text) {
      store.alertText = text
    },
    reset(store) {
      store.activePanel = 'OptionsPanel'
      store.alertText = ''
      store.nextPanel = ''
      store.hold = {
        itemBarcode: null,
        pickupLibrary: null
      }
    }
  },
  actions: {
    createHold(ctx){

      let hold = ctx.getters.getField('hold')
      hold.pickupLibrary = ctx.rootGetters.getField('preferences.pickupLibrary')
      axios.post('/api/requests/hold', hold)
      .then( response => {
        if (response.data.hold.errors) {
          ctx.commit('system/setError', response.data.hold.errors, {root: true})
        } else {
          ctx.commit('activePanel', "ConfirmationPanel")
        }
      }).catch(e =>
        // Connenction problem
        ctx.commit('system/setError', e, {root: true})
      )
    },
    deleteHold({commit, dispatch}, holdId){
      axios.delete('/api/requests/hold/' + holdId)
      .then( response => {
        if(response.status == 200){
          dispatch("user/getRequests", null, {root: true})
        }else{
          commit('system/setError', response.data, {root: true})
        }
      }).catch(e =>
        // Connenction problem
        commit('system/setError', e, {root: true})
      )
    },
    sendDirectLink(ctx){
      let optionSettings = ctx.getters.getField("activeOption")
      axios.post(optionSettings.create_url)
      .then( _response => {
        // success

        ctx.commit('activePanel', "ConfirmationPanel")
      }).catch(e => {
        ctx.commit('activePanel', "OptionsPanel")
        let message = e.response.data.error || "There was a problem sending this order. Please try again later."
        ctx.commit('system/setError', message, {root: true})
      })

    }
  }
}

export default requests
