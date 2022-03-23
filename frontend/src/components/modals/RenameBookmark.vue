<template>
   <V4Modal :id="props.id" title="Rename Bookmark Folder" ref="renamemodal"
      firstFocusID="rename" lastFocusID="rename-ok"
      @opened="opened" :buttonID="`${props.id}-open`"
   >
      <template v-slot:button>
         <V4Button mode="icon" @click="renamemodal.show()" :id="`${props.id}-open`"
             :aria-label="`rename bookmark folder ${folderInfo.folder}`"
             style="margin: 0 5px"
         >
            <i class="rename fal fa-edit"></i>
         </V4Button>
      </template>
      <template v-slot:content>
         <div class="message pure-form">
            <input @keyup.enter="okClicked"  id="rename" type="text" v-model="folderName"
               @keydown.shift.tab.stop.prevent="backTabInput"
               aria-required="true" aria-label="new folder name" required="required"/>
         </div>
         <p class="error" v-if="error">{{error}}</p>
       </template>
       <template v-slot:controls>
         <V4Button mode="tertiary" id="rename-cancel" @click="renamemodal.hide()">
            Cancel
         </V4Button>
         <V4Button mode="primary" id="rename-ok" @click="okClicked" :focusNextOverride="true" @tabnext="nextTabOK">
            OK
         </V4Button>
      </template>
   </V4Modal>
</template>

<script setup>
import { useBookmarkStore } from "@/stores/bookmark"
import { ref } from 'vue'

const bookmarkStore = useBookmarkStore()
const props = defineProps({
   id: {
      type: String,
      required: true
   },
   folderInfo: {
      type: Object,
      required: true
   },
})

const renamemodal = ref(null)
const folderName = ref(props.folderInfo.folder)
const error = ref("")

function opened() {
   folderName.value = props.folderInfo.folder
   error.value = ""
}
async function okClicked() {
   error.value = ""
   if ( folderName.value == "") {
      error.value =  "A folder name is required"
   } else {
      await bookmarkStore.renameFolder({id: props.folderInfo.id, name: folderName.value})
      renamemodal.value.hide()
   }
}
function nextTabOK() {
   renamemodal.value.lastFocusTabbed()
}
function backTabInput() {
   renamemodal.value.firstFocusBackTabbed()
}
</script>

<style lang="scss" scoped>
i.rename {
   color: black;
   cursor: pointer;
   font-size: 1.2em;
   padding: 2px;
}
p.error {
   font-size: 0.9em;
   color: var(--uvalib-red-emergency);
   text-align: center;
   padding: 0;
   margin: 10px;
}
.message {
   margin: 10px 5px 0 5px;
   input {
      box-sizing: border-box;
      width:100%;
   }
}
</style>
