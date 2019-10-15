<template>
   <div class="hit">
      <div class="basic">
         <SearchHitHeader :hit="hit" :pool="pool"/>
         <div v-if="hit.basicFields.length > 0" class="sep"></div>
         <table class="fields">
            <tr v-for="field in hit.basicFields" :key="getKey(field)">
               <template v-if="field.display != 'optional'">
                  <td class="label">{{field.label}}:</td>
                  <td class="value" v-html="fieldValueString(field)"></td>
               </template>
            </tr>
         </table>
      </div>
      <AccordionContent title="Details">
         <div class="details">
            <table class="fields">
               <tr v-for="field in hit.detailFields" :key="getKey(field)">
                  <td class="label">{{field.label}}:</td>
                  <td class="value" v-html="fieldValueString(field)"></td>
               </tr>
            </table>
         </div>
      </AccordionContent>
   </div>
</template>

<script>
import AccordionContent from '@/components/AccordionContent'
import SearchHitHeader from '@/components/SearchHitHeader'
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true}
   },
   components: {
      AccordionContent,SearchHitHeader
   },
   methods: {
      getKey(field) {
         return field.name+field.value
      },
      fieldValueString( field ) {
         if ( Array.isArray(field.value)) {
            return field.value.join(", ")
         }
         if (field.type == "url") {
            return `<a href="${field.value}" target="_blank"><i style="margin-right:5px;" class="more fas fa-link"></i>External Link</a>`
         } 
         return field.value
      },
   }
};
</script>

<style scoped>
div.details {
   padding: 10px;
}
.sep {
   border-top:1px solid #ccc;
   margin: 10px 0;
}
div.basic {
   padding: 10px 10px 10px 10px;
}
.hit {
   width: 100%;
   border: 1px solid #ccc;
   border-top: none;
   padding: 00px;
   box-sizing: border-box;
   text-align: left;
   font-size: 0.8em;
   background-color: white;
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
.hit table {
   table-layout: auto;
   border-collapse: collapse;
   width: 100%;
}
.hit table td.label {
   font-weight: bold;
   text-align: right;
   padding: 0 7px;
   white-space: nowrap;
   vertical-align: text-top;
}
.hit table td.value {
   width: 100%;
   font-weight: normal;
}
</style>