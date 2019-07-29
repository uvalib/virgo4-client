<template>
   <div class="hit">
      <img v-if="hit.previewURL" :src="hit.previewURL" class="preview"/>
      <table>
         <tr v-for="field in hit.basicFields" :key="getKey(field)">
            <td class="label">{{field.label}}:</td>
            <td class="value" v-html="fieldValueString(field)"></td>
         </tr>
      </table>
      <AccordionContent title="Details">
         <table>
            <tr v-for="field in hit.detailFields" :key="getKey(field)">
               <td class="label">{{field.label}}:</td>
               <td class="value" v-html="fieldValueString(field)"></td>
            </tr>
         </table>
      </AccordionContent>
      <DebugPanel v-if="hit.debug" :debugInfo="hit.debug"/>
   </div>
</template>

<script>
import AccordionContent from '@/components/AccordionContent'
import DebugPanel from "@/components/diagnostics/DebugPanel"
export default {
   props: {
      hit: { type: Object, required: true}
   },
   components: {
      DebugPanel,AccordionContent
   },
   computed: {
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
            return `<a href="${field.value}" target="_blank">${field.value}</a>`
         }
         return field.value
      },
   }
};
</script>

<style scoped>
.hit {
   width: 100%;
   border: 1px solid #ccc;
   border-top: none;
   padding: 10px;
   box-sizing: border-box;
   text-align: left;
   font-size: 0.8em;
}

img.preview {
   float:right;
}
.hit table td.label {
   font-weight: bold;
   width: 80px;
   text-align: right;
   margin-right: 10px;
   display: inline-block;
}
</style>