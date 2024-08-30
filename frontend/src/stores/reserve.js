import axios from 'axios'
import { defineStore } from 'pinia'
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import { useRequestStore } from "@/stores/request"

export const useReserveStore = defineStore('reserve', {
	state: () => ({
      working: false,
      query: "",
      searchType: "",
      targetInstructor: "",
      courseReserves: [],
      searchSuccess: false,
      requestList: [],
      request: {
         onBehalfOf: "no",
         instructorName: "",
         instructorEmail: "",
         name: "",
         email: "",
         course: "",
         semester: "",
         library: "",
         period: "",
         lms: "",
         otherLMS: "",
      },
      submitted: false
   }),

   getters: {
      invalidReserves: state => {
         return state.requestList.filter( r => r.valid == false)
      },
      hasCourseResults: state => {
         return state.searchType.includes("course") && state.courseReserves.length > 0
      },
      hasInstructorResults: state => {
         return state.searchType.includes("instructor") && state.courseReserves.length > 0
      },
   },

   actions: {
      markInvalidReserveItem(idx) {
         if (idx <0 || idx >= this.requestList.length) return
         this.requestList[idx].valid = false
      },
      updateReserveVideoFlag( {idx, flag} ) {
         if (idx <0 || idx >= this.requestList.length) return
         this.requestList[idx].video = flag
      },
      updateReservedItemsPeriod() {
         this.requestList.forEach(item => {
            item.period = this.request.period
         })
      },
      setRequestingUser(userInfo) {
         this.request.name = userInfo.displayName
         this.request.email = userInfo.email
      },
      setRequestList(list) {
         this.submitted = false
         this.requestList = list.slice(0)
         this.requestList.forEach(item => {
            item.period = ""
            item.notes = ""
            item.audioLanguage = "English"
            item.subtitles= "no"
            item.subtitleLanguage = ""
            item.valid = true
         });
         this.request = {onBehalfOf: "no",
            instructorName: "",
            instructorEmail: "",
            name: "",
            email: "",
            course: "",
            semester: "",
            library: "",
            period: "",
            lms: "",
            otherLMS: ""
         }
      },
      clearRequestList() {
         this.requestList = []
         this.request = {onBehalfOf: "no",
            instructorName: "",
            instructorEmail: "",
            name: "",
            email: "",
            course: "",
            semester: "",
            library: "",
            period: "",
            lms: "",
            otherLMS: ""
         }
      },
      setTargetInstructor(inst) {
         this.targetInstructor = ""
         if (inst) {
            this.targetInstructor = inst
         }
      },
      setCourseReserves(data) {
         data.forEach( h=>{
            if (this.targetInstructor && this.searchType == "course_id") {
                  h.instructors = h.instructors.filter( i => i.instructorName.toLowerCase().indexOf(this.targetInstructor.toLowerCase()) == 0 )
            }
            this.courseReserves.push(h)
         })
         this.searchSuccess = true
      },
      resetResults(type) {
         this.searchSuccess = false
         this.searchType = type
         this.courseReserves.splice(0, this.courseReserves.length)
      },

      async validateReservesRequest() {
         // Generate a list if item IDs to be validated for course reserve by ILS connector
         let itemIds = []
         this.requestList.forEach( item => {
            itemIds.push(item.identifier)
         })

         const system = useSystemStore()
         this.working = true
         return axios.post(`${system.availabilityURL}/reserves/validate`, {items: itemIds}).then( response => {
            response.data.forEach( async (item, idx) => {
               // for now, only video items can be put on course reserve
               if (item.reserve == false || item.is_video == false ) {
                  this.markInvalidReserveItem(idx)
               } else {
                  this.updateReserveVideoFlag({idx: idx, flag: item.is_video})
               }
            })

            this.working = false
         }).catch((error) => {
            system.setError(error)
            this.working = false
         })

      },

      createReserves() {
         const userStore = useUserStore()
         this.working = true
         let v4UserID = userStore.signedInUser
         let data = {userID: v4UserID, request: this.request, items: []}
         this.requestList.forEach( item=>{
            let notes = item.notes
            if (notes.length == 0) notes = "-"
            let subItem = {catalogKey: item.identifier,
               pool: item.pool,
               title: item.details.title,
               author: item.details.author,
               location: item.details.location,
               library: item.details.library,
               availability: item.details.availability,
               notes: notes,
               period: item.period,
               isVideo: item.video,
               audioLanguage: item.audioLanguage,
               subtitles: item.subtitles,
               subtitleLanguage: item.subtitleLanguage
            }
            if (Array.isArray(item.details.callNumber)) {
               subItem.callNumber = item.details.callNumber
            } else {
               subItem.callNumber = [item.details.callNumber]
            }
            data.items.push( subItem )
         })

         const system = useSystemStore()
         axios.post(`${system.availabilityURL}/reserves`, data).then((_response) => {
            this.clearRequestList()
            this.submitted = true
            this.working = false
         }).catch((error) => {
            system.setError(error)
            this.working = false
         })
      },

      createVideoReserve(video){
         const requestStore = useRequestStore()
         const userStore = useUserStore()
         const system = useSystemStore()

         let v4UserID = userStore.signedInUser
         let data = { userID: v4UserID, request: this.request, items: [video] }

         axios.post(`${system.availabilityURL}/reserves`, data).then((_response) => {
            requestStore.buttonDisabled = true
            this.clearRequestList()
            this.submitted = true
            requestStore.activeRequest = "ReservedPanel"
            requestStore.buttonDisabled = false
         }).catch((error) => {
            system.setError(error)
            requestStore.buttonDisabled = false
         })
      },

      searchCourseReserves( data) {
         this.query = data.query
         let qs = data.query
         this.working = true
         this.setTargetInstructor(data.instructor)

         const system = useSystemStore()
         this.resetResults(data.type)
         let typeParam = "type="+data.type
         let url = `${system.availabilityURL}/reserves/search?${typeParam}&query=${qs}`
         axios.get(url).then((response) => {
            this.setCourseReserves(response.data)
            this.working = false
         }).catch((error) => {
            system.setError(error)
            this.working = false
         })
      },
   }
})
