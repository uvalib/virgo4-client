import { getField, updateField } from 'vuex-map-fields'

const query = {
   namespaced: true,
   state: {
      mode: "basic",
      basic: "",
      basicSearchScope: {name: 'All Sources', id: 'all'},
      advanced: [
         {op: "AND", value: "", field: "keyword", type: "EQUAL", endVal: ""},
      ],
      advancedFields: [
         { value: "keyword", label: "Keyword"},
         { value: "identifier", label: "Identifier"},
         { value: "title", label: "Title"},
         { value: "author", label: "Author"},
         { value: "subject", label: "Subject"},
         { value: "date", label: "Date"}
      ],
      lastSearch: ""
   },
   getters: {
      getField,
      idQuery: () => id => {
         return `identifier: {${id}}`
      },
      queryObject: state => {
         let out = {mode: state.mode}
         if (state.mode == "basic" ) {
            out.scope = state.basicSearchScope
            out.query = state.basic
         } else {
            out.query = state.advanced
         }
         return out
      },
      queryEntered: state => {
         if ( state.mode == "basic") {
            return state.basic.length > 0
         }
         let found = false
         state.advanced.some( term=> {
            found = term.value.length > 0
            return found == true
         })
         return found
      },
      string: state => {
         // convert into the standard v4 search string format. Ex:
         // title : {"susan sontag" OR music title} AND keyword:{ Maunsell } ) OR author:{ liberty }
         // Fields are joined together with AND or OR based on the fieldOp setting
         if ( state.mode == "basic") {
            let qp = state.basic
            if (qp.length == 0) qp = "*"
            return `keyword: {${qp}}`
         }

         let qs = "" 
         state.advanced.forEach( function(term) {
            if (term.value.length > 0) {
               if (qs.length > 0 ) {
                  // after the first term, use the search op to combine
                  qs += ` ${term.op} `
               }
               if ( term.field == "date") {
                  // special handling for date as it can include a range and a type
                  if ( term.type == "BETWEEN") {
                     qs += `date: {${term.value} TO ${term.endVal}}`
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
      restoreSearch(state, data) {
         state.mode = data.mode 
         if ( data.mode == "basic" ) {
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
         let exist = state.advanced.findIndex( f=> f.value == state.basic)
         if (exist == -1) {
            if (state.advanced.length == 1 && state.advanced[0].value == "") {
               state.advanced[0].value  = state.basic   
               state.advanced[0].field = "keyword"
            }
         }
       },
      setBasicSearch(state) {
         state.mode = "basic"
      },
      setSubjectSearch(state, subject) {
         state.mode = "advanced"
         state.advanced = [
            {op: "AND", value: `"${subject}"`, field: "subject", type: "EQUAL", endVal: ""}]
      },
      setTitleSearch(state, title) {
         state.mode = "advanced"
         let bits = title.split(" : ")
         if (bits.length > 2) {
            bits.splice(0,2)
         }
         state.advanced.splice(0, state.advanced.length)
         bits.forEach( t=> {
            state.advanced.push({op: "AND", value: `"${t}"`, field: "title", type: "EQUAL", endVal: ""})    
         })
      },
      addCriteria(state) {
        state.advanced.push({op: "AND", value: "", field: "keyword", type: "EQUAL", endVal: ""})
      },
      removeCriteria(state, idx) {
         state.advanced.splice(idx,1)
       },
      clear(state) {
         state.lastSearch = ""
         state.mode = "basic"
         state.basic = ""
         state.basicSearchScope = {name: 'All Sources', id: 'all'},
         state.advanced = [
            {op: "AND", value: "", field: "keyword", type: "EQUAL", endVal: ""}]
      },
      setLastSearch(state, qs) {
         state.lastSearch = qs   
      }
   }
}

export default query