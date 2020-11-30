import { getField, updateField } from 'vuex-map-fields'
import axios from 'axios'
import router from '../../router'

const query = {
   namespaced: true,
   state: {
      userSearched: false,
      mode: "basic",
      basic: "",
      basicSearchScope: { name: 'All', id: 'all' },
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
      excludedPools: [],
      targetPool: ""
   },
   getters: {
      getField,
      getState: state => {
         return state
      },
      advancedSearchTemplate( state ) {
         let ep = [...new Set(state.excludedPools)]
         let out = { excluded: ep, fields: []}
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
         if ( state.mode == 'basic') {
            qs += `&scope=${state.basicSearchScope.id}`
         }
         qs += `&q=${encodeURIComponent(getters.string)}`
         if ( state.excludedPools.length > 0) {
            let ep = [...new Set(state.excludedPools)]
            qs += `&exclude=${ep.join(",")}`
         }
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
         if (state.mode == "basic") {
            let qp = state.basic
            let hasFields = false
            state.advancedFields.some(f => {
               let k = f.value+":"
               if ( qp.includes(k) ) {
                  hasFields = true
               }
               return hasFields == true
            })
            if (hasFields) {
               return qp
            }
            return `keyword: {${qp}}`
         }

         let terms = state.advanced
         let qs = ""
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
      isPoolExcluded: state => pool => {
         let excluded = false
         state.excludedPools.some( pid => {
            if (pid == pool.id) {
               excluded = true
            }
            return excluded == true
         })

         return excluded
      },
   },
   mutations: {
      updateField,
      restoreTemplate(state, template) {
         template.excluded.forEach( e => {
            if ( !state.excludedPools.includes(e) ) {
               state.excludedPools.push( e )
            }
         })

         state.advanced.splice(0, state.advanced.length)
         template.fields.forEach( f => {
            let newField = { op: f.op, value: "", field: f.field, comparison: f.cpmparison, endVal: "" }
            if (f.value ) {
               newField.value = f.value
            }
            state.advanced.push(newField)
         })
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
         if ( state.mode == "basic") {
            // a basic search generally looks like this: q=keyword: {pirate}
            // but it can include fields like advanced. Ex: title: {test}. See if it does...
            let adv = false
            state.advancedFields.some(f => {
               let k = f.value+":"
               if ( queryParams.includes(k) && f.value != "keyword") {
                  adv = true
               }
               return adv == true
            })
            var count = (queryParams.match(/keyword:/gi) || []).length
            if (count == 1 && adv == false) {
               // this is really just a basic keyword search, strip out URL params and set just query string
               // NOTE: this is just so the basic search input box looks nice; not like keyword: {pirate}
               state.basic = queryParams.replace(/^.*{/g, "").replace(/}/g, "")
            } else {
               // This has multiple keywords or advanced fields. Just put the full string in the box
               state.basic = queryParams
            }
            return
         }

         // Clear out all existing data
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
            if (keyOpParts.pop() == "filter")  {
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
      setBasicSearchScope(state, scope) {
         state.basicSearchScope = scope
      },
      setAdvancedSearch(state) {
         state.mode = "advanced"
      },
      setExcludePreferences(state, excludePrefs) {
         state.excludedPools.splice(0, state.excludedPools.length)
         excludePrefs.forEach( pid => {
            state.excludedPools.push(pid)
         })
      },
      setTargetPool(state, pool) {
         state.targetPool = pool
      },
      toggleAdvancedPoolExclusion(state, pool) {
         let idx = state.excludedPools.indexOf(pool.id)
         if (idx > -1) {
            state.excludedPools.splice(idx, 1)
         } else {
            state.excludedPools.push(pool.id)
         }
      },
      clearExcluded( state ) {
         state.excludedPools.splice(0, state.excludedPools.length)
      },
      excludeAll( state, pools ) {
         state.excludedPools.splice(0, state.excludedPools.length)
         pools.forEach( p => {
            if (state.targetPool != p.id) {
               state.excludedPools.push(p.id)
            }
         })
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
         state.basicSearchScope = { name: 'All', id: 'all' },
         state.advanced.splice(0, state.advanced.length)
         state.advanced.push( {op: "AND", value: "", field: "keyword", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "title", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "author", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "subject", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "date", comparison: "BETWEEN", endVal: "" } )
         state.excludedPools.splice(0, state.excludedPools.length)
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
               // old format. Needs conversion
               if ( rawFilter[0] != "{") {
                  let filter = convertOldFilter(rawFilter,
                     ctx.rootState.filters.availabilityFacet, ctx.rootState.filters.circulatingFacet)
                  params.set("filter", filter)
                  searchURL = "/search?"+params.toString()
                  let req = {token: token, url: searchURL, userID: ctx.rootState.user.signedInUser}
                  ctx.dispatch("searches/migrate", req, {root:true})
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

function convertOldFilter( filterStr, availFacet, circFacet ) {
   let out = {}
   filterStr.split("|").forEach( fp => {
      let facetID = fp.split(".")[0]
      let filterVal = fp.split(".")[1]
      if (facetID == availFacet.id) {
         out[facetID] = [filterVal]
      } else if (facetID == circFacet.id) {
         out[facetID] = []
      } else {
         if (Object.prototype.hasOwnProperty.call(out, facetID) == false) {
            out[facetID] = []
         }
         out[facetID].push(filterVal)
      }
   })
   return JSON.stringify(out)
}

export default query
