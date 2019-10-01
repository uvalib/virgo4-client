<template>
   <div class="hit">
      <div class="bookmark-bar">
         <BookmarkButton :hit="hit" :pool="pool"/>
      </div>
      <div class="basic">
         <router-link :to="detailsURL">
            <table class="fields">
               <tr v-for="field in hit.basicFields" :key="getKey(field)">
                  <template v-if="field.display != 'optional'">
                     <td class="label">{{field.label}}:</td>
                     <td class="value" v-html="fieldValueString(field)"></td>
                  </template>
               </tr>
            </table>
         </router-link>
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
import BookmarkButton from '@/components/BookmarkButton'
import AccordionContent from '@/components/AccordionContent'
import { mapGetters } from "vuex"
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true}
   },
   components: {
      AccordionContent,BookmarkButton
   },
   computed: {
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
        bookmarks: 'user/bookmarks'
      }),
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
            return `<a href="${field.value}" class="pure-button pure-button-primary ext" target="_blank">External Link&nbsp;&nbsp;<i class="fas fa-external-link-alt"></i></a>`
         } 
         return field.value
      },
   }
};
</script>

<style scoped>
#app .basic a {
   color: var(--color-primary-text)
}
#app .basic a:hover {
   text-decoration: none;
}
div.bookmark-bar {
   padding: 6px 0 0 6px;
   float: left;
}
div.details {
   padding: 10px;
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
   padding: 2px 5px;
   white-space: nowrap;
}
.hit table td.value {
   width: 100%;
   font-weight: normal;
}
</style>