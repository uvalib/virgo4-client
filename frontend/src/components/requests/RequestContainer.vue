<template>
   <div id="active-panel" ref="activePanel" >
      <VirgoButton severity="secondary" v-if="showReset" class="reset" @click="reset" :label="resetLabel"/>
      <OptionsPanel v-if="requestStore.activePanel == 'OptionsPanel'" />
      <SignInPanel v-if="requestStore.activePanel == 'SignInPanel'" />
      <PlaceHoldPanel v-if="requestStore.activePanel == 'PlaceHoldPanel'" />
      <PDAPanel v-if="requestStore.activePanel == 'PDAPanel'" />
      <ConfirmationPanel v-if="requestStore.activePanel == 'ConfirmationPanel'" />
      <AeonPanel v-if="requestStore.activePanel == 'AeonPanel'" />
      <ScanPanel v-if="requestStore.activePanel == 'ScanPanel'" />
      <VideoReservePanel v-if="requestStore.activePanel == 'VideoReservePanel'" />
      <ReservedPanel v-if="requestStore.activePanel == 'ReservedPanel'" />
      <p class="error" v-if="requestStore.alertText" >{{requestStore.alertText}}</p>
   </div>
</template>

<script setup>
import { onMounted, ref, watch, computed } from 'vue'
import OptionsPanel from "./panels/OptionsPanel.vue"
import SignInPanel from "./panels/SignInPanel.vue"
import PlaceHoldPanel from "./panels/PlaceHoldPanel.vue"
import PDAPanel from "./panels/PDAPanel.vue"
import AeonPanel from "./panels/AeonPanel.vue"
import ScanPanel from "./panels/ScanPanel.vue"
import VideoReservePanel from "./panels/VideoReservePanel.vue"
import ConfirmationPanel from "./panels/ConfirmationPanel.vue"
import ReservedPanel from "./panels/ReservedPanel.vue"
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"
import { useRestoreStore } from "@/stores/restore"
import { usePreferencesStore } from "@/stores/preferences"
import { storeToRefs } from 'pinia'
import { setFocusClass } from '@/utils'

const user = useUserStore()
const restore = useRestoreStore()
const preferences = usePreferencesStore()
const requestStore = useRequestStore()

const activePanel = ref(null)

// pull a ref to authorizing from the user store so it can be watched directly
const { authorizing } = storeToRefs(user)
watch(authorizing, (newValue) => {
   if (newValue == false) {
      setupActivePanel()
   }
})

const setupActivePanel = ( async () => {
   if ( user.isSignedIn) {
      await preferences.loadPreferences()
   }
   requestStore.reset()
   let restoredPanel = restore.activeRequest
   if ( restoredPanel ) {
      requestStore.activePanel = restoredPanel
      let optionSettings = requestStore.findOption(restoredPanel)
      if (optionSettings) {
         requestStore.activeOption = optionSettings
      } else {
         // selected option not found
         requestStore.alertText = "Sorry, the selected request type ("+restoredPanel.replace('Panel','')+") is not available for your account."
         requestStore.activePanel = 'OptionsPanel'
      }
      let requestPanel = activePanel.value
      requestPanel.scrollIntoView({behavior: 'smooth', block: 'center'})
      restore.clear()
   }
   if (!requestStore.activePanel){
      requestStore.activePanel = 'OptionsPanel'
   }
})

onMounted(()=>{
   setupActivePanel()
})

const reset = (() => {
   requestStore.reset()
   setFocusClass("option-button")
})

const showReset = computed(() => {
   return requestStore.activePanel != "OptionsPanel"
})
const resetLabel = computed(() => {
   if (requestStore.activePanel == 'ConfirmationPanel' || requestStore.activePanel == "ReservedPanel"){
      return "Back"
   } else {
      return "Reset"
   }
})
</script>

<style lang="scss" scoped>
#active-panel {
   padding: 10px;
   position: relative;

   .reset {
      position: absolute;
      right: 1vw;
      top: 1vw;
   }
   p.error {
      color: var(--uvalib-red-emergency);
   }
}
</style>