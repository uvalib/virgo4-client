import { getField, updateField } from 'vuex-map-fields'
import axios from 'axios'
import router from '../../router'

const query = {
   namespaced: true,
   state: {
      restoreMessage: "",
      mode: "basic",
      basic: "",
      basicSearchScope: { name: 'All Resource Types', id: 'all' },
      advanced: [
         { op: "AND", value: "", field: "keyword", type: "EQUAL", endVal: "" },
      ],
      browse: 
         { op: "AND", value: "", field: "", type: "EQUAL", endVal: "" },
      advancedFields: [
         { value: "keyword", label: "Keyword" },
         { value: "identifier", label: "Identifier" },
         { value: "title", label: "Title" },
         { value: "author", label: "Author" },
         { value: "subject", label: "Subject" },
         { value: "date", label: "Date" }
      ],
   },
   getters: {
      getField,
      idQuery: () => id => {
         return `identifier: {${id}}`
      },
      queryURLParams: (state, getters) => {
         let qs = `mode=${state.mode}`
         if ( state.mode == 'basic') {
            qs += `&scope=${state.basicSearchScope.id}`
         }
         qs += `&q=${getters.string}`

         return encodeURI(qs)
      },
      queryObject: state => {
         let out = { mode: state.mode }
         if (state.mode == "basic") {
            out.scope = state.basicSearchScope
            out.query = state.basic
         } else {
            out.query = state.advanced
         }
         return out
      },
      queryEntered: state => {
         if (state.mode == "basic") {
            return state.basic.length > 0
         }
         let found = false
         state.advanced.some(term => {
            found = term.value.length > 0
            return found == true
         })
         return found
      },
      string: state => {
         // convert into the standard v4 search string format. Ex:
         //     ( calico OR "tortoise shell" ) AND cats =>
         //     keyword: {(calico OR "tortoise shell") AND cats
         // Fields are joined together with AND or OR based on the fieldOp setting
         if (state.mode == "basic") {
            let qp = state.basic
            return `keyword: {${qp}}`
         }

         let terms = state.advanced
         if (state.mode == "browse") {
            terms = state.browse
         }

         let qs = ""
         terms.forEach(function (term) {
            if (term.value.length > 0) {
               if (qs.length > 0) {
                  // after the first term, use the search op to combine
                  qs += ` ${term.op} `
               }
               if (term.field == "date") {
                  // special handling for date as it can include a range and a type
                  if (term.type == "BETWEEN") {
                     qs += `date: {${term.value} TO ${term.endVal}}`
                  } else if (term.type == "EQUAL") {
                     qs += `date: {${term.value}}`
                  } else {
                     qs += `date: {${term.type} ${term.value}}`
                  }
               } else {
                  qs += `${term.field}: {${term.value}}`
               }
            }
         })
         return qs
      },
   },
   mutations: {
      updateField,
      setRestoreMessage(state, msg) {
         state.restoreMessage = msg
         setTimeout( ()=> {
            state.restoreMessage = ""
         }, 10000)
      },
      restoreQueryFromURL(state, queryParams) {
         while (queryParams.length > 0) {
            let braceIdx = queryParams.indexOf("{")
            if ( braceIdx == -1) {
               break
            }
            let keyOp = queryParams.substring(0, braceIdx).trim()
            let braceIdx2 = queryParams.indexOf("}")
            if ( braceIdx2 == -1) {
               break
            }
            let term = queryParams.substring(braceIdx+1, braceIdx2)
            queryParams = queryParams.substring(braceIdx2+1).trim()
            console.log("K: "+keyOp+" VAL: "+term)
            if ( state.mode == "basic") {
               state.basic = term
            }
         }
      },
      restoreSearch(state, data) {
         state.restoreMessage = ""
         state.mode = data.mode
         if (data.mode == "basic") {
            state.basicSearchScope = data.scope
            state.basic = data.query
         } else {
            state.advanced = data.query
         }
      },
      setBasicSearchScope(state, scope) {
         state.basicSearchScope = scope
      },
      setAdvancedSearch(state) {
         state.restoreMessage = ""
         state.mode = "advanced"
         let exist = state.advanced.findIndex(f => f.value == state.basic)
         if (exist == -1) {
            if (state.advanced.length == 1 && state.advanced[0].value == "") {
               state.advanced[0].value = state.basic
               state.advanced[0].field = "keyword"
            }
         }
      },
      advancedBarcodeSearch(state, barcode) {
         state.advanced.splice(0, state.advanced.length)
         state.advanced.push({ op: "AND", value: barcode, field: "identifier", type: "EQUAL", endVal: "" })
      },
      setBasicSearch(state) {
         state.mode = "basic"
         state.restoreMessage = ""
      },
      browseAuthors(state, author) {
         state.mode = "browse"
         state.browse = [
            { op: "AND", value: `${author}`, field: "author", type: "EQUAL", endVal: "" }]
      },
      browseSubjects(state, subject) {
         state.mode = "browse"
         state.browse = [
            { op: "AND", value: `"${subject}"`, field: "subject", type: "EQUAL", endVal: "" }]
      },
      addCriteria(state) {
         state.advanced.push({ op: "AND", value: "", field: "keyword", type: "EQUAL", endVal: "" })
      },
      removeCriteria(state, idx) {
         state.advanced.splice(idx, 1)
      },
      updateSearchMode(state) {
         if (state.mode == "browse") {
            if ( state.advanced[0].value != "") {
               state.mode = "advanced"
            } else {
               state.mode = "basic"  
            }  
            state.browse = [
               { op: "AND", value: "", field: "keyword", type: "EQUAL", endVal: "" }]
         }
      },
      clear(state) {
         state.restoreMessage = ""
         state.mode = "basic"
         state.basic = ""
         state.basicSearchScope = { name: 'All Resource Types', id: 'all' },
         state.advanced = [
            { op: "AND", value: "", field: "keyword", type: "EQUAL", endVal: "" }]
         state.browse = [
            { op: "AND", value: "", field: "keyword", type: "EQUAL", endVal: "" }]
      },
   },
   actions: {
      async loadSearch(ctx, token) {
         ctx.commit('setSearching', true, { root: true })
         try {
            // load the saved search info from backend
            let response = await axios.get(`/api/searches/${token}`)
            let saved = JSON.parse(response.data)

            ctx.commit('query/restoreSearch', saved, { root: true })
            await ctx.dispatch("searchAllPools", null, { root: true })
            ctx.commit('setSearching', true, { root: true })

            // Need the search results to get num pools and target pool
            let results = ctx.rootState.results
            saved.numPools = results.length
            saved.resultsIdx = results.findIndex( r=> r.pool.id == saved.pool)

            await ctx.dispatch("selectPoolResults", saved.resultsIdx, { root: true })
            ctx.commit('filters/restoreFilters', saved, { root: true }) 
            let checkFilter = ctx.rootGetters['filters/poolFilter'](saved.resultsIdx)
            if (checkFilter.length > 0) {
               await ctx.commit("clearSelectedPoolResults", null, {root: true})
               await ctx.dispatch("searchSelectedPool", null, {root: true})
            }
            ctx.commit('setSearching', false, { root: true })
         } catch (error)  {
            ctx.commit('setSearching', false, { root: true })
            router.push("/not_found")
         }
      },
   }
}

export default query
