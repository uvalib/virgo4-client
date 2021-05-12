import axios from 'axios'
import router from '../../router'

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
      selectedDate: "",
      currentMonth: "",
      currentYear: "",
      yearPublications: [],
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
      notPublishedDays: state => {
         let yearPubs = state.yearPublications.find( yp => yp.year == state.currentYear)
         let out = []
         if (yearPubs) {
            // get only dates for the current year/month
            let monthPubs = yearPubs.dates.filter( pub => pub.date.includes(`${state.currentYear}-${state.currentMonth}`))
            for (let day=1; day<=31; day++) {
               let idx = monthPubs.findIndex( mp => parseInt(mp.date.split("-")[2],10) == day)
               if (idx == -1) {
                  out.push(day)
               }
            }
         } else {
            // no data. disable all
            for (let day=1; day<=31; day++) {
               out.push(day)
            }
         }
         return out
      }
   },

   mutations: {
      setLookingUp(state, flag) {
         state.lookingUp = flag
      },
      setCurrentMonth(state, mm) {
         state.currentMonth = mm
      },
      setCurrentYear(state, yyyy) {
         state.currentYear = yyyy
      },
      clearCollectionDetails(state) {
         state.id = ""
         state.features.splice(0, state.features.length)
         state.description  = ""
         state.itemLabel = "Issue"
         state.startDate = ""
         state.endDate = ""
         state.filter = {name: "", value: ""}
         state.selectedDate = ""
         state.currentMonth = ""
         state.currentYear = ""
      },
      setCollectionDetails(state, data) {
         state.id = data.id
         state.features.splice(0, state.features.length)
         data.features.forEach( f=> state.features.push(f) )
         state.description  = data.description
         state.itemLabel = data.items_label
         state.startDate = data.start_date
         state.endDate = data.end_date
         state.filter = {name: data.filter, value: data.filter_value}
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
      async getCollectionContext(ctx, {collection, date}) {
         ctx.commit("setLookingUp", true)
         ctx.commit("clearCollectionDetails")

         let url = `${ctx.rootState.system.collectionsURL}/collections/${collection}`
         await axios.get(url).then((response) => {
            ctx.commit("setCollectionDetails", response.data)
            let year = date.split("-")[0]
            ctx.dispatch("getPublishedDates", year)
            ctx.commit("setSelectedDate", date)
         }).finally( ()=> {
            ctx.commit("setLookingUp", false)
         })
      },
      async getPublishedDates(ctx, year) {
         let cname = ctx.state.filter.value
         let url = `${ctx.rootState.system.collectionsURL}/collections/${cname}/dates?year=${year}`
         axios.get(url).then((response) => {
            ctx.commit("setYearlyPublications", {year: year, dates: response.data})
         })
      },
      async nextItem(ctx, currDate) {
         ctx.commit("setLookingUp", true)
         let cname = ctx.state.filter.value
         let url = `${ctx.rootState.system.collectionsURL}/collections/${cname}/items/${currDate}/next`
         await axios.get(url).then((response) => {
            let newURL = `/sources/uva_library/items/${response.data}`
            router.push(newURL)
         }).finally( ()=> {
            ctx.commit("setLookingUp", false)
         })
      },
      async priorItem(ctx, currDate) {
         ctx.commit("setLookingUp", true)
         let cname = ctx.state.filter.value
         let url = `${ctx.rootState.system.collectionsURL}/collections/${cname}/items/${currDate}/previous`
         await axios.get(url).then((response) => {
            let newURL = `/sources/uva_library/items/${response.data}`
            router.push(newURL)
         }).finally( ()=> {
            ctx.commit("setLookingUp", false)
         })
      },
      setMonth(ctx, mm) {
         ctx.commit("setCurrentMonth", mm)
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