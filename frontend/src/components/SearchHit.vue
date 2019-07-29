<template>
   <div class="hit">
      <img v-if="getPreviewImage()" :src="getPreviewImage()" class="preview"/>
      <table>
         <tr v-for="field in primaryFields()" :key="getKey(field)">
            <td class="label">{{field.label}}</td>
            <td class="value" v-html="fieldValueString(field)"></td>
         </tr>
      </table>
      <DebugPanel v-if="hit.debug" :debugInfo="hit.debug"/>
   </div>
</template>

<script>
import DebugPanel from "@/components/diagnostics/DebugPanel"
export default {
   props: {
      hit: { type: Object, required: true}
   },
   components: {
      DebugPanel
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
         return field.value
      },
      primaryFields() {
         let fields = []
         this.hit.fields.forEach(function (field) {
            if (field.visibility != "detailed") {
               fields.push(field)
            }
         })
         return fields
      },
      getPreviewImage() {
         let url = ""
         this.hit.fields.forEach(function (field) {
            if (field.name == "preview_url") {
               url = field.value
            }
         })
         return url
      }
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