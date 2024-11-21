<template>
   <Dialog v-model:visible="systemStore.showMessage" :modal="true" position="top"
      :header="systemStore.message.title" @hide="dismiss" :draggable="false">
      <div class="message-body" id="msgbody" v-html="systemStore.message.content"></div>
      <div class="details" v-if="systemStore.message.detail">
         <p>Details</p>
         <div class="content" v-html="systemStore.message.detail"></div>
      </div>
   </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import { useSystemStore } from "@/stores/system"

const systemStore = useSystemStore()

const dismiss = (() => {
   systemStore.clearMessage()
})
</script>

<style lang="scss" scoped>
.message-body {
   max-height: 55vh;
   overflow-y: auto;
   text-align: left;
   padding: 0;
   font-weight: normal;
   opacity: 1;
   visibility: visible;
   text-align: left;
   word-break: break-word;
   -webkit-hyphens: auto;
   -moz-hyphens: auto;
   hyphens: auto;
}
.details {
   text-align: left;
   p {
      font-weight: bold;
      margin: 5px 0;
   }
   .content {
      padding: 5px 5px 5px 15px;
      font-family: monospace;
      font-size: 0.9em;
   }
}
</style>
