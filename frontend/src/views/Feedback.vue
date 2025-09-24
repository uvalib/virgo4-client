<template>
   <div class="feedback" v-if="!submitted">
      <FormKit type="form" id="feedback" :actions="false" @submit="submitHandler" :config="{disableRequiredDecoration: true}">
         <FormKit label="Explain what you wanted to do" id="explain" type="textarea" v-model="feedbackStore.wantedTo" validation="required" :rows="5"/>
         <FormKit label="How did it go?" type="textarea" v-model="feedbackStore.explanation" validation="required" :rows="5"/>
         <FormKit label="Contact Email" type="email" v-model="feedbackStore.email" validation="required|email"/>
         <FormKit label="Relevant URL" type="text" v-model="feedbackStore.url" validation="required"/>
         <V4FormActions :hasCancel="false" submitLabel="Leave Feedback" submitID="submit-feedback"/>
      </FormKit>
   </div>
   <div class="thanks" v-else>
      <h3>Thanks for your feedback!</h3>
      <p>We have captured your feedback and will look into any issues. We appreciate you taking the time to share this information with us.</p>
   </div>
</template>

<script setup>
import { useFeedbackStore } from "@/stores/feedback"
import { useUserStore } from "@/stores/user"
import { onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import { setFocusID } from '@/utils'

const userStore = useUserStore()
const feedbackStore = useFeedbackStore()
const route = useRoute()

const submitted = ref(false)

async function submitHandler() {
   await feedbackStore.submitFeedback()
   if ( feedbackStore.status=="success" ) {
      submitted.value = true
   }
}

onMounted(() => {
   feedbackStore.clear()
   submitted.value = false
   let query = Object.assign({}, route.query)

   setFocusID("explain")

   // Assign the url in decending usefulness.
   let url = query.url || document.referrer || window.location.origin
   feedbackStore.url = url
   userStore.getAccountInfo().then(()=>
      feedbackStore.email = userStore.singleEmail
   )
})
</script>

<style lang="scss" scoped>
.thanks {
   h3 {
      text-align: center;
      font-size: 1.3em;
      margin: 35px;
      font-weight: 500;
   }
    min-height: 400px;
}

.feedback {
   width: 60%;
   margin: 0 auto;
   text-align: left;
   padding-bottom:50px;
}

@media only screen and (min-width: 768px) {
   div.feedback {
      width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.feedback {
      width: 95%;
   }
}
</style>
