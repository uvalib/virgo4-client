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
                  <td class="center"><span :class="getText(lc.on_shelf).toLowerCase()">{{ getText(lc.on_shelf) }}</span></td>
                  <td class="center"><span :class="getText(lc.circulating).toLowerCase()">{{ getText(lc.circulating) }}</span></td>
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
                  <td class="center"><span :class="getText(lc.online).toLowerCase()">{{ getText(lc.online) }}</span></td>
                  <td class="center"><span :class="getText(lc.shadowed).toLowerCase()">{{ getText(lc.shadowed) }}</span></td>
                  <td class="center"><span :class="getText(lc.on_shelf).toLowerCase()">{{ getText(lc.on_shelf) }}</span></td>
                  <td class="center"><span :class="getText(lc.circulating).toLowerCase()">{{ getText(lc.circulating) }}</span></td>
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

function getText( flag ) {
   if (flag) {
      return 'Yes'
   }
   return 'No'
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
span.yes {
   background: $uva-green-A;
   padding: 0.5rem 1rem;
   border-radius: 0.3rem;
   display: inline-block;
   color: white;
   font-size: 0.9em;
   width: 50px;
}
span.no {
   background: $uva-red-A;
   padding: 0.5rem 1rem;
   border-radius: 0.3rem;
   display: inline-block;
   color: white;
   font-size: 0.9em;
   width: 50px;
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
