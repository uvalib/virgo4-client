import axios from 'axios'

const collection = {
   namespaced: true,
   state: {
      lookingUp: false,
      id: "",
      title: "",
      description: "",
      itemLabel: "Issue",
      startDate: "",
      endDate: "",
      selectedDate: "",
      currentYear: "",
      notPublishedDates: [],
      yearPublications: [],
      filter: "",
      features: [],
      images: []
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
      },
      getPidForDate: state => date => {
         let yearPubs = state.yearPublications.find( yp => yp.year == state.currentYear)
         let pid = ""
         if (yearPubs) {
            let pub = yearPubs.dates.find( pub => pub.date == date)
            if (pub) {
               return pub.pid
            }
         }
         return pid
      },
   },

   mutations: {
      setLookingUp(state, flag) {
         state.lookingUp = flag
      },
      setCurrentYear(state, yyyy) {
         state.currentYear = yyyy
      },
      updateNotPublishedDates(state) {
         state.notPublishedDates.splice(0, state.notPublishedDates.length)
         let yearPubs = state.yearPublications.find( yp => yp.year == state.currentYear)
         if (yearPubs) {
            for (let month=1; month<=12; month++) {
               let monthStr = `${month}`
               monthStr = monthStr.padStart(2, "0")
               for (let day=1; day<=31; day++) {
                  let dayStr = `${day}`
                  dayStr = dayStr.padStart(2, "0")
                  let tgt = `${state.currentYear}-${monthStr}-${dayStr}`
                  let idx = yearPubs.dates.findIndex( mp => mp.date == tgt)
                  if (idx == -1) {
                     state.notPublishedDates.push(tgt)
                  }
               }
            }
         } else {
            // no data. disable all
            for (let month=1; month<=12; month++) {
               let monthStr = `${month}`
               monthStr = monthStr.padStart(2, "0")
               for (let day=1; day<=31; day++) {
                  let dayStr = `${day}`
                  dayStr = dayStr.padStart(2, "0")
                  let tgt = `${state.currentYear}-${monthStr}-${dayStr}`
                  state.notPublishedDates.push(tgt)
               }
            }
         }
      },
      clearCollectionDetails(state) {
         state.id = ""
         state.features.splice(0, state.features.length)
         state.images.splice(0, state.images.length)
         state.title = ""
         state.description  = ""
         state.itemLabel = "Issue"
         state.startDate = ""
         state.endDate = ""
         state.filter = ""
         state.selectedDate = ""
         state.currentMonth = ""
         state.currentYear = ""
      },
      setCollectionDetails(state, data) {
         state.id = data.id
         state.features.splice(0, state.features.length)
         data.features.forEach( f=> state.features.push(f) )
         state.images.splice(0, state.images.length)
         data.images.forEach( f=> state.images.push(f) )
         state.title  = data.title
         state.description  = data.description
         state.itemLabel = data.item_label
         state.startDate = data.start_date
         state.endDate = data.end_date
         state.filter = data.filter_name
      },
      setYearlyPublications(state, {year, dates}) {
         let newYear = {year: year, dates: dates}
         let idx = state.yearPublications.findIndex( yp => yp.year == year)
         if (idx > -1) {
            state.yearPublications.splice(idx,1)
         }
         state.yearPublications.push(newYear)
      },
      setSelectedDate(state, date) {
         state.selectedDate = date
         state.currentMonth = date.split("-")[1]
         state.currentYear = date.split("-")[0]
      }
   },
   actions: {
      async getCollectionContext(ctx, collection) {
         ctx.commit("setLookingUp", true)
         ctx.commit("clearCollectionDetails")

         let url = `${ctx.rootState.system.collectionsURL}/lookup?q=${collection}`
         return axios.get(url).then((response) => {
            ctx.commit("setCollectionDetails", response.data)
         }).finally( ()=> {
            ctx.commit("setLookingUp", false)
         })
      },
      async getPublishedDates(ctx, year) {
         let url = `${ctx.rootState.system.collectionsURL}/collections/${ctx.state.id}/dates?year=${year}`
         axios.get(url).then((response) => {
            ctx.commit("setYearlyPublications", {year: year, dates: response.data})
            ctx.commit("updateNotPublishedDates")
         })
      },
      async nextItem(ctx, currDate) {
         ctx.commit("setLookingUp", true)
         let url = `${ctx.rootState.system.collectionsURL}/collections/${ctx.state.id}/items/${currDate}/next`
         await axios.get(url).then((response) => {
            this.router.push(response.data)
         }).finally( ()=> {
            ctx.commit("setLookingUp", false)
         })
      },
      async priorItem(ctx, currDate) {
         ctx.commit("setLookingUp", true)
         let url = `${ctx.rootState.system.collectionsURL}/collections/${ctx.state.id}/items/${currDate}/previous`
         await axios.get(url).then((response) => {
            this.router.push(response.data)
         }).finally( ()=> {
            ctx.commit("setLookingUp", false)
         })
      },
      setYear(ctx, yyyy) {
         if ( ctx.currentYear == yyyy) {
            return
         }
         ctx.commit("setCurrentYear", yyyy)
         ctx.dispatch("getPublishedDates", yyyy)
      }
   }
}

export default collection