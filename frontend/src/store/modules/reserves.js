import axios from 'axios'
import { getField, updateField } from 'vuex-map-fields'

const reserves = {
   namespaced: true,
   state: {
      query: "",
      searchType: "",
      courseReserves: [],
      noMatch: false
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
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
         axios.get(`/api/reserves/desks`).then((response) => {
            ctx.commit('setDesks', response.data)
            ctx.commit('setSearching', false, { root: true })
          }).catch((error) => {
            ctx.commit('system/setError', error, { root: true })
            ctx.commit('setSearching', false, { root: true })
          })
      },
      searchCourses(ctx) {
         ctx.commit('setSearching', true, { root: true })
         ctx.commit('setNoMatch',false)
         ctx.commit('setCourseSearch')
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
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
         axios.defaults.headers.common['Authorization'] = "Bearer "+ctx.state.authToken
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