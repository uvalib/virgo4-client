<template>
   <div class="codes">
      <div class="working" v-if="systemStore.working" >
         <V4Spinner message="Looking up codes..."/>
      </div>
      <AccordionContent id="lib-codes">
         <template v-slot:title>Library Codes</template>
         <table>
            <tbody>
               <tr>
                  <th>ID</th><th>Code</th><th>Name</th>
                  <th class="center">On Shelf</th><th class="center">Circulating</th>
               </tr>
               <tr v-for="lc in systemStore.libraryCodes" :key="`loc${lc.id}`">
                  <td>{{lc.id}}</td>
                  <td>{{lc.key}}</td>
                  <td>{{lc.description}}</td>
                  <td class="center" v-html="getIcon(lc.on_shelf)"></td>
                  <td class="center" v-html="getIcon(lc.circulating)"></td>
               </tr>
            </tbody>
         </table>
      </AccordionContent>
      <AccordionContent id="loc-codes">
         <template v-slot:title>Location Codes</template>
         <table>
            <tbody>
               <tr>
                  <th>ID</th><th>Code</th><th>Description</th><th>Online</th>
                  <th>Shadowed</th><th>On Shelf</th><th>Circulating</th>
               </tr>
               <tr v-for="lc in systemStore.locationCodes" :key="`loc${lc.id}`">
                  <td>{{lc.id}}</td>
                  <td>{{lc.key}}</td>
                  <td>{{lc.description}}</td>
                  <td class="center" v-html="getIcon(lc.online)"></td>
                  <td class="center" v-html="getIcon(lc.shadowed)"></td>
                  <td class="center" v-html="getIcon(lc.on_shelf)"></td>
                  <td class="center" v-html="getIcon(lc.circulating)"></td>
               </tr>
            </tbody>
         </table>
      </AccordionContent>
   </div>
</template>

<script setup>
import AccordionContent from "@/components/AccordionContent.vue"
import { useSystemStore } from "@/stores/system"
import { onMounted } from "vue"

const systemStore = useSystemStore()

function getIcon( flag ) {
   if (flag) {
      return '<i class="fas fa-check-circle">Y</i>'
   }
   return '<i class="fas fa-times-circle">N</i>'
}

onMounted(() => {
  systemStore.getCodes()
})
</script>

<style scoped lang="scss">
.codes {
   min-height: 400px;
   position: relative;
   margin: 2vw auto 0 auto;
   text-align: left;
   padding-bottom: 50px;
}
:deep(.fa-times-circle) {
   color: $uva-red;
   font-size: 1.15em;
   opacity: 0.6;
}
:deep(.fa-check-circle) {
   color: $uva-green-A;
   font-size: 1.15em;
}
@media only screen and (min-width: 768px) {
   div.codes  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.codes  {
       width: 95%;
   }
}
.working {
   text-align: center;
   font-size: 1.25em;
}
.working img {
   margin: 30px 0;
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
   border-bottom: 1px solid $uva-grey-100;
}
.center {
   text-align: center;
}
table th {
   padding: 4px 5px;
   background: $uva-grey-200;
   border-bottom: 1px solid $uva-grey;
   border-top: 1px solid $uva-grey;
}
</style>
