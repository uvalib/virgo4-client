<template>
   <V4Modal id="save-modal" ref="savemodal" title="Save Search"
      firstFocusID="savename" lastFocusID="save-ok" buttonID="save-modal-open" @opened="opened">
       <template v-slot:button>
         <V4Button mode="primary" @click="openSaveClicked()" id="save-modal-open" aria-label="save search">
            Save Search
         </V4Button>
      </template>
      <template v-slot:content>
         <div v-if="working" class="message working">
            <V4Spinner message="Working..."/>
         </div>
         <template v-else>
            <template v-if="saved">
               <p class="saved">Your search has been saved as '{{searchName}}'.</p>
               <p class="saved"><router-link id="savename" tabindex="0" to="/searches">Manage your saved searches here</router-link></p>
            </template>
            <template v-else-if="duplicateSave">
               <p class="saved">This search has already been saved as '{{searchName}}'.</p>
               <p class="saved"><router-link id="savename" tabindex="0" to="/searches">Manage your saved searches here</router-link></p>
            </template>
            <div  v-else class="message">
               <div>
                  <label for="savename">Search Name</label>
                  <input ref="savename" id="savename" type="text" v-model="searchName"
                     @keyup.enter="saveClicked"
                     @keydown.shift.tab.stop.prevent="backTabName"
                     aria-required="true" required="required"
                  />
               </div>
               <p class="error">{{error}}</p>
            </div>
         </template>
      </template>
      <template v-if="saved == false && duplicateSave == false" v-slot:controls>
         <V4Button mode="tertiary" @click="cancelClicked">Cancel</V4Button>
         <V4Button mode="primary" id="save-ok" @click="saveClicked" :focusNextOverride="true" @tabnext="nextTabOK">Save</V4Button>
      </template>
   </V4Modal>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useSearchStore } from "@/stores/search"
import { useUserStore } from "@/stores/user"
import { useQueryStore } from "@/stores/query"
import { useRoute } from 'vue-router'
import analytics from '@/analytics'

const userStore = useUserStore()
const searches = useSearchStore()
const route = useRoute()

const savemodal = ref (null)
const searchName = ref("")
const error = ref("")
const saved = ref(false)
const working = ref(false)
const lastSavedURL = ref("")
const duplicateSave = ref(false)

function openSaveClicked() {
   const query = useQueryStore()
   analytics.trigger('Results', 'SAVE_SEARCH', query.mode)
   savemodal.value.show()
}
function cancelClicked() {
   savemodal.value.hide()
}
function backTabName() {
   savemodal.value.firstFocusBackTabbed()
}
function nextTabOK() {
   savemodal.value.lastFocusTabbed()
}
function opened() {
   error.value = ""
   saved.value = false
   if ( route.fullPath == lastSavedURL.value) {
      duplicateSave.value = true
   } else {
      let date = new Date()
      let hours = date.getHours()
      let minutes = date.getMinutes()
      let m = date.getMonth()+1
      let mStr = (""+m).padStart(2,'0')
      let day = (""+date.getDate()).padStart(2,'0')
      let timeStr = `${date.getFullYear()}-${mStr}-${day}:${hours}${minutes}`
      searchName.value = `search-${timeStr}`

      nextTick( () => {
         const input = document.getElementById('savename')
         input.focus()
         input.select()
      })
   }
}
async function saveClicked() {
   if ( searchName.value == "") {
         error.value = "A name is required"
      return
   }
   working.value = true
   let searchURL = route.fullPath
   let req = {name: searchName.value, url: searchURL, isPublic: false, userID: userStore.signedInUser}
   try {
      searches.save(req)
      saved.value = true
      working.value = false
      lastSavedURL.value = searchURL
      duplicateSave.value = false
      nextTick( () => {
         document.getElementById("savename").focus()
      })
   } catch(err) {
      error.value = err.message
      working.value = false
      duplicateSave.value = false
      saved.value = false
   }
}
</script>

<style lang="scss" scoped>
input[type=text] {
   width: 350px;
}
label {
   display: block;
   margin: 10px 0 5px 0;
   font-weight: 500;
}
#manage {
   font-weight: 500;
   color: var(--color-link);
   cursor: pointer;
   display: inline-block;
   text-decoration:none;
}
#manage:hover {
   text-decoration:underline;
}
.saved{
   margin:0;
   padding: 5px 10px;
}
</style>
