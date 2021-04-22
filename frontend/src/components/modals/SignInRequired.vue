<template>
   <span v-if="isKiosk==false" class="notice-container">
      <V4Modal :id="id" title="Sign In Required" ref="signinmodal"
         firstFocusID="link" :buttonID="`${id}-btn`"
      >
         <template v-slot:button>
            <V4Button v-if="act == 'bookmark'" mode="icon" @click="$refs.signinmodal.show()" :id="`${id}-btn`"
               role="button" aria-checked="false"
               :aria-label="`bookmark ${data.title}`"
            >
               <i class="disabled bookmark fal fa-bookmark trigger"></i>
            </V4Button>
            <V4Button v-else mode="primary" @click="$refs.signinmodal.show()" :id="`${id}-btn`"
               role="button" aria-checked="false" aria-label="save search"
            >
               Save Search
            </V4Button>
         </template>
         <template v-slot:content>
            <p>{{signInMessage}}</p>
            <p>Click
               <V4Button mode="text" id="link" @click="signInClicked"
                  :aria-label="signInAria" :focusBackOverride="true" @tabback="linkTabbed">
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
      data: { type: Object},
      id:  {type: String, required: true},
      act: {type: String, required: true}
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
      signInMessage() {
         if (this.act == "bookmark") {
            return "You must be signed in to use bookmarks."
         }
         return "You must be signed in to save searches."
      },
      signInAria() {
         if (this.act == "bookmark") {
            return "Sign in to bookmark item"
         }
         return "sign in to save search"
      }
   },
   methods: {
      linkTabbed() {
         this.$refs.signinmodal.firstFocusBackTabbed()
      },
      signInClicked() {
         if ( this.act == "bookmark") {
            this.$store.commit("restore/setBookmarkRecord", this.data)
         } else {
            this.$store.commit("restore/setRestoreSaveSearch")
         }
         this.$router.push("/signin")
      },
   }
};
</script>

<style lang="scss" scoped>
.notice-container {
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
