<template>
   <Dialog v-model:visible="systemStore.sessionExpired" :modal="true" header="Notice" @hide="dismiss" position="top">
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
.message-body {
   max-height: 55vh;
   overflow-y: auto;
   text-align: left;
   padding: 20px 30px 0 30px;
   font-weight: normal;
   opacity: 1;
   visibility: visible;
   text-align: center;
   word-break: break-word;
   -webkit-hyphens: auto;
   -moz-hyphens: auto;
   hyphens: auto;
   color: var(--uvalib-primary-text);
}
</style>


