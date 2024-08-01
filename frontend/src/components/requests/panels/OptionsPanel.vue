<template>
   <div class="options">
      <div class="option" v-for="option in requestStore.requestOptions" :key="option.type">
         <VirgoButton v-if="option.button_label" severity="secondary" @click="setActive(option)" :label="option.button_label" class="option-button"/>
         <p class="desc" v-if="option.description" v-html="option.description"></p>
      </div>
   </div>
</template>

<script setup>
import { useRestoreStore } from "@/stores/restore"
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"

const requestStore = useRequestStore()
const user = useUserStore()
const restore = useRestoreStore()

const setActive =((option) => {
   let newActive = requestStore.optionMap[option.type]
   let optionSettings = requestStore.findOption(newActive)
   requestStore.alertText = ""
   if (option.type == "directLink"){
      let tab = window.open(option.create_url, '_blank')
      tab.focus()

   } else if (optionSettings.sign_in_required && !user.isSignedIn) {
      restore.setActiveRequest(newActive)
      requestStore.activePanel = "SignInPanel"
   } else {
      requestStore.activePanel = newActive
      requestStore.activeOption = optionSettings
   }
})
</script>

<style lang="scss" scoped>
.options {
   display: flex;
   flex-flow: row wrap;
   justify-content: space-between;

   .option {
      text-align: left;
      padding: 20px;
      .desc {
         max-width: 300px;
         padding: 0;
         margin: 10px 0;
         font-size: 0.95em;
         font-weight: normal;
      }
   }
}
</style>