<template>
   <div class="details">
      <h1>Item Details</h1>
      <div class="details-content">
         <div class="working" v-if="details.searching" >
            <V4Spinner message="Looking up details..."/>
         </div>
         <template v-else-if="notFound">
            <div class="not-found">
               <p><b>Sorry!</b></p>
               <p>The requested item was not found</p>
            </div>
         </template>
         <template v-else>
            <SearchHitHeader v-bind:link="false" :hit="details" :pool="this.$route.params.src"/>
            <div class="info">
               <table class="fields">
                  <tr v-if="details.header.author">
                     <td class="label">{{details.header.author.label}}:</td>
                     <td class="value">{{details.header.author.value.join("; ")}}</td>
                  </tr>
                  <tr v-for="(field,idx) in allFields" :key="idx">
                     <template v-if="shouldDisplay(field)">
                        <td class="label">{{field.label}}:</td>
                        <template v-if="field.type == 'subject'" >
                           <td class="value">
                              <template v-if="Array.isArray(field.value)">
                                 <template  v-for="(val,idx) in field.value">
                                    <span v-if="idx>0" class="sep" :key="idx+'s'">|</span>
                                    <router-link  :key="idx" :to="getSubjectLink(val)">
                                       <span class="subject-link">{{val}}</span>
                                    </router-link>
                                 </template>
                              </template>
                              <router-link  v-else :to="getSubjectLink(field.value)">
                                 <span class="subject-link">{{field.value}}</span>
                              </router-link>
                           </td>
                        </template>
                        <td v-else class="value" v-html="fieldValueString(field)"></td>
                     </template>
                  </tr>
               </table>
            </div>
            <AvailabilityTable v-if="details.has_availability != false" :titleId="details.identifier" />
         </template>
         <BackToVirgo  />
      </div>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import BackToVirgo from "@/components/BackToVirgo"
import SearchHitHeader from '@/components/SearchHitHeader'
import AvailabilityTable from "@/components/AvailabilityTable"
import V4Spinner from "@/components/V4Spinner"
export default {
   name: "sources",
   components: {
      BackToVirgo, SearchHitHeader, AvailabilityTable, V4Spinner
   },
   computed: {
      ...mapState({
         details : state => state.item.details,
      }),
      ...mapGetters({
         isSignedIn: 'user/isSignedIn',
         bookmarks: 'user/bookmarks',
         isKiosk: 'system/isKiosk',
      }),
      notFound() {
         return this.details.identifier.length == 0
      },
      allFields() {
         return [...this.details.basicFields.concat(this.details.detailFields)]
      },
      fromCourseReserves() {
         return this.$route.params.src == "course-reserves"
      }
   },
   methods: {
      getSubjectLink(subj) {
         return `/search?subject=${encodeURI(subj)}`
      },
      shouldDisplay(field) {
         if (field.display == 'optional') return false
         if ( this.isKiosk && field.type == "url") return false
         return true
      },
      fieldValueString( field ) {
         if ( Array.isArray(field.value)) {
            if (field.type == "url") {
               let out = []
               field.value.forEach( (v,idx) => {
                  let url = `<a href="${v}" target="_blank">`
                  if ( idx === 0) {
                     url += `<i style="margin-right: 5px;" class="more fas fa-link"></i>`
                  }
                  url += `External Link #${idx+1}</a>`
                  out.push( url )
               })
               return out.join(",&nbsp;&nbsp;")
            }
            return field.value.join(",&nbsp;")
         }
         if (field.type == "url") {
            return `<a href="${field.value}" target="_blank"><i style="margin-right:5px;" class="more fas fa-link"></i>External Link</a>`
         }
         return field.value
      },
   },
   created() {
      let src = this.$route.params.src
      let id= this.$route.params.id
      if (src == "course-reserves") {
         this.$store.dispatch("item/lookupCatalogKeyDetail", id )
      } else {
         this.$store.dispatch("item/getDetails", {source:src, identifier:id})
         if ( this.isSignedIn) {
            this.$store.dispatch("user/getBookmarks")
         }
      }
   }
}
</script>
<style scoped>
.details {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
.details-content {
   width: 80%;
   margin: 0 auto;
}
@media only screen and (min-width: 768px) {
   div.details-content  {
      width: 80%;
   }
}
@media only screen and (max-width: 768px) {
   div.details-content  {
      width: 95%;
   }
}
.info {
   margin: 15px 0;
   border-top: 4px solid var(--color-brand-blue);
}
.cover-img {
   max-width: 300px;
   margin: 10px;
   border-radius: 5px;
}
.working {
   text-align: center;
   font-size: 0.9em;
}
.working img {
   margin: 30px 0;
}
table {
   table-layout: auto;
   margin-top: 15px;
}
#app td.value >>> a.pure-button.pure-button-primary.ext {
   background-color:var(--color-pale-blue);
   color: white;
   padding: 3px 0px;
   width: 100%;
   border-radius: 5px;
}
#app td.value >>> a.pure-button.pure-button-primary.ext:hover {
   text-decoration: none;
}
td.label {
   font-weight: bold;
   text-align: right;
   padding: 4px 8px;
   width:1%;
   white-space: nowrap;
}
table td.value {
   width: 100%;
   font-weight: normal;
   text-align: left;
   width: 100%;
   padding: 4px 8px;
}
.bookmark-container {
   float:left;
}
.sep {
   margin: 0 5px;
}
</style>
