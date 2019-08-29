<template>
   <main class="bookmarks">
      <h1>Bookmarks</h1>
      <div class="bookmarks-content">
         <div class="working" v-if="lookingUp" >
            <div>Looking up account details...</div>
            <img src="../assets/spinner2.gif">
         </div>
         <div v-else>
            <p v-if="hasBookmarks == false">
               You have no bookmarked items.
            </p>
            <template v-else>
               <div class="folder" v-for="folder in Array.from(bookmarks.keys())" :key="folder">
                  <i @click="removeFolder(folder)" class="remove-folder fas fa-trash-alt"></i>
                  <AccordionContent :title="folder" align="left">
                     <div class="none" v-if="bookmarks.get(folder).length == 0">
                        There are no bookmarks in this folder.
                     </div>
                     <table v-else>
                        <tr>
                           <th/><th>Title</th><th>Author</th>
                        </tr>
                        <tr v-for="bookmark in bookmarks.get(folder)" :key="bookmark.identifier">
                           <td><i @click="removeBookmark(bookmark.identifier)" class="remove fas fa-trash-alt"></i></td>
                           <td>{{bookmark.details.title}}</td>
                           <td>{{bookmark.details.author}}</td>
                        </tr>
                     </table>
                  </AccordionContent>
               </div>
            </template>
         </div>
         <BackToVirgo />
      </div>
   </main>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import BackToVirgo from "@/components/BackToVirgo"
import AccordionContent from "@/components/AccordionContent"
export default {
   name: "bookmarks",
   components: {
      BackToVirgo,AccordionContent
   },
   data: function() {
      return {
         lookingUp: true,
      };
   },
   computed: {
      ...mapGetters({
        hasBookmarks: 'user/hasBookmarks',
        bookmarks: 'user/bookmarks'
      }),
   },
   methods: {
      removeBookmark(identifier) {
          this.$store.dispatch("user/removeBookmark", identifier)
      },
      removeFolder(folder) {
          this.$store.dispatch("user/removeFolder", folder)
      }
   },
   created() {
      this.lookingUp = true
      this.$store.dispatch("user/getBookmarks").then(_response => {
         this.lookingUp = false
      })
   }
}
</script>

<style scoped>
.remove, .remove-folder {
   color: #666;
   opacity: 0.6;
   cursor: pointer;
}
.remove:hover, .remove-folder:hover {
   opacity: 1;
}
.remove-folder {
   position: absolute;
   left: 0;
   top: 5px;
}
.bookmarks {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
.working {
   text-align: center;
   font-size: 1.25em;
}
.working img {
   margin: 30px 0;
}
div.folder {
   position: relative;
}
.bookmarks-content {
   width: 40%;
   margin: 0 auto;
}
table td, th {
  padding: 2px 8px;
  text-align: left;
}
table {
   margin: 10px;
}
div.accordion {
   margin-bottom: 15px;
   margin-left: 25px;
}
div.none {
   font-size: 1.1em;
   text-align: left;
   margin: 15px;
   color: #999;
}
</style>

