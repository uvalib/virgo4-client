import axios from 'axios'

const collection = {
   namespaced: true,
   state: {
      lookingUp: false,
      features: [],
      id: "",
      description: "",
      itemLabel: "Issue",
      startDate: "",
      endDate: "",
      selectedYear: "",
      filter: {
         name: "",
         value: ""
      }
   },

   getters: {
      isAvailable: state => {
         return (state.id != "" && state.lookingUp == false)
      },
      canSearch: state => {
         return state.features.findIndex( f => f == "search_within") > -1
      },
      hasCalendar: state => {
         return state.features.findIndex( f => f == "calendar_navigation") > -1
      },
      isFullPage: state => {
         return state.features.findIndex( f => f == "full_page_view") > -1
      },
      canNavigate: state => {
         return state.features.findIndex( f => f == "sequential_navigation") > -1
      }
   },

   mutations: {
      setLookingUp(state, flag) {
         state.lookingUp = flag
      },
      clearCollectionDetails(state) {
         state.id = ""
         state.features.splice(0, state.features.length)
         state.description  = ""
         state.itemLabel = "Issue"
         state.startDate = ""
         state.endDate = ""
         state.filter = {name: "", value: ""}
         state.selectedYear = ""
      },
      setCollectionDetails(state, data) {
         state.id = data.id
         state.features.splice(0, state.features.length)
         data.features.forEach( f=> state.features.push(f) )
         state.description  = data.description
         state.itemLabel = data.items_label
         state.startDate = data.start_date
         state.endDate = data.end_date
         if (state.startDate && state.startDate != "") {
            state.selectedYear = state.startDate.split("-")[0]
         }
         state.filter = {name: data.filter, value: data.filter_value}
      }
   },
   actions: {
      async getCollectionContext(ctx, collection) {
         ctx.commit("setLookingUp", true)

         let url = `${ctx.rootState.system.collectionsURL}/collection/${collection}`
         await axios.get(url).then((response) => {
            ctx.commit("setCollectionDetails", response.data)
            ctx.commit("setLookingUp", false)
         }).catch( () => {
            ctx.commit("setLookingUp", false)
            ctx.commit("setCollectionDetails")
         })
      },
   }
}

export default collection