<template>
   <VirgoButton @click="openSaveClicked">Save Search</VirgoButton>
   <Dialog v-model:visible="searches.showSaveDialog" :modal="true" position="top" header="Save Search" @show="opened" :draggable="false">
      <div class="save-panel">
         <template v-if="showSignInMessage">
            <p>You must be signed in to save searches.</p>
            <p>
               <VirgoButton link @click="signInClicked" aria-label="sign in to save search" label="Sign in now" v-focus />
            </p>
         </template>
         <template v-else>
            <template v-if="saved">
               <p class="saved">Your search has been saved as '{{searchName}}'.</p>
               <p class="saved"><router-link v-focus tabindex="0" to="/searches">Manage your saved searches here</router-link></p>
            </template>
            <template v-else-if="searches.duplicate">
               <p class="saved">This search has already been saved as '{{searches.searchName}}'.</p>
               <p class="saved"><router-link v-focus tabindex="0" to="/searches">Manage your saved searches here</router-link></p>
            </template>
            <div  v-else class="message">
               <div>
                  <label for="savename">Search Name</label>
                  <input ref="savename" id="savename" type="text" v-model="searchName"
                     @keyup.enter="saveClicked" v-focus
                     aria-required="true" required="required"
                  />
               </div>
               <p class="error">{{error}}</p>
            </div>
         </template>
      </div>
      <template #footer>
         <VirgoButton v-if="showSignInMessage || saved || searches.duplicate" severity="secondary" @click="searches.showSaveDialog = false">Close</VirgoButton>
         <template v-else>
            <VirgoButton severity="secondary" @click="searches.showSaveDialog = false">Cancel</VirgoButton>
            <VirgoButton @click="saveClicked" :disabled="searches.working">Save</VirgoButton>
         </template>
      </template>
   </Dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useSearchStore } from "@/stores/search"
import { useUserStore } from "@/stores/user"
import { useQueryStore } from "@/stores/query"
import { useRestoreStore } from '@/stores/restore'
import { useRoute, useRouter } from 'vue-router'
import analytics from '@/analytics'
import Dialog from 'primevue/dialog'

const userStore = useUserStore()
const searches = useSearchStore()
const restore = useRestoreStore()
const route = useRoute()
const router = useRouter()

const showSignInMessage = ref(false)
const searchName = ref("")
const error = ref("")
const saved = ref(false)

const openSaveClicked = (() => {
   if (userStore.isSignedIn) {
      const query = useQueryStore()
      analytics.trigger('Results', 'SAVE_SEARCH', query.mode)
   } else {
      showSignInMessage.value = true
   }
   searches.showSaveDialog = true
})


const signInClicked = (() => {
   restore.setRestoreSaveSearch()
   searches.showSaveDialog = false
   router.push("/signin")
})

const opened = ( async () => {
   error.value = ""
   saved.value = false
   searchName.value = ""

   await searches.exists(userStore.signedInUser, route.fullPath)
   if ( searches.duplicate == false ) {
      let date = new Date()
      let hours = date.getHours()
      let minutes = date.getMinutes()
      let m = date.getMonth()+1
      let mStr = (""+m).padStart(2,'0')
      let day = (""+date.getDate()).padStart(2,'0')
      let timeStr = `${date.getFullYear()}-${mStr}-${day}:${hours}${minutes}`
      searchName.value = `search-${timeStr}`
   }
})

const saveClicked = (async () => {
   if ( searchName.value == "") {
      error.value = "A name is required"
      return
   }

   let searchURL = route.fullPath
   let req = {name: searchName.value, url: searchURL, isPublic: false, userID: userStore.signedInUser}
   await searches.save(req)
   saved.value = true
})
</script>

<style lang="scss" scoped>
input[type=text] {
   width: 100%;
   box-sizing: border-box;
}
label {
   display: block;
   margin: 10px 0 5px 0;
   font-weight: 500;
}
p {
   margin: 5px 0;
}
</style>
