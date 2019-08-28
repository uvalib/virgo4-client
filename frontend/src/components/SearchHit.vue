<template>
   <div class="hit">
      <div class="bookmark-bar">
         <i @click="bookmarkClicked(hit)" class="bookmark far fa-bookmark"></i> 
      </div>
      <div class="basic">
         <table class="fields">
            <tr v-for="field in hit.basicFields" :key="getKey(field)">
               <template v-if="field.display != 'optional'">
                  <td class="label">{{field.label}}:</td>
                  <td class="value" v-html="fieldValueString(field)"></td>
               </template>
            </tr>
         </table>
         <div class="preview">
            <img v-if="hit.previewURL" :src="hit.previewURL"/>
         </div>
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
export default {
   props: {
      hit: { type: Object, required: true}
   },
   components: {
      AccordionContent
   },
   methods: {
      bookmarkClicked(hit) {
         let data = {id: "", title: "", author: ""} 
         let tgt = [hit.basicFields, hit.basicFields]
         tgt.forEach(function(fields) {
            fields.forEach(function(f) {
               if (f.name=="id") {
                  data.id = f.value
               } else if (f.name == "title") {
                  data.title = f.value
               } else if (f.name == "author") {
                  if ( Array.isArray(f.value)) {
                      data.author = f.value.join(", ")
                  } else {
                     data.author = f.value
                  }
               }
            })
         }) 
         this.$store.commit("user/showAddBookmark", data)
      },
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
   }
};
</script>

<style scoped>
div.bookmark-bar {
   padding: 6px 0 0 6px;
   float: left;
}
i.bookmark {
   color: #444; 
   cursor: pointer;
   opacity: 0.6;
   font-size: 1.4em;
}
i.bookmark:hover {
   opacity: 1;
}
div.details {
   padding: 10px 0 0 0;
}
div.basic {
   display: grid;
   grid-template-columns: minmax(250px, auto) minmax(32px, 50px);
   padding: 10px 10px 10px 10px;
}
div.preview {
   display:inline-block;
   text-align: right;
}
.hit {
   width: 100%;
   border: 1px solid #ccc;
   border-top: none;
   padding: 00px;
   box-sizing: border-box;
   text-align: left;
   font-size: 0.8em;
}
 #app td.value >>> a.pure-button.pure-button-primary.ext {
   background-color:var(--color-primary-blue);
   color: white; 
   padding: 2px 0px;
   width: 100%;
   margin: 10px 0;
}
#app td.value >>> a.pure-button.pure-button-primary.ext:hover {
   text-decoration: none;  
}
.hit .value .pure-button.ext-link:hover {
   text-decoration: none;
}
.htt table {
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
}
</style>