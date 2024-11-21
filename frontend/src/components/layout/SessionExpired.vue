<template>
   <Dialog v-model:visible="systemStore.sessionExpired" :modal="true" header="Notice" @hide="dismiss" position="top" :draggable="false">
      <div class="message-body">
         Your Virgo session has expired.
         <p>
            <router-link aria-describedby="msgbody" id="resignlink" @click="dismiss" to="/signin">Sign in again</router-link>
         </p>
      </div>
   </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import { useSystemStore } from "@/stores/system"

const systemStore = useSystemStore()

const dismiss = (() => {
   systemStore.sessionExpired = false
})
</script>

<style lang="scss" scoped>
</style>


