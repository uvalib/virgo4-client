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
            <table class="fields">  
               <tr v-for="field in detailFields" :key="getKey(field)">
                  <template v-if="field.display != 'optional'">
                     <td class="label">{{field.label}}:</td>
                     <td class="value" v-html="fieldValueString(field)"></td>
                  </template>
               </tr>
            </table>
         </template>
         <BackToVirgo />
      </div>
   </main>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import BackToVirgo from "@/components/BackToVirgo"
export default {
   name: "sources",
   components: {
      BackToVirgo
   },
   computed: {
      ...mapState({
         searching : state => state.searching,
      }),
      ...mapGetters({
          getDetails: "getItemDetails",
      }),
      notFound() {
         return this.detailFields.length == 0
      },
      detailFields() {
         let src= this.$route.params.src
         let id= this.$route.params.id
         let details =  this.getDetails(src, id)
         if (details == null ) {
            return []
         }
         return [...details.basicFields.concat(details.detailFields)]
      }
   },
   methods: {
      getKey(field) {
         return field.name+field.value
      },
      fieldValueString( field ) {
         if ( Array.isArray(field.value)) {
            return field.value.join(",<br>")
         }
         if (field.type == "url") {
            return `<a href="${field.value}" class="pure-button pure-button-primary ext" target="_blank">External Link&nbsp;&nbsp;<i class="fas fa-external-link-alt"></i></a>`
         } 
         return field.value
      },
   },
   created() {
      let src = this.$route.params.src
      let id= this.$route.params.id
      this.$store.dispatch("getItemDetails", {source:src, identifier:id})
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
.working {
   text-align: center;
   font-size: 1.25em;
}
.working img {
   margin: 30px 0;
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
table {
   width:100%;
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
</style>

