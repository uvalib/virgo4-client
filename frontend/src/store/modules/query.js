import { getField, updateField } from 'vuex-map-fields'
import axios from 'axios'
import router from '../../router'

const query = {
   namespaced: true,
   state: {
      mode: "basic",
      basic: "",
      basicSearchScope: { name: 'All Resource Types', id: 'all' },
      advanced: [
         { op: "AND", value: "", field: "keyword", comparison: "EQUAL", endVal: "" },
      ],
      browse: 
         { op: "AND", value: "", field: "", comparison: "EQUAL", endVal: "" },
      advancedFields: [
         { value: "keyword", label: "Keyword", type: "text", choices: [] },
         { value: "identifier", label: "Identifier", type: "text", choices: [] },
         { value: "title", label: "Title", type: "text", choices: [] },
         { value: "author", label: "Author", type: "text", choices: [] },
         { value: "subject", label: "Subject", type: "text", choices: [] },
         { value: "date", label: "Date", type: "date", choices: [] },
         { value: "published", label: "Publisher/Place of Publication", type: "text", choices: []}
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
   },
   mutations: {
      updateField,
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
      restoreSearch(state, data) {
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
         state.advanced.push({ op: "AND", value: barcode, field: "identifier", comparison: "EQUAL", endVal: "" })
      },
      setBasicSearch(state) {
         state.mode = "basic"
      },
      browseAuthors(state, author) {
         state.mode = "browse"
         state.browse = [
            { op: "AND", value: `${author}`, field: "author", comparison: "EQUAL", endVal: "" }]
      },
      browseSubjects(state, subject) {
         state.mode = "browse"
         state.browse = [
            { op: "AND", value: `"${subject}"`, field: "subject", comparison: "EQUAL", endVal: "" }]
      },
      addCriteria(state) {
         state.advanced.push({ op: "AND", value: "", field: "keyword", comparison: "EQUAL", endVal: "" })
      },
      removeCriteria(state, idx) {
         state.advanced.splice(idx, 1)
      },
      clear(state) {
         state.mode = "basic"
         state.basic = ""
         state.basicSearchScope = { name: 'All Resource Types', id: 'all' },
         state.advanced = [
            { op: "AND", value: "", field: "keyword", comparison: "EQUAL", endVal: "" }]
         state.browse = [
            { op: "AND", value: "", field: "keyword", comparison: "EQUAL", endVal: "" }]
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
               router.replace(response.data.url)    
            } else {
               let old = JSON.parse(response.data.search)
               ctx.commit('restoreSearch', old )
               let url = ctx.getters.queryURLParams
               if (old.pool != "") {
                  url += `&pool=${old.pool}`
               }
               if (old.filters && old.filters.length > 0) {
                  url += "&filter="
                  let filters = []
                  old.filters.forEach(f => {
                     if (f.value != "") {
                        filters.push(`${f.facet_id}.${f.value}`)
                     } else {
                        filters.push(`${f.facet_id}`)
                     }
                  })
                  url += encodeURI(filters.join("|"))
               }
               url = `/search?${url}`
               router.replace( url )   
               let req = {token: token, name: response.data.name, url: url, isPublic: response.data.public, 
                  userID: ctx.rootState.user.signedInUser}
               ctx.dispatch("searches/save", req, {root:true})
            }
         } catch (error)  {
            ctx.commit('setSearching', false, { root: true })
            router.push("/not_found")
         }
      },
   }
}

export default query
