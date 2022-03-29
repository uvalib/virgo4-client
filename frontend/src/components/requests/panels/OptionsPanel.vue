<template>
   <div class="options">
      <div class="option" v-for="option in requestStore.requestOptions" :key="option.type">
         <V4Button
            mode="tertiary"
            class="option-button"
            @click="setActive(option)"
            v-if="option.button_label"
         >{{option.button_label}}</V4Button>
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

function setActive(option) {
   let newActive = requestStore.optionMap[option.type]
   let optionSettings = requestStore.findOption(newActive)
   requestStore.alertText = ""
   if (option.type == "directLink"){
      let tab = window.open(option.create_url, '_blank')
      tab.focus()

   } else if (optionSettings.sign_in_required && !user.isSignedIn) {
      restore.setActiveRequest(newActive)
      this.requests.activePanel = "SignInPanel"
   } else {
      this.requests.activePanel = newActive
      this.requests.activeOption = optionSettings
   }
}
</script>

<style lang="scss" scoped>
.options {
   display: flex;
   flex-flow: row wrap;
   justify-content: space-between;

   .option {
      text-align: left;
      margin: 20px;

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