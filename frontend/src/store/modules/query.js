import { getField, updateField } from 'vuex-map-fields'
import axios from 'axios'

const query = {
   namespaced: true,
   state: {
      userSearched: false,
      mode: "basic",
      basic: "",
      searchSources: "all",
      advanced: [
         { op: "AND", value: "", field: "keyword", comparison: "EQUAL", endVal: "" },
         { op: "AND", value: "", field: "title", comparison: "EQUAL", endVal: "" },
         { op: "AND", value: "", field: "author", comparison: "EQUAL", endVal: "" },
         { op: "AND", value: "", field: "subject", comparison: "EQUAL", endVal: "" },
         { op: "AND", value: "", field: "date", comparison: "BETWEEN", endVal: "" },
         { op: "AND", value: "", field: "fulltext", comparison: "EQUAL", endVal: "" },
      ],
      advancedFields: [
         { value: "keyword", label: "Keyword", type: "text" },
         { value: "identifier", label: "Identifier", type: "text" },
         { value: "title", label: "Title", type: "text" },
         { value: "fulltext", label: "Full Text", type: "text" },
         { value: "journal_title", label: "Journal Title", type: "text" },
         { value: "author", label: "Author", type: "text" },
         { value: "subject", label: "Subject", type: "text" },
         { value: "date", label: "Date", type: "date" },
         { value: "published", label: "Publisher/Place of Publication", type: "text"}
      ],
      targetPool: ""
   },
   getters: {
      getField,
      getState: state => {
         return state
      },
      advancedSearchTemplate( state ) {
         let out = { fields: []}
         state.advanced.forEach(  af => {
            let tpl =  {op: af.op, field: af.field, comparison: af.comparison}
            out.fields.push( tpl )
         })
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
            return qs
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

         if (qs.length == 0) {
            qs = "keyword: {}"
         }

         return qs
      },
   },
   mutations: {
      updateField,
      fixDateSearches(state) {
         state.advanced.filter( f => f.field == "date" && f.comparison == "BETWEEN").forEach( df => {
            if ( df.value == "" && df.endVal != "") {
               df.comparison = "BEFORE"
            }
            if ( df.value != "" && df.endVal == "") {
               df.comparison = "AFTER"
            }
         })
      },
      resetAdvancedForm(state) {
         state.advanced.splice(0, state.advanced.length)
         state.advanced.push({ op: "AND", value: "", field: "keyword", comparison: "EQUAL", endVal: "" })
         state.advanced.push({ op: "AND", value: "", field: "title", comparison: "EQUAL", endVal: "" })
         state.advanced.push({ op: "AND", value: "", field: "author", comparison: "EQUAL", endVal: "" })
         state.advanced.push({ op: "AND", value: "", field: "subject", comparison: "EQUAL", endVal: "" })
         state.advanced.push({ op: "AND", value: "", field: "date", comparison: "BETWEEN", endVal: "" })
         state.advanced.push({ op: "AND", value: "", field: "fulltext", comparison: "EQUAL", endVal: "" })
      },
      setTemplate(state, template) {
         let hasQuery = false
         state.advanced.some( t => {
            if (t.value != "") {
               hasQuery = true
            }
            return hasQuery == true
         })
         if ( hasQuery == false) {
            state.advanced.splice(0, state.advanced.length)
            template.fields.forEach( f => {
               let newField = { op: f.op, value: "", field: f.field, comparison: f.comparison, endVal: "" }
               if (f.value ) {
                  newField.value = f.value
               }
               state.advanced.push(newField)
            })
         }
      },

      restoreFromURL(state, queryParams) {
         // Clear out all existing data
         state.basic = ""
         state.advanced.splice(0, state.advanced.length)

         // queries should be formatted like 'field: {...', but some older queries lack the field and braces
         // look for these and turn them into a basic keyword seatch
         if ( !queryParams.match(/^\w+:\s?{/) ) {
            state.basic = queryParams
            return
         }

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
            if (value == "*") {
               value = ""
            }

            queryParams = queryParams.substring(braceIdx2+1).trim()
            let keyOpParts = keyOp.split(" ")
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

      clear(state) {
         state.basic = ""
         state.advanced.forEach( a => {
            a.op = "AND"
            a.value = ""
         })
         state.targetPool = ""
      },
   },
   actions: {
      async loadSearch(ctx, token) {
         ctx.commit('setSearching', true, { root: true })
         try {
            let response = await axios.get(`/api/searches/${token}`)
            let searchURL = response.data.url
            if (searchURL == "") {
               ctx.commit('setSearching', false, { root: true })
               this.router.push("/not_found")
            } else {
               await this.router.replace(searchURL)
            }
         } catch(error) {
            console.error(error)
            ctx.commit('setSearching', false, { root: true })
            this.router.push("/not_found")
         }
      }
   }
}

export default query
