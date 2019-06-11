import { getField, updateField } from 'vuex-map-fields'

const query = {
   namespaced: true,
   state: {
      keyword: "",
      keywordOp: "AND",
      author: "",
      authorOp: "AND",
      title: "",
      titleOp: "AND",
      subject: "",
      subjectOp: "AND",
   },
   getters: {
      getField,
      string: state => {
         // convert into the standard v4 search string format. Ex:
         // title : {"susan sontag" OR music title}   AND keyword:{ Maunsell } ) OR author:{ liberty }
         // For now, all 'fields' are AND'd together and the raw strings entered in the form just
         // tacked on after the key.
         var andTerms = []
         var orTerms = []
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
         state.query.keyword = ""
         state.query.author = ""
         state.query.title = ""
         state.query.subject = ""
      }
   }
}

export default query