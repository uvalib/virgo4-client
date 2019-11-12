<template>
   <div class="hit">
      <SearchHitHeader :hit="hit" :pool="pool"/>
      <div class="top">
         <div class="basic">
            <div v-if="hit.header.author" class="author">{{hit.header.author.join(", ")}}</div>
            <ul class="fields">
               <li v-for="field in hit.basicFields" :key="getKey(field)">
                  <template v-if="field.display != 'optional'">
                     <label>{{field.label}}:</label>
                     <span class="value" v-html="fieldValueString(field)"></span>
                  </template>
               </li>
            </ul>
            <AccordionContent v-if="details" title="More Details" align="left-narrow">
         <div class="details">
            <ul class="fields">
               <li v-for="field in hit.detailFields" :key="getKey(field)">
                  <label>{{field.label}}:</label>
                  <span class="value" v-html="fieldValueString(field)"></span>
               </li>
            </ul>
         </div>
      </AccordionContent>
         </div>
         <router-link class="img-link" v-if="hit.grouped==false" :to="detailsURL">
            <img class="cover-img" v-if="hit.cover_image" :src="hit.cover_image"/>
         </router-link>
      </div>
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
.cover-img.small {
   max-height: 124px;
   max-width: 100px;
}

ul.fields {
   list-style: none;
   padding-left: 20px;
}
li label {
   font-weight: bold; 
   margin-right: 10px;
   color: #666;
}
</style>
