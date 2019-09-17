<template>
   <div class="hit">
      <div class="details">
         <div class="group-header">
            <span>Grouped Result</span>
            <i class="group-icon fas fa-layer-group"></i>
         </div>
         <table>
            <tr>
               <td class="label">Title:</td>
               <td class="value">{{hit.title}}</td>
            </tr>
            <tr>
               <td class="label">Author:</td>
               <td class="value">{{fieldValueString(hit.author)}}</td>
            </tr>
            <tr>
               <td class="label">Copies:</td>
               <td class="value">{{hit.count}}</td>
            </tr>
         </table>
      </div>
   </div>
</template>

<script>
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true}
   },
   components: {
   },
   computed: {
   },
   methods: {
      fieldValueString( field ) {
         if ( Array.isArray(field.value)) {
            return field.value.join(",<br>")
         }
         return field.value
      }
   }
};
</script>

<style scoped>
.hit {
   width: 100%;
   border: 1px solid #ccc;
   border-top: none;
   padding: 00px;
   box-sizing: border-box;
   text-align: left;
   font-size: 0.8em;
}
.group-header {
   display: flex;
   flex-flow: row wrap;
   align-items: center;
   justify-content: space-between;
   border-bottom: 1px solid #ddd;
   padding-bottom: 5px;
   margin-bottom: 5px;
}
i.group-icon {
   font-size: 1.5em;
}
.details {
   padding: 10px;
}
.hit table {
   table-layout: auto;
   border-collapse: collapse;
   width: 100%;
}
.hit table td.label {
   font-weight: bold;
   text-align: right;
   padding: 2px 5px;
   white-space: nowrap;
}
.hit table td.value {
   width: 100%;
   font-weight: normal;
}
</style>