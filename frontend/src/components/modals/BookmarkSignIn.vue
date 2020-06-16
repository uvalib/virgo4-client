<template>
   <span v-if="isKiosk==false" class="bookmark-container">
      <V4Modal :id="id" title="Sign In Required" ref="bmsignin"
         firstFocusID="link" :buttonID="`${id}-btn`"
      >
         <template v-slot:button>
            <V4Button mode="icon" @click="$refs.bmsignin.show()" :id="`${id}-btn`"
               role="switch" aria-checked="false" 
               :aria-label="`bookmark ${hit.header.title}`"
            >
               <i class="disabled bookmark far fa-bookmark trigger"></i>
            </V4Button>
         </template>
         <template v-slot:content>
            <p>You must be signed in to use bookmarks.</p>
            <p>Click
               <V4Button mode="text" id="link" @click="signInClicked"
                  aria-label="Sign in to bookmark item" :focusBackOverride="true" @tabback="linkTabbed">
                  here
               </V4Button>
            to sign in.</p>
         </template>
      </V4Modal>
   </span>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   props: {
      hit: { type: Object, required: true},
      id:  {type: String, required: true},
   },
   data: function() {
      return {
         isOpen: false
      }
   },
   computed: {
      ...mapGetters({
        isKiosk: 'system/isKiosk',
      }),
   },
   methods: {
      linkTabbed() {
         this.$refs.bmsignin.firstFocusBackTabbed()
      },
      signInClicked() {
         this.$store.commit("restore/setBookmarkRecord", this.hit)
         this.$router.push("/signin")
      },
   }
};
</script>

<style lang="scss" scoped>
.bookmark-container {
   position: relative;
   display: inline-block;
   box-sizing: border-box;

   i.bookmark {
      color: #444;
      cursor: pointer;
      font-size: 1.4em;
      display: inline-block;
      box-sizing: border-box;
      &:focus {
         @include be-accessible();
      }
   }

   i.bookmark.disabled {
      color: #ccc;
   }

   i.fas.bookmark {
      color: var(--uvalib-brand-blue-light);
   }
}
</style>
