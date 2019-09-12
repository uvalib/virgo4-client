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
               <div class="folder" v-for="folderInfo in bookmarks" :key="folderInfo.id">
                  <ConfirmDelete
                     v-on:delete-approved="removeFolder(folderInfo.id)">
                     <div>Delete bookmark folder <b>{{folderInfo.folder}}</b>? All bookmarks</div>
                     <div>contained within it will also be deleted.</div> 
                     <div><br/>This cannot be reversed.</div>
                  </ConfirmDelete>
                  <AccordionContent :title="folderInfo.folder" align="left">
                     <div class="none" v-if="folderInfo.bookmarks.length == 0">
                        There are no bookmarks in this folder.
                     </div>
                     <table v-else>
                        <tr>
                           <th/><th>Title</th><th>Author</th><th/>
                        </tr>
                        <tr v-for="bookmark in folderInfo.bookmarks" :key="bookmark.id">
                           <td><i @click="removeBookmark(bookmark.id)" class="remove fas fa-trash-alt"></i></td>
                           <td>{{bookmark.details.title}}</td>
                           <td>{{bookmark.details.author}}</td>
                           <td>
                               <router-link :to="detailsURL(bookmark)">
                                  <i class="fas fa-search"></i>
                               </router-link>
                           </td>
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
import ConfirmDelete from "@/components/popovers/ConfirmDelete"
import BackToVirgo from "@/components/BackToVirgo"
import AccordionContent from "@/components/AccordionContent"
export default {
   name: "bookmarks",
   components: {
      BackToVirgo,AccordionContent,ConfirmDelete
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
      detailsURL(bookmark) {
         return `/sources/${bookmark.pool}/items/${bookmark.identifier}`
      },
      removeBookmark(id) {
         this.$store.dispatch("user/removeBookmark", id)
      },
      removeFolder(folderID) {
         this.$store.dispatch("user/removeFolder", folderID)
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
   color: #999;
   cursor: pointer;
   font-size: 1.2em;
   padding: 2px 8px 2px 0;
}
i.fas {
   color: #999;
   cursor: pointer;
}
div.folder {
   display: flex;
   flex-flow: row nowrap;
   align-items: flex-start;
   margin-bottom: 15px;
}
div.folder .remove-folder {
   flex: 0 0 auto;
   padding-top: 4px;
}
div.accordion {
  flex: 1 1 auto; 
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
.bookmarks-content {
   width: 60%;
   margin: 0 auto;
}
@media only screen and (min-width: 768px) {
   div.bookmarks-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.bookmarks-content  {
       width: 95%;
   }
}
table td, th {
  padding: 2px 8px;
  text-align: left;
  border-bottom: 1px solid #ccc;
}
table  th {
  background: #e5e5e5;
}
table {
   margin: 0px;
   border-bottom: 1px solid #ccc;
   width: 100%;
}
div.none {
   font-size: 1.1em;
   text-align: left;
   margin: 15px;
   color: #999;
}
</style>

