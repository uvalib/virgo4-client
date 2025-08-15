<template>
   <VirgoButton severity="secondary" variant="outlined" ref="trigger" @click="showDialog = true">
      <i class="icon fas fa-exclamation-triangle"></i>
      {{props.label}}
   </VirgoButton>
   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Availability Info" @hide="closeDialog" :draggable="false">
      <div class="avail-message-panel">
         <div v-if="hasReserveInfo()" class="message">
            <span>{{mainMessage()}}</span>
            <ul>
               <li v-for="(info,idx) in messageParts()" :key="`cr${idx}`">
                  {{info}}
               </li>
            </ul>
         </div>
         <div v-else class="message" v-html="props.message"></div>
      </div>
   </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import { ref } from 'vue'

const showDialog = ref(false)
const trigger = ref(null)

const props = defineProps({
   label: {
      type: String,
      required: true,
   },
   message: {
      type: String,
      reqtired: true
   }
})

const closeDialog = (() => {
   showDialog.value = false
   trigger.value.$el.focus()
})

const hasReserveInfo = (() => {
   return props.message.split("\n").length > 1
})

const mainMessage = (() => {
   return props.message.split("\n")[0]
})

const messageParts = (() => {
   let parts = props.message.split("\n")
   parts.shift()
   let out = []
   parts.forEach( p => {
      if (p.split(":")[1].trim().length > 0) {
         out.push(p)
      }

   })
   return out
})
</script>

<style lang="scss" scoped>
.icon {
   color: $uva-brand-orange;
   font-size: 1.25em;
}
div.avail-message-panel {
   padding: 0;
   max-width: 400px;
   font-size: 1em;

   .message {
      padding: 10px;
   }
   ul {
      margin: 10px 15px;
      padding: 0;
      list-style: none;
   }
}
</style>
