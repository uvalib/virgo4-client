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
               <td class="label">{{fieldLabel(field)}}:</td>
               <td class="value" v-html="fieldValueString(field)"></td>
            </tr>
         </table>
      </AccordionContent>
   </div>
</template>

<script>
import AccordionContent from '@/components/AccordionContent'
export default {
   props: {
      hit: { type: Object, required: true}
   },
   components: {
      AccordionContent
   },
   computed: {
   },
   methods: {
      getKey(field) {
         return field.name+field.value
      },
      fieldLabel(field) {
         if (field.label == "Access in Virgo Classic") {
            return "More"
         }
         return field.label
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
 #app td.value >>> a.pure-button.pure-button-primary.ext {
   background-color:rgb(66, 184, 221);
   color: white; 
   padding: 4px 24px;
   border-radius: 5px; 
   font-size: 0.9em;
   font-weight: bold;
}
#app td.value >>> a.pure-button.pure-button-primary.ext:hover {
   text-decoration: none;  
}
.hit .value .pure-button.ext-link:hover {
   text-decoration: none;
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