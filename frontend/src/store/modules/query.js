import { getField, updateField } from 'vuex-map-fields'
import axios from 'axios'
import router from '../../router'

const query = {
   namespaced: true,
   state: {
      userSearched: false,
      mode: "basic",
      basic: "",
      srcTypeFilterName: "FilterFormat",
      allResourceTypes: {name: `All Resource Types`, id: 'all'},
      searchSources: "all",
      advanced: [
         { op: "AND", value: "", field: "keyword", comparison: "EQUAL", endVal: "" },
         { op: "AND", value: "", field: "title", comparison: "EQUAL", endVal: "" },
         { op: "AND", value: "", field: "author", comparison: "EQUAL", endVal: "" },
         { op: "AND", value: "", field: "subject", comparison: "EQUAL", endVal: "" },
         { op: "AND", value: "", field: "date", comparison: "BETWEEN", endVal: "" },
      ],
      advancedFields: [
         { value: "keyword", label: "Keyword", type: "text" },
         { value: "identifier", label: "Identifier", type: "text" },
         { value: "title", label: "Title", type: "text" },
         { value: "journal_title", label: "Journal Title", type: "text" },
         { value: "author", label: "Author", type: "text" },
         { value: "subject", label: "Subject", type: "text" },
         { value: "date", label: "Date", type: "date" },
         { value: "published", label: "Publisher/Place of Publication", type: "text"}
      ],
      preSearchFilters: [],
      loadingFilters: false,
      targetPool: ""
   },
   getters: {
      getField,
      getState: state => {
         return state
      },
      resourceTypes( state ) {
         let out = [state.allResourceTypes]
         if ( state.loadingFilters == false && state.preSearchFilters.length > 0) {
            let st = state.preSearchFilters.find( psf => psf.value == state.srcTypeFilterName)
            st.choices.forEach( c => {
               out.push({name: c.value, id: c.value})
            })
         }
         return out

      },
      basicSearchScope(state) {
         if ( state.loadingFilters == false && state.preSearchFilters.length > 0) {
            let st = state.preSearchFilters.find( psf => psf.value == state.srcTypeFilterName)
            let c = st.choices.find( c=> c.selected == true)
            if ( c) {
               return {name: c.value, id: c.value}
            }
         }
         return state.allResourceTypes
      },
      advancedSearchTemplate( state ) {
         let out = { fields: []}
         state.advanced.forEach(  af => {
            let tpl =  {op: af.op, field: af.field, comparison: af.comparison}
            out.fields.push( tpl )
         })
         // TODO handler presearch filters
         return out
      },
      idQuery: () => id => {
         return `identifier: {${id}}`
      },
      queryURLParams: (state, getters) => {
         let qs = `mode=${state.mode}`
         qs += `&q=${encodeURIComponent(getters.string)}`
         return qs
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
         if ( found ) {
            return true
         }
         state.preSearchFilters.some(pf => {
            pf.choices.some( c => {
               found = c.selected
               return found == true
            })
            return found == true
         })
         return found
      },
      string: state => {
         // convert into the standard v4 search string format. Ex:
         //     ( calico OR "tortoise shell" ) AND cats =>
         //     keyword: {(calico OR "tortoise shell") AND cats
         // Fields are joined together with AND or OR based on the fieldOp setting
         let qs = ""
         if (state.mode == "basic") {
            qs = `keyword: {${state.basic}}`
         }

         let terms = state.advanced
         terms.forEach(function (term) {
            if (term.value.length > 0) {
               if (qs.length > 0) {
                  // after the first term, use the search op to combine
                  qs += ` ${term.op} `
               }
               if (term.field == "date") {
                  // special handling for date as it can include a range and a type
                  if (term.comparison == "BETWEEN") {
                     qs += `date: {${term.value} TO ${term.endVal}}`
                  } else if (term.comparison == "EQUAL") {
                     qs += `date: {${term.value}}`
                  } else {
                     qs += `date: {${term.comparison} ${term.value}}`
                  }
               } else {
                  qs += `${term.field}: {${term.value}}`
               }
            }
         })

         let categories = []
         state.preSearchFilters.forEach( pf => {
            let vals = []
            let sel = pf.choices.filter( c => c.selected)
            sel.forEach( fv=>{
               vals.push(`${pf.value}:"${fv.value}"`)
            })
            if ( vals.length > 0) {
               categories.push( `(${vals.join(" OR ")})`)
            }
         })
         if ( categories.length > 0) {
            let fStr = `filter: {${categories.join(" AND ")}}`
            if ( qs.length > 0) {
               qs += ` AND ${fStr}`
            } else {
               qs = fStr
            }
         }

         return qs
      },
   },
   mutations: {
      updateField,
      setTemplate(state, template) {
         state.advanced.splice(0, state.advanced.length)
         template.fields.forEach( f => {
            let newField = { op: f.op, value: "", field: f.field, comparison: f.cpmparison, endVal: "" }
            if (f.value ) {
               newField.value = f.value
            }
            state.advanced.push(newField)
         })
      },
      setBasicSearchFilter(state, value) {
         let fIdx = state.preSearchFilters.findIndex( pf => pf.value == state.srcTypeFilterName)
         let typeFilter = state.preSearchFilters[fIdx]
         typeFilter.choices.forEach( c => {
            if ( value == state.allResourceTypes.name) {
               c.selected = false
            } else {
               if (c.value == value) {
                  c.selected = true
               } else {
                  c.selected = false
               }
            }
         })
         state.preSearchFilters.splice(fIdx, 1, typeFilter)
      },
      toggleFilter( state, data ) {
         let fIdx = state.preSearchFilters.findIndex( pf => pf.value == data.filterID)
         let f = state.preSearchFilters[fIdx]
         let v = f.choices.find( c=> c.value == data.value)
         v.selected = !v.selected
         state.preSearchFilters.splice(fIdx, 1, f)
      },
      setAdvancedFilterFields( state, filters) {
         // preserve any previously selected filters before clear....
         let oldFilterSelects = []
         state.preSearchFilters.forEach( pf => {
            pf.choices.forEach( pfc => {
               if (pfc.selected) {
                  oldFilterSelects.push(pfc)
               }
            })
         })
         state.preSearchFilters.splice(0, state.preSearchFilters.length)
         filters.forEach( f=> {
            // If the filter already exists in the fields list, remove it and replace with new
            let idx = state.preSearchFilters.findIndex( f=> f.value == f.id)
            if ( idx != -1 ) {
               state.preSearchFilters.splice(idx, 1)
            }
            if ( f.values.length == 0 ) {
               return
            }
            let field = {value: f.id, label: f.label, choices: []}
            f.values.forEach( v => {
               let selected = false
               if (oldFilterSelects.some( s => s.value === v.value)) {
                  selected = true
               }
               field.choices.push({value: v.value, count: v.count, selected: selected})
            })
            state.preSearchFilters.push(field)
         })
      },

      restoreFromURL(state, queryParams) {
         // Clear out all existing data
         state.basic = ""
         state.advanced.splice(0, state.advanced.length)
         state.preSearchFilters.forEach( pf => {
            let sel = pf.choices.filter( c => c.selected)
            sel.forEach( fv=>{
               fv.selected = false
            })
         })

         while (queryParams.length > 0) {
            // A valid query has a field and term surrounded by { }. Find the braces...
            let braceIdx = queryParams.indexOf("{")
            if ( braceIdx == -1) {
               break
            }
            let braceIdx2 = queryParams.indexOf("}")
            if ( braceIdx2 == -1) {
               break
            }

            // Content before the { is the keword and possibly boolean op
            // Regardless, this part ends in : plus 1 or more spaces which are not needed. Remove.
            // Example:
            //   title: {pirate} AND filter:{FilterCollection:"Avalon"}
            let keyOp = queryParams.substring(0, braceIdx).trim()   // get all up to colon
            keyOp = keyOp.substring(0, keyOp.length - 1)            // remove colon

            // the query term is the data between the { and }. Grab it
            // and remove this whole term from the query string
            let value = queryParams.substring(braceIdx+1, braceIdx2)
            queryParams = queryParams.substring(braceIdx2+1).trim()
            let keyOpParts = keyOp.split(" ")

            // Pre-search Filters are special. DO NOT add them to the advanced terms. Instead,
            // parse them out and add them to the preSearchFilters data. IMPORTANT: Value can look like this:
            //     (FilterLibrary:"Brown Science and Engineering") AND (FilterFormat:"Atlas" OR FilterFormat:"Book")
            if (keyOp.split(" ").pop() == "filter")  {
               // toss all of the operators and parens to get a list of FILTER:VALUE separated by |
               let values = value.replace(/\sAND\s|\sOR\s/g, "|").replace(/\(|\)/g, "").split("|")
               values.forEach( v => {
                  let filter = v.split(":")[0].replace(/\(/g, "").trim()
                  let filterVal = v.split(":").pop().replace(/\)|"/g, "").trim()
                  let f = state.preSearchFilters.find( pf => pf.value == filter)
                  if (f) {
                     let fv = f.choices.find( fv => fv.value == filterVal)
                     if ( fv) {
                        fv.selected = true
                     }
                  } else {
                     let field = {value: filter, label: filter, choices: [{value: filterVal, count: 0, selected: true}]}
                     state.preSearchFilters.push(field)
                  }
               })
               continue
            }

            let term = { op: "AND", value: value, field: keyOp.toLowerCase(), comparison: "EQUAL", endVal: "" }
            if (keyOpParts.length == 2 ) {
               term.op = keyOpParts[0].trim()
               term.field = keyOpParts[1].trim().toLowerCase()
            } else if (keyOpParts.length > 2) {
               continue
            }

            if (state.mode == "basic") {
               // basic only supports keyword
               if ( term.field == "keyword" ) {
                  state.basic = value
               }
               continue
            }

            if ( term.field == "date" ) {
               // date values have 4 formats: {1988} {AFTER 1988} {BEFORE 1988} {1970 TO 2000}
               if ( value.includes("AFTER") || value.includes("after")  ) {
                  term.comparison = "AFTER"
                  term.value = value.replace(/AFTER/gi, "").trim()
               } else if ( value.includes("BEFORE") || value.includes("before")  ) {
                  term.comparison = "BEFORE"
                  term.value = value.replace(/BEFORE/gi, "").trim()
               } else if ( value.includes("TO") ) {
                  term.comparison = "BETWEEN"
                  term.value = value.split("TO")[0].trim()
                  term.endVal = value.split("TO")[1].trim()
               }
            }
            state.advanced.push(term)
         }
      },

      setAdvancedSearch(state) {
         state.mode = "advanced"
      },
      setTargetPool(state, pool) {
         state.targetPool = pool
      },
      advancedBarcodeSearch(state, barcode) {
         state.advanced.splice(0, state.advanced.length)
         state.advanced.push({ op: "AND", value: barcode, field: "identifier", comparison: "EQUAL", endVal: "" })
      },
      setBasicSearch(state) {
         state.mode = "basic"
      },
      addCriteria(state) {
         state.advanced.push({ op: "AND", value: "", field: "keyword", comparison: "EQUAL", endVal: "" })
      },
      removeCriteria(state, idx) {
         state.advanced.splice(idx, 1)
      },

      resetAdvanced( state ) {
         state.advanced.splice(0, state.advanced.length)
         state.advanced.push( {op: "AND", value: "", field: "keyword", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "title", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "author", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "subject", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "date", comparison: "BETWEEN", endVal: "" } )
         state.preSearchFilters.forEach( pf => {
            let sel = pf.choices.filter( c => c.selected)
            sel.forEach( fv=>{
               fv.selected = false
            })
         })
      },
      clear(state) {
         state.mode = "basic"
         state.basic = ""
         state.advanced.splice(0, state.advanced.length)
         state.advanced.push( {op: "AND", value: "", field: "keyword", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "title", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "author", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "subject", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "date", comparison: "BETWEEN", endVal: "" } )
         state.targetPool = ""
         state.preSearchFilters.forEach( pf => {
            let sel = pf.choices.filter( c => c.selected)
            sel.forEach( fv=>{
               fv.selected = false
            })
         })
      },
      setLoadingFilters(state, flag) {
         state.loadingFilters = flag
      },
   },
   actions: {
      async getAdvancedSearchFilters(ctx) {
         ctx.commit("setLoadingFilters",true)
         let url = `${ctx.rootState.system.searchAPI}/api/filters`
         return axios.get(url).then((response) => {
            ctx.commit('setAdvancedFilterFields', response.data)
            ctx.commit("setLoadingFilters",false)
         }).catch((error) => {
            console.warn("Unable to get advanced search filters: "+JSON.stringify(error))
            ctx.commit("setLoadingFilters",false)
         })
      },
      async loadSearch(ctx, token) {
         ctx.commit('setSearching', true, { root: true })
         await axios.get(`/api/searches/${token}`).then((response) => {
            // See if the filter part is old...
            let searchURL = response.data.url
            let params = new URLSearchParams(response.data.url.split("?")[1])
            let rawFilter = params.get("filter")
            if ( rawFilter && rawFilter != "") {
               if ( rawFilter[0] != "{") {
                  // really old format; just drop the filter
                  params.delete("filter")
                  searchURL = "/search?"+params.toString()
               }
            }
            router.replace(searchURL)
         }).catch((error) => {
            console.error(error)
            ctx.commit('setSearching', false, { root: true })
            router.push("/not_found")
         })
      }
   }
}

export default query
