import axios from 'axios'
import { getField, updateField } from 'vuex-map-fields'

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
      getDesks(ctx) {
         ctx.commit('setSearching', true, { root: true })
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.rootState.user.authToken
         axios.get(`/api/reserves/desks`).then((response) => {
            ctx.commit('setDesks', response.data)
            ctx.commit('setSearching', false, { root: true })
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setSearching', false, { root: true })
          })
      },
      createReserves(ctx) {
         ctx.commit('setSearching', true, { root: true })
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.rootState.user.authToken
         let data = {request: ctx.state.request, items: []}
         ctx.state.requestList.forEach( item=>{
            data.items.push( {catalogKey: item.identifier, 
               title: item.details.title,
               author: item.details.author,
               notes: item.notes, 
               period: item.period} )    
         })
         axios.post(`/api/reserves`, data).then((_response) => {
            ctx.commit('clearRequestList')
            ctx.commit('setSearching', false, { root: true })
            // TODO redirect to finished page
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setSearching', false, { root: true })
          })
      },
      searchCourses(ctx) {
         ctx.commit('setSearching', true, { root: true })
         ctx.commit('setNoMatch',false)
         ctx.commit('setCourseSearch')
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.rootState.user.authToken
         axios.get(`/api/reserves/search?type=COURSE_NAME&query=${ctx.state.query}`).then((response) => {
            ctx.commit('setCourseReserves', response.data)
            ctx.commit('setSearching', false, { root: true })
         }).catch((_error) => {
            ctx.commit('setCourseReserves', [])
            ctx.commit('setNoMatch',true)
            ctx.commit('setSearching', false, { root: true })
          })
      },
      searchInstructors(ctx) {
         ctx.commit('setSearching', true, { root: true })
         ctx.commit('setNoMatch',false)
         ctx.commit('setInstructorSearch')
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.rootState.user.authToken
         axios.get(`/api/reserves/search?type=INSTRUCTOR_NAME&query=${ctx.state.query}`).then((response) => {
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