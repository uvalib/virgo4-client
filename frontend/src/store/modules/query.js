import { getField, updateField } from 'vuex-map-fields'
import axios from 'axios'
import router from '../../router'

const query = {
   namespaced: true,
   state: {
      userSearched: false,
      mode: "basic",
      basic: "",
      basicSearchScope: { name: 'All Resource Types', id: 'all' },
      advanced: [
         { op: "AND", value: "", field: "keyword", comparison: "EQUAL", endVal: "" },
         { op: "AND", value: "", field: "title", comparison: "EQUAL", endVal: "" },
         { op: "AND", value: "", field: "author", comparison: "EQUAL", endVal: "" },
         { op: "AND", value: "", field: "subject", comparison: "EQUAL", endVal: "" },
         { op: "AND", value: "", field: "date", comparison: "BETWEEN", endVal: "" },
      ],
      advancedFields: [
         { value: "keyword", label: "Keyword", type: "text", choices: [] },
         { value: "identifier", label: "Identifier", type: "text", choices: [] },
         { value: "title", label: "Title", type: "text", choices: [] },
         { value: "author", label: "Author", type: "text", choices: [] },
         { value: "subject", label: "Subject", type: "text", choices: [] },
         { value: "date", label: "Date", type: "date", choices: [] },
         { value: "published", label: "Publisher/Place of Publication", type: "text", choices: []}
      ],
      excludedPools: [],
      targetPool: ""
   },
   getters: {
      getField,
      advancedSearchTemplate( state ) {
         let ep = [...new Set(state.excludedPools)]
         let out = { excluded: ep, fields: []}
         state.advanced.forEach(  af => {
            let tpl =  {op: af.op, field: af.field, comparison: af.comparison}
            if (tpl.field.includes("filter.")) {
               tpl.value = af.value
            }
            out.fields.push( tpl )
         })
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
         return found
      },
      string: state => {
         // convert into the standard v4 search string format. Ex:
         //     ( calico OR "tortoise shell" ) AND cats =>
         //     keyword: {(calico OR "tortoise shell") AND cats
         // Fields are joined together with AND or OR based on the fieldOp setting
         // Special case are the select-type filter terms where field=filter.name. It is:
         //     filter:{source_f:"Hathi Trust Digital Library"}
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
               } else if (term.field.includes("filter.")) {
                  let tgtField = term.field.split(".")[1].trim()
                  qs += `filter: {${tgtField}:"${term.value}"}`
               } else {
                  qs += `${term.field}: {${term.value}}`
               }
            }
         })
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
      setAdvancedFilterFields( state, filters) {
         filters.forEach( f=> {
            // If the filter already exists in the fields list, remove it and replace with new
            // prepend the value with filter. so it can easily be identified as a filter when encountered in a
            // query term. Makes generating the v4 query much easier.
            let val = `filter.${f.field}`
            let idx = state.advancedFields.findIndex( f=> f.value == val)
            if ( idx != -1 ) {
               state.advancedFields.splice(idx, 1)
            }
            if ( f.values.length == 0 ) {
               return
            }
            let field = {value: `filter.${f.field}`, label: f.label, type: "select", choices: f.values}
            state.advancedFields.push(field)
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

         state.advanced.splice(0, state.advanced.length)
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
            //   title: {pirate} AND filter: {source_f:"Hathi Trust Digital Library"}
            let keyOp = queryParams.substring(0, braceIdx).trim()   // get all up to colon
            keyOp = keyOp.substring(0, keyOp.length - 1)            // remove colon

            // the query term is the data between the { and }. Grab it
            // and remove this whole term from the query string
            let value = queryParams.substring(braceIdx+1, braceIdx2)
            queryParams = queryParams.substring(braceIdx2+1).trim()
            let keyOpParts = keyOp.split(" ")
            let term = { op: "AND", value: value, field: keyOp.toLowerCase(), comparison: "EQUAL", endVal: "" }
            if (keyOpParts.length == 1 && keyOp == "filter") {
               // 'filter' is special. The field is filter.[fieldName] and fieldName is
               // the string before the colon in value. The actual value is the quoted string
               // after the colon, with the quotes stripped. So for the example above,
               // field = filter.source_f and value=Hathi Trust Digital Library
               let filterField = value.split(":")[0].trim()
               let filterValue = value.split(":")[1].trim()
               filterValue = filterValue.substring(1, filterValue.length-1) // drop quotes
               term.field = `filter.${filterField}`
               term.value = filterValue
            } else if (keyOpParts.length == 2 ) {
               term.op = keyOpParts[0].trim()
               let field = keyOpParts[1].trim().toLowerCase()
               if ( field == "filter") {
                  // see notes above for special filter handling details
                  let filterField = value.split(":")[0].trim()
                  let filterValue = value.split(":")[1].trim()
                  filterValue = filterValue.substring(1, filterValue.length-1) // drop quotes
                  term.field = `filter.${filterField}`
                  term.value = filterValue
               } else {
                  term.field = field
               }
            } else if (keyOpParts.length > 2) {
               continue
            }

            if (state.advancedFields.findIndex( af => af.value == term.field) == -1) {
               console.error(term.field+" from URL not found in advanced fields. Skipping")
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
      },
      clear(state) {
         state.mode = "basic"
         state.basic = ""
         state.basicSearchScope = { name: 'All Resource Types', id: 'all' },
         state.advanced.splice(0, state.advanced.length)
         state.advanced.push( {op: "AND", value: "", field: "keyword", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "title", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "author", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "subject", comparison: "EQUAL", endVal: "" } )
         state.advanced.push( {op: "AND", value: "", field: "date", comparison: "BETWEEN", endVal: "" } )
         state.excludedPools.splice(0, state.excludedPools.length)
         state.targetPool = ""
      },
   },
   actions: {
      getAdvancedSeatchFilters(ctx) {
         return axios.get(`/api/search_filters`).then((response) => {
            ctx.commit('setAdvancedFilterFields', response.data)
         }).catch((_error) => {
            // NO-OP If the fields can't be found, they just won't be available
         })
      },
      async loadSearch(ctx, token) {
         ctx.commit('setSearching', true, { root: true })
         try {
            // load the saved search info from backend
            let response = await axios.get(`/api/searches/${token}`)
            if (response.data.url != "") {
               // This is in the newer format (a URL not an object)
               // See if the filter part is old...
               let searchURL = response.data.url
               let params = new URLSearchParams(response.data.url.split("?")[1])
               let rawFilter = params.get("filter")
               if (rawFilter != "") {
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
            } else {
               // This is a REALLY old search stored as an object...
               let old = JSON.parse(response.data.search)
               ctx.state.mode = old.mode
               if (old.mode == "basic") {
                  ctx.state.basicSearchScope = old.scope
                  ctx.state.basic = old.query
               } else {
                  ctx.state.advanced = old.query
               }

               let url = ctx.getters.queryURLParams
               if (old.pool != "") {
                  url += `&pool=${old.pool}`
               }
               if (old.filters && old.filters.length > 0) {
                  let filterObj = {}
                  old.filters.forEach( f=> {
                     if (Object.prototype.hasOwnProperty.call(filterObj, f.facet_id) == false) {
                        filterObj[f.facet_id] = []
                     }
                     if ( f.value.length > 0) {
                        filterObj[f.facet_id].push(f.value)
                     }
                  })
                  url += `&filter=${encodeURIComponent( JSON.stringify(filterObj))}`
               }
               url = `/search?${url}`
               router.replace( url )
               ctx.commit("system/setMessage",
                  "Legacy saved search detected.<br/>The results may not be as expected because the save format is no longer supported.",
                   { root: true }
               )
               let req = {token: token, url: url, userID: ctx.rootState.user.signedInUser}
               ctx.dispatch("searches/migrate", req, {root:true})
            }
         } catch (error)  {
            ctx.commit('setSearching', false, { root: true })
            router.push("/not_found")
         }
      },
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
