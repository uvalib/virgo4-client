import { getField, updateField } from 'vuex-map-fields'

const query = {
   namespaced: true,
   state: {
      identifier: "",
      identifierOp: "AND",
      keyword: "",
      keywordOp: "AND",
      author: "",
      authorOp: "AND",
      title: "",
      titleOp: "AND",
      subject: "",
      subjectOp: "AND",
      date0: "",
      date1: "",
      dateRangeType: "EQUAL",
      dateRangeOp: "AND",
   },
   getters: {
      getField,
      string: state => {
         // convert into the standard v4 search string format. Ex:
         // title : {"susan sontag" OR music title} AND keyword:{ Maunsell } ) OR author:{ liberty }
         // Fields are joined together with AND or OR based on the fieldOp setting
         var andTerms = []
         var orTerms = []
         if (state.identifier != "") {
            if (state.identifierOp == "AND") {
               andTerms.push("identifier: {" + state.identifier + "}")
            } else {
               orTerms.push("identifier: {" + state.identifier + "}")
            }
         }
         if (state.keyword != "") {
            if (state.keywordOp == "AND") {
               andTerms.push("keyword: {" + state.keyword + "}")
            } else {
               orTerms.push("keyword: {" + state.keyword + "}")
            }
         }
         if (state.author != "") {
            if (state.authorOp == "AND") {
               andTerms.push("author: {" + state.author + "}")
            } else {
               orTerms.push("author: {" + state.author + "}")
            }
         }
         if (state.title != "") {
            if (state.titleOp == "AND") {
               andTerms.push("title: {" + state.title + "}")
            } else {
               orTerms.push("title: {" + state.title + "}")
            }
         }
         if (state.subject != "") {
            if (state.subjectOp == "AND") {
               andTerms.push("subject: {" + state.subject + "}")
            } else {
               orTerms.push("subject: {" + state.subject + "}")
            }
         }

         if (state.date0 != "") {
            let dateQ = ""
            if (state.dateRangeType == "BEFORE" || state.dateRangeType == "AFTER" ) {
               dateQ = state.dateRangeType + " " + state.date0
            } else if (state.dateRangeType == "BETWEEN") {
               dateQ = state.date0 + " TO "+ state.date1
            } else {
               dateQ = state.date0
            }
            if (state.dateRangeOp == "AND") {
               andTerms.push("date: {" + dateQ + "}")
            } else {
               orTerms.push("date: {" + dateQ + "}" )
            }
         }
         let anded = andTerms.join(" AND ")
         let ored = orTerms.join(" OR ")
         if (anded.length > 0 && ored.length > 0) {
            return anded + " OR " + ored
         }
         if (anded.length > 0) return anded
         if (ored.length > 0) return ored
         return ""
      }
   },
   mutations: {
      updateField,
      clear(state) {
         state.identifier = ""
         state.identifierOp = "AND"
         state.keyword = ""
         state.keywordOp = "AND"
         state.author = ""
         state.authorOp = "AND"
         state.title = ""
         state.titleOp = "AND"
         state.subject = ""
         state.subjectOp = "AND"
         state.date0 = ""
         state.date1 = ""
         state.dateRangeType = "EQUAL"
         state.dateRangeOp = "AND"
      }
   }
}

export default query