import axios from 'axios'
import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"

export const useCollectionStore = defineStore('collection', {
	state: () => ({
      systemStore: useSystemStore(),
      lookingUp: false,
      collections: [],
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
      image: null,
   }),

   getters: {
      isAvailable: state => {
         return (state.id != "" && state.lookingUp == false)
      },
      canSearch: state => {
         return state.features.findIndex( f => f.name == "search_within") > -1
      },
      hasCalendar: state => {
         return state.features.findIndex( f => f.name == "calendar_navigation") > -1
      },
      isFullPage: state => {
         return state.features.findIndex( f => f.name == "full_page_view") > -1
      },
      isBookplate: state => {
         return state.features.findIndex( f => f.name == "bookplate") > -1
      },
      canNavigate: state => {
         return state.features.findIndex( f => f.name == "sequential_navigation") > -1
      },
      getPidForDate: state => {
         return (date) => {
            let yearPubs = state.yearPublications.find( yp => yp.year == state.currentYear)
            let pid = ""
            if (yearPubs) {
               let pub = yearPubs.dates.find( pub => pub.date == date)
               if (pub) {
                  return pub.pid
               }
            }
            return pid
         }
      },
   },

   actions: {
      updateNotPublishedDates() {
         this.notPublishedDates.splice(0, this.notPublishedDates.length)
         let yearPubs = this.yearPublications.find( yp => yp.year == this.currentYear)
         if (yearPubs) {
            for (let month=1; month<=12; month++) {
               let monthStr = `${month}`
               monthStr = monthStr.padStart(2, "0")
               for (let day=1; day<=31; day++) {
                  let dayStr = `${day}`
                  dayStr = dayStr.padStart(2, "0")
                  let tgt = `${this.currentYear}-${monthStr}-${dayStr}`
                  let idx = yearPubs.dates.findIndex( mp => mp.date == tgt)
                  if (idx == -1) {
                     this.notPublishedDates.push(tgt)
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
                  let tgt = `${this.currentYear}-${monthStr}-${dayStr}`
                  this.notPublishedDates.push(tgt)
               }
            }
         }
      },
      clearCollectionDetails() {
         this.id = ""
         this.features.splice(0, this.features.length)
         this.image = null
         this.title = ""
         this.description  = ""
         this.itemLabel = "Issue"
         this.startDate = ""
         this.endDate = ""
         this.filter = ""
         this.selectedDate = ""
         this.currentMonth = ""
         this.currentYear = ""
      },
      setCollectionDetails(data) {
         this.id = data.id
         this.features.splice(0, this.features.length)
         data.features.forEach( f=> this.features.push(f) )
         this.image = null
         if (data.image) {
            this.image = data.image
         }
         this.title  = data.title
         this.description  = data.description
         this.itemLabel = data.item_label
         this.startDate = data.start_date
         this.endDate = data.end_date
         this.filter = data.filter_name
      },
      setYearlyPublications({year, dates}) {
         let newYear = {year: year, dates: dates}
         let idx = this.yearPublications.findIndex( yp => yp.year == year)
         if (idx > -1) {
            this.yearPublications.splice(idx,1)
         }
         this.yearPublications.push(newYear)
      },
      setSelectedDate(date) {
         this.selectedDate = date
         this.currentMonth = date.split("-")[1]
         this.currentYear = date.split("-")[0]
      },

      async getCollections() {
         let url = `${this.systemStore.collectionsURL}/api/collections`
         return axios.get(url).then((response) => {
            this.collections = response.data
         })
      },
      async getCollectionContext(collection) {
         this.lookingUp = true
         this.clearCollectionDetails()

         let url = `${this.systemStore.collectionsURL}/api/lookup?q=${collection}`
         return axios.get(url).then((response) => {
            this.setCollectionDetails(response.data)
            if (this.startDate != "" &&this.currentYear == "" ) {
               this.setYear(this.startDate.split("-")[0])
            }
         }).catch((_error) => {
            console.log(collection+" not available")
         }).finally( ()=> {
            this.lookingUp = false
         })
      },
      async getPublishedDates(year) {
         let url = `${this.systemStore.collectionsURL}/api/collections/${this.id}/dates?year=${year}`
         return axios.get(url).then((response) => {
            this.setYearlyPublications({year: year, dates: response.data})
            this.updateNotPublishedDates()
         })
      },
      async nextItem(currDate) {
         this.lookingUp = true
         let url = `${this.systemStore.collectionsURL}/api/collections/${this.id}/items/${currDate}/next`
         await axios.get(url).then((response) => {
            this.router.push(response.data)
         }).finally( ()=> {
            this.lookingUp = false
         })
      },
      async priorItem(currDate) {
         this.lookingUp = true
         let url = `${this.systemStorecollectionsURL}/api/collections/${this.id}/items/${currDate}/previous`
         await axios.get(url).then((response) => {
            this.router.push(response.data)
         }).finally( ()=> {
            this.lookingUp = false
         })
      },
      setYear(yyyy) {
         if ( this.currentYear == yyyy) {
            return
         }
         this.currentYear = yyyy
         return this.getPublishedDates(yyyy)
      }
   }
})