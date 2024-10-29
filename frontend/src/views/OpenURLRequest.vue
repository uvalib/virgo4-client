<template>
   <div class="request">
      <template v-if="request">
         <Article v-if="request=='Article'" @canceled="cancelRequest" @submitted="requestSubmitted"/>
         <Book v-if="request=='Book'" @canceled="cancelRequest" @submitted="requestSubmitted"/>
         <BookChapter v-if="request=='BookChapter'" @canceled="cancelRequest" @submitted="requestSubmitted"/>
      </template>
      <div v-else class="submitted">
         <h2>Request Submitted</h2>
         <h3>We have received your request.</h3>
         <table>
            <tbody>
               <tr>
                  <td class="label">User ID:</td>
                  <td>{{user.userId}}</td>
               </tr>
               <tr>
                  <td class="label">Title:</td>
                  <td>{{requestStore.openurl.title}}</td>
               </tr>
            </tbody>
         </table>
         <p>
            You can check the status of this request on your
            <router-link to="/requests">account requests</router-link>
            page.
         </p>
      </div>
   </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
import analytics from '@/analytics'
import Article from "@/components/requests/openurl/Article.vue"
import BookChapter from "@/components/requests/openurl/BookChapter.vue"
import Book from "@/components/requests/openurl/Book.vue"
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"

const router = useRouter()
const route = useRoute()
const requestStore = useRequestStore()
const user = useUserStore()
const system = useSystemStore()

const request = ref("pending")

onBeforeRouteUpdate((to) => {
   if (to.query.submitted) {
      request.value=""
   }
})

function initForm( queryParams ) {
   let genre = queryParams['rtf.genre']
   if ( !genre ) {
      genre = queryParams['genre']
      if (!genre) {
         router.push("/not_found")
         return
      }
   }
   if (Array.isArray(genre) ) {
      genre = genre[0]
   }
   requestStore.setOpenURLRequestGenre(genre)
   request.value = requestStore.openurl.documentType.replace(" ", "")

   // OCLC
   requestStore.openurl.oclc = getParam(queryParams, "rfe_dat").join(", ")

   // ISSN/ISBN
   let vals = getMultParam( queryParams, ["rft.isbn", "rft.issn", "rft.eissn", 'issn', 'isbn'])
   requestStore.openurl.issn = vals.join(", ")

   if (requestStore.openurl.documentType == "Article" || requestStore.openurl.documentType == "BookChapter") {
      // Journal/book title
      vals = getMultParam( queryParams, ['rft.jtitle', 'rft.title', 'title', 'rft.stitle'])
      requestStore.openurl.title = vals.join("; ")

      // Article/chapter title
      vals = getMultParam( queryParams, ['rft.atitle', 'atitle'])
      requestStore.openurl.article = vals.join("; ")

      // volume
      vals = getMultParam(queryParams, ['rft.volume', 'volume'])
      requestStore.openurl.volume = vals.join(", ")

      // issue
      vals = getMultParam(queryParams, ['rft.issue', 'issue'])
      requestStore.openurl.issue = vals.join(", ")

      // year
      vals = getMultParam(queryParams, ['rft.date', 'date'])
      requestStore.openurl.year = vals.join(", ")

      // pages
         vals = getMultParam(queryParams, ['rft.pages', 'rft.spage', 'rft.epage', 'pages', 'spage', 'epage'])
         requestStore.openurl.pages = vals.join(", ")
   } else {
      // book title
      vals = getMultParam( queryParams, ['rft.btitle', 'rft.title', 'title'])
      requestStore.openurl.title = vals.join("; ")

      // publisher
      vals = getParam(queryParams, "rft.pub")
      requestStore.openurl.publisher = vals.join(", ")

      // publication date
      vals = getMultParam(queryParams, ['rft.date', 'date'])
      requestStore.openurl.year = vals.join(", ")
   }

   // author; first see if its just au
   vals = getParam(queryParams, "rft.au")
   if (vals.length > 0) {
      requestStore.openurl.author = vals.join("; ")
   } else {
      let last = getMultParam(queryParams, ["rft.aulast", "aulast"])
      let first = getMultParam(queryParams, ["rft.aufirst", "aufirst"])
      let mi = getMultParam(queryParams, ["rft.auinitm", "auinitm"])
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
      requestStore.openurl.author = authors.join("; ")
   }

   // cited-in
   vals = getMultParam( queryParams, ['sid', 'rft_id'])
   requestStore.openurl.citedin = vals.join(", ")
}

function getMultParam( params, keys ) {
   let val = []
   keys.forEach( k => {
      let v = getParam(params, k)
      val = val.concat(v)
   })
   return [...new Set(val)]
}

function getParam( params, name) {
   let val = params[name]
   if ( val ) {
      if (Array.isArray(val) ) {
         return [...new Set(val)]
      }
      return [val.replace( /(<([^>]+)>)/ig, '')]
   }
   return []
}

function cancelRequest() {
   router.push("/")
}
async function requestSubmitted() {
   await requestStore.submitOpenURLRequest()
   if ( system.error == "" || system.error == null) {
      request.value = ""
      let p = route.fullPath
      p = p.split("?")[0] + "?submitted=true"
      router.replace(p)
   }
}

onMounted(() => {
   initForm(route.query)
   analytics.trigger('Requests', 'REQUEST_STARTED', "openURL")
})
</script>
<style lang="scss" scoped>
.request {
   min-height: 400px;
   position: relative;
   margin: 0 auto;
   margin-top: 2vw;
   text-align: left;
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
