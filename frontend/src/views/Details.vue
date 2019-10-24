<template>
   <main class="details">
      <h1>Item Details</h1>
      <div class="details-content">
         <div class="working" v-if="searching" >
            <div>Looking up details...</div>
            <img src="../assets/spinner2.gif">
         </div>
         <template v-else-if="notFound">
            <div class="not-found">
               <p><b>Sorry!</b></p>
               <p>The requested item was not found</p>
            </div>
         </template>
         <template v-else>
            <SearchHitHeader :hit="details" :pool="this.$route.params.src"/>
            <div class="info">
               <table class="fields">
                  <tr v-for="(field,idx) in detailFields" :key="idx">
                     <template v-if="field.display != 'optional'">
                        <td class="label">{{field.label}}:</td>
                        <td class="value" v-html="fieldValueString(field)"></td>
                     </template>
                  </tr>
               </table>
               <img class="cover-img" v-if="details.cover_image" :src="details.cover_image"/>
            </div>
            <AvailabilityTable :titleId="details.identifier" />
         </template>
         <BackToVirgo v-if="fromCourseReserves" backURL="/course-reserves"/>
         <BackToVirgo v-else />
      </div>
   </main>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import BackToVirgo from "@/components/BackToVirgo"
import SearchHitHeader from '@/components/SearchHitHeader'
import AvailabilityTable from "@/components/AvailabilityTable"
export default {
   name: "sources",
   components: {
      BackToVirgo,SearchHitHeader,AvailabilityTable
   },
   computed: {
      ...mapState({
         searching : state => state.searching,
         details : state => state.item.details,
      }),
      ...mapGetters({
         isSignedIn: 'user/isSignedIn',
         bookmarks: 'user/bookmarks'
      }),
      notFound() {
         return this.details.identifier.length == 0
      },
      detailFields() {
         return [...this.details.basicFields.concat(this.details.detailFields)]
      },
      fromCourseReserves() {
         return this.$route.params.src == "course-reserves"
      }
   },
   methods: {
      fieldValueString( field ) {
         if ( Array.isArray(field.value)) {
            return field.value.join(",<br>")
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
   width: 50%;
   margin: 0 auto;
}
@media only screen and (min-width: 768px) {
   div.details-content  {
      width: 50%;
   }
}
@media only screen and (max-width: 768px) {
   div.details-content  {
      width: 95%;
   }
}
.info {
   margin: 15px 0;
   border-top: 4px solid var(--color-primary-orange);
   display:flex;
   flex-flow: row wrap;
   align-items: flex-start;
   justify-content: center;
}
.cover-img {
   max-width: 300px;
   margin: 10px;
   border-radius: 5px;
}
.working {
   text-align: center;
   font-size: 1.25em;
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
</style>

