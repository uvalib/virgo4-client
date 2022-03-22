<template>
   <div class="feedback">
      <V4Spinner message="Submitting feedback..." v-if="feedbackStore.status=='submit'" v-bind:overlay="true" />
      <div v-if="feedbackStore.status!='success'" class="feedback-content">
         <div class="feedback-form pure-form">
            <div class="pure-control-group">
               <label for="wantedTo">
                  First, explain what you wanted to do.
                  <span v-if="hasError('wantedTo')" class="error">This information is required</span>
               </label>
               <textarea rows="3" name="wantedTo" v-model="feedbackStore.wantedTo" />
            </div>
            <div class="pure-control-group">
               <label for="explanation">
                  How did it go?
                  <span v-if="hasError('explanation')" class="error">This information is required</span>
               </label>
               <textarea rows="3" name="explanation" v-model="feedbackStore.explanation" />
            </div>
            <div class="pure-control-group">
               <label for="email">
                  Contact Email
                  <span v-if="hasError('email')" class="error">A valid email is required</span>
               </label>
               <input v-model="feedbackStore.email" type="email" name="email" />
            </div>
            <div class="pure-control-group">
               <label for="url">
                  Relevant URL
                  <span v-if="hasError('url')" class="error">This information is required</span>
               </label>
               <input v-model="feedbackStore.url" name="url" />
            </div>
         </div>

         <div class="action-group">
            <V4Button mode="primary" @click="submit">Leave Feedback</V4Button>
         </div>
      </div>
      <div v-else>
         <div class="feedback-form">
            <h3>Thanks for your feedback!</h3>
            <p>We have captured your feedback and will look into any issues. We appreciate you taking the time to share this information with us.</p>
         </div>
      </div>
   </div>
</template>

<script setup>
import { useFeedbackStore } from "@/stores/feedback"
import { useUserStore } from "@/stores/user"
import { useSystemStore } from "@/stores/system"
import { onMounted, ref } from "vue"
import { useRoute } from "vue-router"

const userStore = useUserStore()
const feedbackStore = useFeedbackStore()
const systemStore = useSystemStore()
const route = useRoute()
const errors = ref([])

function hasError( val) {
   return errors.value.includes(val)
}
async function submit() {
   if (validate()) {
      await feedbackStore.submitFeedback()
      if ( feedbackStore.status=="success" ) {
         scrollTop()
      }
   }
}
function scrollTop() {
   var scrollStep = -window.scrollY / (500 / 10),
   scrollInterval = setInterval(()=> {
      if ( window.scrollY != 0 ) {
         window.scrollBy( 0, scrollStep )
      } else {
         clearInterval(scrollInterval)
      }
   },10)
}
function validate() {
   errors.value.splice(0, errors.value.length)
   if (feedbackStore.wantedTo == "" ) {
      errors.value.push("wantedTo")
   }
   if (feedbackStore.explanation == ""  ) {
      errors.value.push("explanation")
   }
   if (feedbackStore.email == ""  ) {
      errors.value.push("email")
   }
   if (feedbackStore.url == "") {
      errors.value.push("url")
   }

   if ( errors.value.length > 0) {
      systemStore.setError("Required fields are missing or invalid. Please correct the errors and try again.")
      scrollTop()
      return false
   }

   var re = /^([\w-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/
   var invalidEmail = !re.test(feedbackStore.email)
   if (invalidEmail) {
       systemStore.setError("Please enter a valid email")
      errors.value.push("email")
      return false
   }
   return true
}

onMounted(() => {
   feedbackStore.clear()
   let query = Object.assign({}, route.query)

   // Assign the url in decending usefulness.
   let url = query.url || document.referrer || window.location.origin
   feedbackStore.url = url
   userStore.getAccountInfo().then(()=>
      feedbackStore.email = userStore.singleEmail
   )
})
</script>

<style lang="scss" scoped>
.feedback {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);

   .feedback-content {
      width: 60%;
      margin: 0 auto;
      text-align: left;

      .feedback-form.pure-form label {
         font-weight: 500;
         display: block;
         margin: 20px 0 5px 0;
      }
      .action-group {
         text-align: right;
         margin: 15px 0 30px 0;
      }
      textarea, input {
         box-sizing: border-box;
         width: 100%;
      }
      span.error {
         color: var(--uvalib-red-emergency);
         font-weight: 500;
         margin-left: 5px;
      }
   }
   h3 {
      text-align: center;
      font-size: 1.3em;
      color: var(--color-primary-text);
      margin: 35px;
      font-weight: 500;
   }
}

@media only screen and (min-width: 768px) {
   div.feedback-content {
      width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.feedback-content {
      width: 95%;
   }
}
</style>
