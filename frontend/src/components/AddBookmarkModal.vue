<template>
   <div class="add-bookmark">
      <div class="modal-title">
         Add Bookmark
      </div>
      <div class="working" v-if="lookingUp" >
         <div>Loading...</div>
         <img src="../assets/spinner2.gif">
      </div>
      <div class="content">
         <div>{{newBookmark.id}}</div>
         <div><b>{{newBookmark.title}}</b> - {{newBookmark.author}}</div>
      </div>
      <div class="controls">
         <span @click="cancelBookmark" class="pure-button pure-button-secondary">Cancel</span>
         <span @click="okBookmark" class="pure-button pure-button-primary">OK</span>  
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
export default {
   data: function() {
      return {
         lookingUp: true,
      };
   },
   computed: {
      ...mapState({
         newBookmark: state => state.user.newBookmarkInfo,
      }),
   },
   methods: {
      okBookmark() {
         this.$store.commit("user/closeAddBookmark")
      },
      cancelBookmark() {
         this.$store.commit("user/closeAddBookmark")
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
div.add-bookmark {
   position: fixed;
   width: 40%;
   height: auto;
   top: 15%;
   z-index: 2000;
   background: white;
   left: 50%;
   transform: translate(-50%, 0%);
   box-shadow: 1px 1px 10px #444;
   border-radius: 5px;
}
div.content {
   padding: 10px;
   text-align: left;
}
div.modal-title {
   background: var(--color-primary-orange);
   font-size: 1.1em;
   color:white; 
   font-weight: bold;
   padding: 4px; 
   border-radius: 5px 5px 0 0;
}
div.controls {
   padding: 10px;
   text-align: right;
}
div.controls .pure-button {
   padding: 4px 16px;

}
</style>
