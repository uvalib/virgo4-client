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
               <AccordionContent v-for="folder in Object.keys(bookmarks)"  :title="folder" :key="folder" align="left">
                  <p>{{bookmarks[folder]}}</p>
               </AccordionContent>
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
      ...mapState({
         info: state => state.user.accountInfo,
      }),
      ...mapGetters({
        hasAccountInfo: 'user/hasAccountInfo',
        hasBookmarks: 'user/hasBookmarks',
        bookmarks: 'user/bookmarks'
      }),
   },
   methods: {
   },
   created() {
      if (this.hasAccountInfo ==  false) {
         this.$store.dispatch("user/getAccountInfo").then(_response => {
            this.lookingUp = false
         })
      } else {
         this.lookingUp = false
      }
   }
}
</script>

<style scoped>
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
   width: 40%;
   margin: 0 auto;
}
.details {
   text-align: left;
}
</style>

