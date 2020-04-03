import { getField, updateField } from 'vuex-map-fields'
import axios from 'axios'
const requests = {
  namespaced: true,
  state: {
    alertText: '',
    hold: {
      itemBarcode: null,
      pickupLibrary: null
    },
    steps: [
      'SignInStep',
      'PlaceHoldStep'

    ]

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
      axios.post('/api/requests/hold', hold)
      .then( response =>
            ctx.commit('alertText', response.data.hold.errors)
           )
           .catch(e =>
             ctx.commit('alertText', "Error:" + e)
                 )

    },

  }
}

export default requests
