import { getField, updateField } from 'vuex-map-fields'
import axios from 'axios'
const requests = {
  namespaced: true,
  state: {
    alertText: '',
    requestOptions: [],
    holdOptions: {},
    hold: {
      itemBarcode: null,
      pickupLibrary: null
    },
    activePanel: '',

    // Map request type to panel Name
    optionMap: {
      hold: 'PlaceHoldPanel'
    }

  },
  getters: {
    getField,
    alertText(store){
      return store.alertText
    },
    totalSteps(store){
      return store.steps.length
    }
  },
  mutations: {
    updateField,
    setRequestOptions(store, ro){
      store.requestOptions = ro
      for(let option of ro){
        if(option.type == 'hold'){
          store.holdOptions = option
        }
      }
    },
    alertText(store, text) {
      store.alertText = text
    },
    reset(store) {
      store.alertText = ''
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
          // Switch to confirmation page goes here
          ctx.commit('alertText', "Hold successfully created")
        }
      }).catch(e =>
        //ctx.commit('alertText', e)
        ctx.commit('system/setError', e, {root: true})
      )
    },

  }
}

export default requests
