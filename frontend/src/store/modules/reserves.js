import axios from 'axios'
import { getField, updateField } from 'vuex-map-fields'
import router from '../../router'

const reserves = {
   namespaced: true,
   state: {
      query: "",
      searchType: "",
      courseReserves: [],
      noMatch: false,
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
         period: ""
      }
   },

   getters: {
      getField,
      hasCourseResults: state => {
         return state.searchType == "course" && state.courseReserves.length > 0
      },
      hasInstructorResults: state => {
         return state.searchType == "instructor" && state.courseReserves.length > 0
      },
   },

   mutations: {
      updateField,
      updateReservedItemsPeriod(state) {
         state.requestList.forEach(item => {
            item.period = state.request.period
         })
      },
      setRequestList(state, list) {
         state.requestList = list.slice(0)
         state.requestList.forEach(item => {
            item.period = ""
            item.notes = ""  
         });
         state.request = {onBehalfOf: "no",
            instructorName: "",
            instructorEmail: "",
            name: "",
            email: "",
            course: "",
            semester: "",
            library: "",
            period: ""
         }
      },
      clearRequestList(state) {
         state.requestList = []
         state.request = {onBehalfOf: "no",
            instructorName: "",
            instructorEmail: "",
            name: "",
            email: "",
            course: "",
            semester: "",
            library: "",
            period: ""
         }
      },
      setInstructorSearch(state) {
         state.searchType="instructor"
      },
      setCourseSearch(state) {
         state.searchType="course"
      },
      setCourseReserves(state, data) {
         state.courseReserves=data
      },
      setNoMatch(state,flag) {
         state.noMatch = flag
      }
   }, 

   actions: {
      createReserves(ctx) {
         ctx.commit('setSearching', true, { root: true })
         let v4UserID = ctx.rootState.user.signedInUser
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.rootState.user.authToken
         let data = {userID: v4UserID, request: ctx.state.request, items: []}
         ctx.state.requestList.forEach( item=>{
            let notes = item.notes
            if (notes.length == 0) notes = "-"
            data.items.push( {catalogKey: item.identifier, 
               pool: item.pool,
               title: item.details.title,
               callNumber: item.details.callNumber,
               author: item.details.author,
               location: item.details.location,
               library: item.details.library,
               availability: item.details.availability,
               notes: notes, 
               period: item.period} )    
         })
         axios.post(`/api/reserves`, data).then((_response) => {
            ctx.commit('clearRequestList')
            ctx.commit('setSearching', false, { root: true })
            router.push("/reserved")
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setSearching', false, { root: true })
          })
      },
      searchCourses(ctx, type) {
         ctx.commit('setSearching', true, { root: true })
         ctx.commit('setNoMatch',false)
         ctx.commit('setCourseSearch')
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.rootState.user.authToken
         let typeParam = "type=COURSE_NAME"
         if (type == "id") {
            typeParam = "type=COURSE_ID"
         }
         let qs = ctx.state.query
         if (qs.includes(" ")) {
            qs = `"${qs}"`
         }
         axios.get(`/api/reserves/search?${typeParam}&query=${qs}`).then((response) => {
            ctx.commit('setCourseReserves', response.data)
            ctx.commit('setSearching', false, { root: true })
         }).catch((_error) => {
            ctx.commit('setCourseReserves', [])
            ctx.commit('setNoMatch',true)
            ctx.commit('setSearching', false, { root: true })
          })
      },
      searchInstructors(ctx, type) {
         ctx.commit('setSearching', true, { root: true })
         ctx.commit('setNoMatch',false)
         ctx.commit('setInstructorSearch')
         let typeParam = "type=INSTRUCTOR_NAME"
         let qs = ctx.state.query
         if (type == "id") {
            typeParam = "type=INSTRUCTOR_ID"
            qs = ctx.rootState.user.accountInfo.id
         } else {
            if (qs.includes(" ")) {
               qs = `"${qs}"`
            }
         }
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.rootState.user.authToken
         axios.get(`/api/reserves/search?${typeParam}&query=${qs}`).then((response) => {
            ctx.commit('setCourseReserves', response.data)
            ctx.commit('setSearching', false, { root: true })
         }).catch((_error) => {
            ctx.commit('setCourseReserves', [])
            ctx.commit('setNoMatch',true)
            ctx.commit('setSearching', false, { root: true })
          })
      }
   }
}

export default reserves