<template>
   <VirgoButton @click="showDialog=true" ref="trigger" label="Request an item" size="small" />
   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Request Item" @show="dialogOpened">
      <SignIn v-if="props.settings.sign_in_required && !user.isSignedIn" />
      <div v-else-if="submitted == false">
         SUbMISSION FORM
      </div>
   </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
// import ConfirmationPanel from "./panels/ConfirmationPanel.vue"
import SignIn from "@/views/SignIn.vue"
import { useRestoreStore } from "@/stores/restore"
import { useRoute } from "vue-router"
import { useUserStore } from "@/stores/user"

const props = defineProps({
   settings: {
      type: Object,
      required: true
   },
   show: {
      type: Boolean,
      default: false
   }
})

const user = useUserStore()
const restore = useRestoreStore()
const route = useRoute()

const showDialog = ref(props.show)
const submitted = ref(false)

watch(() => props.show, (newVal) => {
   if ( newVal == true ) {
      showDialog.value = true
   }
})

const dialogOpened = (() =>{
   submitted.value = false
   restore.setActiveRequest("hold")
   restore.setURL(route.fullPath)
   restore.save()
})

</script>

<style lang="scss" scoped>
</style>