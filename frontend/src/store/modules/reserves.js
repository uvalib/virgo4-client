import axios from 'axios'
import { getField, updateField } from 'vuex-map-fields'
import router from '../../router'

const reserves = {
   namespaced: true,
   state: {
      query: "",
      searchType: "",
      totalReserves: -1,
      hasMore: false,
      page: 1,
      courseReserves: [],
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
         return state.searchType.includes("COURSE") && state.courseReserves.length > 0
      },
      hasInstructorResults: state => {
         return state.searchType.includes("INSTRUCTOR") && state.courseReserves.length > 0
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
      setCourseReserves(state, data) {
         data['hits'].forEach( h=>{
            state.courseReserves.push(h)
         })
         state.totalReserves = data['total']
         state.page = data['page']
         state.hasMore = data['more']
      },
      resetResults(state, type) {
         state.searchType = type
         state.courseReserves.splice(0, state.courseReserves.length)
         state.totalReserves = 0
         state.page = 1
         state.hasMore = false
      },
      nextPage(state) {
         if ( state.hasMore) {
            state.page += 1
         }
      }
   }, 

   actions: {
      createReserves(ctx) {
         ctx.commit('setSearching', true, { root: true })
         let v4UserID = ctx.rootState.user.signedInUser
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
      nextPage(ctx) {
         if (ctx.state.hasMore == false ) {
            return
         }
         ctx.commit('nextPage')
         let qs = ctx.state.query
         if (qs.includes(" ")) {
            qs = `"${qs}"`
         }
         let typeParam = "type="+ctx.state.searchType
         let pg = ctx.state.page
         return axios.get(`/api/reserves/search?${typeParam}&query=${qs}&page=${pg}`).then((response) => {
            ctx.commit('setCourseReserves', response.data)
         }).catch((error) => {
            ctx.commit('setError', error, { root: true })
          })
      },
      searchCourses(ctx, data) {
         ctx.commit('setSearching', true, { root: true })
         let type = "COURSE_NAME"
         if (data.type == "id") {
            type = "COURSE_ID"
         }
         let qs = ctx.state.query
         if (qs.includes(" ")) {
            qs = `"${qs}"`
         }

         if (data.initial === true) {
            ctx.commit('resetResults', type)   
         }
         let typeParam = "type="+type
         let pgParam = "page="+ctx.state.page
         let url = `/api/reserves/search?${typeParam}&query=${qs}&${pgParam}`
         axios.get(url).then((response) => {
            ctx.commit('setCourseReserves', response.data)
            ctx.commit('setSearching', false, { root: true })
         }).catch((_error) => {
            ctx.commit('setCourseReserves', [])
            ctx.commit('setNoMatch',true)
            ctx.commit('setSearching', false, { root: true })
         })
      },
      searchInstructors(ctx, data) {
         ctx.commit('setSearching', true, { root: true })
         let type = "INSTRUCTOR_NAME"
         if (data.type == "id") {
            type = "INSTRUCTOR_ID"
            qs = ctx.rootState.user.accountInfo.id
         } 
         let qs = ctx.state.query
         if (qs.includes(" ")) {
            qs = `"${qs}"`
         }

         if (data.initial === true) {
            ctx.commit('resetResults', type)   
         }
         let typeParam = "type="+type
         let pgParam = "page="+ctx.state.page
         let url = `/api/reserves/search?${typeParam}&query=${qs}&${pgParam}`
         axios.get(url).then((response) => {
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
