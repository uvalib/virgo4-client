<template>
   <span v-if="systemStore.isKiosk==false" class="notice-container">
      <V4Modal :id="props.id" title="Sign In Required" ref="signinmodal"
         firstFocusID="link" :buttonID="`${props.id}-btn`"
      >
         <template v-slot:button>
            <V4Button v-if="act == 'bookmark'" mode="icon" @click="$refs.signinmodal.show()" :id="`${props.id}-btn`"
               role="switch" aria-checked="false"
               :aria-label="`bookmark ${props.data.title}`"
            >
               <i class="disabled bookmark fal fa-bookmark trigger"></i>
            </V4Button>
            <V4Button v-else mode="primary" @click="$refs.signinmodal.show()" :id="`${props.id}-btn`"
               role="button" aria-label="save search"
            >
               Save Search
            </V4Button>
         </template>
         <template v-slot:content>
            <p>{{signInMessage}}</p>
            <p><V4Button mode="text" id="link" @click="signInClicked"
                  :aria-label="signInAria" :focusBackOverride="true" @tabback="linkTabbed">
                  Sign in now
               </V4Button></p>
         </template>
      </V4Modal>
   </span>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRestoreStore } from '@/stores/restore'
import { useSystemStore } from '@/stores/system'
import { useRouter } from 'vue-router'

const props = defineProps({
   data: { type: Object},
   id:  {type: String, required: true},
   act: {type: String, required: true}
})

const router = useRouter()
const restore = useRestoreStore()
const systemStore = useSystemStore()
const signInMessage = computed( ()=> {
   if (props.act == "bookmark") {
      return "You must be signed in to use bookmarks."
   }
   return "You must be signed in to save searches."
})
const signInAria = computed( ()=> {
   if (props.act == "bookmark") {
      return "Sign in to bookmark item"
   }
   return "sign in to save search"
})

function linkTabbed() {
   ref.signinmodal.firstFocusBackTabbed()
}
function signInClicked() {
   if ( props.act == "bookmark") {
      restore.setBookmarkRecord(props.data)
   } else {
      restore.setRestoreSaveSearch()
   }
   router.push("/signin")
}
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
