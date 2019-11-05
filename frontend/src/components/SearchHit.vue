<template>
   <div class="hit">
      <SearchHitHeader :hit="hit" :pool="pool"/>
      <div class="top">
         <div class="basic">
            <div v-if="hit.header.author" class="author">{{hit.header.author.join(", ")}}</div>
            <table class="fields">
               <tr v-for="field in hit.basicFields" :key="getKey(field)">
                  <template v-if="field.display != 'optional'">
                     <td class="label">{{field.label}}:</td>
                     <td class="value" v-html="fieldValueString(field)"></td>
                  </template>
               </tr>
            </table>
         </div>
         <router-link class="img-link" v-if="hit.grouped==false" :to="detailsURL">
            <img class="cover-img" v-if="hit.cover_image" :src="hit.cover_image"/>
         </router-link>
      </div>
      <AccordionContent v-if="details" title="Details">
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
      pool: {type: String, required: true},
      details: {type: Boolean, default: true}
   },
   components: {
      AccordionContent,SearchHitHeader
   },
   computed: {
      detailsURL() {
         return `/sources/${this.pool}/items/${this.hit.identifier}`
      },
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
.top {
   display:flex;
   flex-flow: row wrap;
   align-items: flex-start;
}
@media only screen and (min-width: 600px) {
   a.img-link {
      margin-left: auto;
   }
}
@media only screen and (max-width: 600px) {
   .top {
      justify-content: center
   }
   a.img-link {
      margin-left: initial;
   }
}
.author {
   margin-bottom: 10px;
}
a.img-link {
   display: inline-block;
}
.cover-img {
   border-radius: 3px;
   margin: 5px;
   max-height: 140px;
   max-width: 140px;
   display: inline-block;
}
div.basic {
   padding: 5px 10px 10px 10px;
}
.hit {
   width: 100%;
   padding: 10px;
   box-sizing: border-box;
   text-align: left;
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
.cover-img.small {
   max-height: 124px;
   max-width: 100px;
}

</style>
