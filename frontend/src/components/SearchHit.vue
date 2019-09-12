<template>
   <div class="hit">
      <div class="bookmark-bar" v-if="isSignedIn">
         <i @click="removeBookmarkClicked" class="bookmark fas fa-bookmark" v-if="isBookmarked"></i> 
         <i @click="addBookmarkClicked" class="bookmark far fa-bookmark" v-else></i> 
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
import AccordionContent from '@/components/AccordionContent'
import { mapGetters } from "vuex"
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true}
   },
   computed: {
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
        bookmarks: 'user/bookmarks'
      }),
      detailsURL() {
         return `/sources/${this.pool}/items/${this.hit.identifier}`
      },
      isBookmarked() {
         let found = false
         this.bookmarks.some( folder => {
            folder.bookmarks.some( item => { 
               if (item.pool == this.pool && item.identifier == this.hit.identifier) {
                  found = true
               }
               return found == true
            })
            return found == true
         })
         return found
      }
   },
   components: {
      AccordionContent
   },
   methods: {
      removeBookmarkClicked() {
         let bookmarkID = -1
         this.bookmarks.some( folder => {
            folder.bookmarks.some( item => { 
               if (item.pool == this.pool && item.identifier == this.hit.identifier) {
                  bookmarkID = item.id
                  this.$store.dispatch("user/removeBookmark", bookmarkID)
               }
               return bookmarkID != -1
            })
            return bookmarkID != -1
         })
      },
      addBookmarkClicked() {
         let data = {pool: this.pool, identifier: this.hit.identifier, title: "", author: ""} 
         let tgt = [this.hit.basicFields, this.hit.basicFields]
         tgt.forEach(function(fields) {
            fields.forEach(function(f) {
               if (f.name == "title") {
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
i.fas.bookmark {
   color: var(--color-primary-blue);
   opacity: 1;
}
i.fas.bookmark:hover {
   opacity: 0.7;
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
   font-weight: normal;
}
</style>