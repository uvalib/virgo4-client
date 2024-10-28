<template>
   <div class="availability-info">
      <DisclosureButton @clicked="clicked">
         <span class="btn-txt">{{props.label}}</span>
         <i class="icon fas fa-exclamation-triangle"></i>
      </DisclosureButton>

      <Popover ref="availability" class="border">
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
      </Popover>
   </div>
</template>

<script setup>
import DisclosureButton from "@/components/disclosures/DisclosureButton.vue"
import Popover from 'primevue/popover'
import { ref } from 'vue'

const availability = ref(null)

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

const clicked = ((event) => {
   availability.value.toggle(event)
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

<style lang="scss">
div.availability-info {
   .icon {
      color: $uva-red;
      margin-left: 10px;
   }
}
div.avail-message-panel {
   padding: 0;
   background: $uva-blue-alt-300;
   max-width: 400px;
   font-size: 0.9em;;

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
