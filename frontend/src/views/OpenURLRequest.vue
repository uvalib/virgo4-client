<template>
   <div class="request">
      <template v-if="request">
         <h1>Request an Item</h1>
         <component v-bind:is="request" @canceled="cancelRequest" @submitted="requestSubmitted"/>
      </template>
      <div v-else class="submitted">
         <h1>Request Submitted</h1>
         <h2>We have received your request.</h2>
         <table>
            <tr>
               <td class="label">User ID:</td>
               <td>{{userId}}</td>
            </tr>
            <tr>
               <td class="label">Title:</td>
               <td>{{title}}</td>
            </tr>
            <tr>
               <td class="label">Needed By:</td>
               <td>{{bydate}}</td>
            </tr>
         </table>
         <p>
            You can check the status of this request on your
            <router-link to="/requests">account requests</router-link>
            page.
         </p>
      </div>
   </div>
</template>

<script>

import { mapState } from "vuex"
import { mapFields } from "vuex-map-fields"
import Article from "@/components/requests/openurl/Article"
import BookChapter from "@/components/requests/openurl/BookChapter"
import Book from "@/components/requests/openurl/Book"
export default {
   name: "openurl",
   components: {
      Article, BookChapter, Book
   },
   data: function()  {
      return {
         request: "pending"
      }
   },
   computed: {
      ...mapState({
         sysError: state => state.system.error,
         buttonDisabled: state => state.requests.buttonDisabled,
         preferredPickupLibrary: state => state.preferences.pickupLibrary,
         documentType: state=> state.requests.openurl.documentType,
         userId: state => state.user.signedInUser
      }),
      ...mapFields('requests',[
         'openurl.title',
         'openurl.article',
         'openurl.author',
         'openurl.publisher',
         'openurl.edition',
         'openurl.anylanguage',
         'openurl.citedin',
         'openurl.volume',
         'openurl.issue',
         'openurl.month',
         'openurl.year',
         'openurl.issn',
         'openurl.oclc',
         'openurl.pages',
         'openurl.bydate'
      ]),
   },
   watch: {
      $route() {
         if (this.$route.query.submitted) {
            this.request=""
         } else {
            this.initForm(this.$route.query)
         }
      }
   },
   methods: {
      initForm( queryParams ) {
         let genre = queryParams['rtf.genre']
         if ( !genre ) {
            genre = queryParams['genre']
            if (!genre) {
               this.$router.push("/not_found")
               return
            }
         }
         if (Array.isArray(genre) ) {
            genre = genre[0]
         }
         this.$store.commit("requests/setOpenURLRequestGenre", genre)
         this.request = this.documentType.replace(" ", "")

         // OCLC
         this.oclc = this.getParam(queryParams, "rfe_dat").join(", ")

         // ISSN/ISBN
         let vals = this.getMultParam( queryParams, ["rft.isbn", "rft.issn", "rft.eissn", 'issn', 'isbn'])
         this.issn = vals.join(", ")

         if (this.documentType == "Article" || this.documentType == "BookChapter") {
            // Journal/book title
            vals = this.getMultParam( queryParams, ['rft.jtitle', 'rft.title', 'title', 'rft.stitle'])
            this.title = vals.join("; ")

            // Article/chapter title
            vals = this.getMultParam( queryParams, ['rft.atitle', 'atitle'])
            this.article = vals.join("; ")

            // volume
            vals = this.getMultParam(queryParams, ['rft.volume', 'volume'])
            this.volume = vals.join(", ")

            // issue
            vals = this.getMultParam(queryParams, ['rft.issue', 'issue'])
            this.issue = vals.join(", ")

            // year
            vals = this.getMultParam(queryParams, ['rft.date', 'date'])
            this.year = vals.join(", ")

            // pages
             vals = this.getMultParam(queryParams, ['rft.pages', 'rft.spage', 'rft.epage', 'pages', 'spage', 'epage'])
             this.pages = vals.join(", ")
         } else {
            // book title
            vals = this.getMultParam( queryParams, ['rft.btitle', 'rft.title', 'title'])
            this.title = vals.join("; ")

            // publisher
            vals = this.getParam(queryParams, "rft.pub")
            this.publisher = vals.join(", ")

            // publication date
            vals = this.getMultParam(queryParams, ['rft.date', 'date'])
            this.year = vals.join(", ")
         }

         // author; first see if its just au
         vals = this.getParam(queryParams, "rft.au")
         if (vals.length > 0) {
            this.author = vals.join("; ")
         } else {
            let last = this.getMultParam(queryParams, ["rft.aulast", "aulast"])
            let first = this.getMultParam(queryParams, ["rft.aufirst", "aufirst"])
            let mi = this.getMultParam(queryParams, ["rft.auinitm", "auinitm"])
            let authors = []
            last.forEach( (ln, idx) => {
               let name = ln
               if (idx < first.length) {
                  name += `, ${first[idx]}`
                  if (idx < mi.length) {
                     name += ` ${mi[idx]}`
                  }
               }
               authors.push(name)
            })
            this.author = authors.join("; ")
         }

         // cited-in
         vals = this.getMultParam( queryParams, ['sid', 'rft_id'])
         this.citedin = vals.join(", ")
      },

      getMultParam( params, keys ) {
         let val = []
         keys.forEach( k => {
            let v = this.getParam(params, k)
            val = val.concat(v)
         })
         return [...new Set(val)]
      },

      getParam( params, name) {
         let val = params[name]
         if ( val ) {
            if (Array.isArray(val) ) {
               return [...new Set(val)]
            }
            return [val.replace( /(<([^>]+)>)/ig, '')]
         }
         return []
      },

      cancelRequest() {
         this.$router.push("/")
      },
      async requestSubmitted() {
         await this.$store.dispatch("requests/submitOpenURLRequest")
         if ( this.sysError == "" || this.sysError == null) {
            this.request = ""
            let p = this.$route.fullPath
            p = p.split("?")[0] + "?submitted=true"
            this.$router.replace(p)
         }
      }
   },
   created() {
      this.initForm(this.$route.query)
   }
}
</script>
<style lang="scss" scoped>
.request {
   min-height: 400px;
   position: relative;
   margin: 0 auto;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
table {
   margin: 15px auto;
  text-align: left;
  td {
     padding: 10px;
  }
  td.label {
     text-align: right;
     font-weight: 500;
     padding-right: 0;
  }
}
@media only screen and (min-width: 768px) {
   div.request  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.request  {
       width: 95%;
   }
}
</style>
