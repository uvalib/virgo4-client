<template>
   <V4Disclosure id="availability-info">
      <template v-slot:summary>
         <span>{{props.label}}</span>
         <i class="icon fas fa-exclamation-triangle"></i>
      </template>
      <template v-slot:content>
         <div v-if="hasReserveInfo()" class="message">
            <span>{{mainMessage()}}</span>
            <ul>
               <li v-for="(info,idx) in messageParts()" :key="`cr${idx}`">
                  {{info}}
               </li>
            </ul>
         </div>
         <div v-else class="message" v-html="props.message">
         </div>
       </template>
   </V4Disclosure>
</template>

<script setup>

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

function hasReserveInfo() {
   return props.message.split("\n").length > 1
}
function mainMessage() {
   return props.message.split("\n")[0]
}
function messageParts() {
   let parts = props.message.split("\n")
   parts.shift()
   let out = []
   parts.forEach( p => {
      if (p.split(":")[1].trim().length > 0) {
         out.push(p)
      }

   })
   return out
}
</script>

<style lang="scss" scoped>
#availability-info {
   .icon {
      color: var(--uvalib-red);
      margin-left: 10px;
   }
   .message {
      margin: 10px 5px 10px 10px;
      padding: 0;
   }
   ul {
      margin: 10px 15px;
      padding: 0;
      list-style: none;
   }
}
</style>
