<template>
   <div class="codes">
      <h1>Codes</h1>
      <div class="codes-content">
         <div class="working" v-if="working" >
            <V4Spinner message="Looking up codes..."/>
         </div>
         <AccordionContent title="Library Codes">
            <table>
               <tr>
                  <th>ID</th><th>Code</th><th>Name</th>
                  <th class="center">On Shelf</th><th class="center">Circulating</th>
               </tr>
               <tr v-for="lc in libraryCodes" :key="`loc${lc.id}`">
                  <td>{{lc.id}}</td>
                  <td>{{lc.key}}</td>
                  <td>{{lc.description}}</td>
                  <td class="center" v-html="getIcon(lc.on_shelf)"></td>
                  <td class="center" v-html="getIcon(lc.circulating)"></td>
               </tr>
            </table>
         </AccordionContent>
         <AccordionContent title="Location Codes">
            <table>
               <tr>
                  <th>ID</th><th>Code</th><th>Description</th><th>Online</th>
                  <th>Shadowed</th><th>On Shelf</th><th>Circulating</th>
               </tr>
               <tr v-for="lc in locationCodes" :key="`loc${lc.id}`">
                  <td>{{lc.id}}</td>
                  <td>{{lc.key}}</td>
                  <td>{{lc.description}}</td>
                  <td class="center" v-html="getIcon(lc.online)"></td>
                  <td class="center" v-html="getIcon(lc.shadowed)"></td>
                  <td class="center" v-html="getIcon(lc.on_shelf)"></td>
                  <td class="center" v-html="getIcon(lc.circulating)"></td>
               </tr>
            </table>
         </AccordionContent>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
import AccordionContent from '@/components/AccordionContent'

export default {
   name: "codes",
   components: {
      AccordionContent
   },
   computed: {
      ...mapState({
         working: state => state.searching,
         libraryCodes: state => state.system.libraryCodes,
         locationCodes: state => state.system.locationCodes
      }),
   },
   methods: {
      getIcon( flag ) {
         if (flag) {
            return '<i class="fas fa-check-circle"></i>'
         }
         return '<i class="fas fa-times-circle"></i>'
      }
   },
   created() {
      this.$store.dispatch('system/getCodes')
   }
}
</script>
<style scoped>
.codes {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
td >>> .fa-times-circle {
   color: var(--uvalib-red);
   font-size: 1.15em;
   opacity: 0.6;
}
td >>> .fa-check-circle {
   color: var(--uvalib-green-dark);
   font-size: 1.15em;
}
@media only screen and (min-width: 768px) {
   div.codes-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.codes-content  {
       width: 95%;
   }
   .standing-info {
      width: 90%;
   }
}
.working {
   text-align: center;
   font-size: 1.25em;
}
.working img {
   margin: 30px 0;
}
.codes-content {
   width: 60%;
   margin: 0 auto;
   text-align: left;
}
.accordion {
   margin-bottom: 15px;
}
table {
   width: 100%;
   font-weight: normal;
}
table td {
   padding: 4px 5px;
   border-bottom: 1px solid var(--uvalib-grey-light);
}
.center {
   text-align: center;
}
table th {
   padding: 4px 5px;
   background: var(--uvalib-grey-lightest);
   border-bottom: 1px solid var(--uvalib-grey);
   border-top: 1px solid var(--uvalib-grey);
}
</style>
