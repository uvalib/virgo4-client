<template>
   <div>
      <div v-if="user.isBarred" class="standing-info">
         Your account is suspended until all bills are paid and/or the overdue items are returned.
         <br />If you need assistance, please email
         <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a>.
      </div>
      <V4Spinner v-else message="Sending Order..."></V4Spinner>
   </div>
</template>

<script setup>
import { onMounted } from "vue"
import { useRequestStore } from "@/stores/request"
import { useUserStore } from "@/stores/user"
import analytics from '@/analytics'

const request = useRequestStore()
const user = useUserStore()

onMounted(() => {
   // This component only exists to send the direct link action for the active option
   if (!user.isBarred) {
      request.sendDirectLink()
      analytics.trigger('Requests', 'REQUEST_STARTED', "pda")
   }
})
</script>

<style lang="scss" scoped>
.standing-info {
   font-size: 1em;
   font-weight: bold;
   text-align: center;
   padding: 10px;
   margin: 50px 0;
   border-radius: 5px;
   color: var(--uvalib-text);
   background-color: var(--uvalib-red-lightest);
}
</style>
