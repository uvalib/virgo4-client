<template>
   <div class="feedback">
      <V4Spinner message="Submitting feedback..." v-if="status=='submit'" v-bind:overlay="true" />
      <div v-if="status!='success'" class="feedback-content">
         <div class="feedback-form pure-form">
            <div class="pure-control-group">
               <label for="wantedTo">
                  First, explain what you wanted to do.
                  <span v-if="hasError('wantedTo')" class="error">This information is required</span>
               </label>
               <textarea rows="3" name="wantedTo" v-model="wantedTo" />
            </div>
            <div class="pure-control-group">
               <label for="explanation">
                  How did it go?
                  <span v-if="hasError('explanation')" class="error">This information is required</span>
               </label>
               <textarea rows="3" name="explanation" v-model="explanation" />
            </div>
            <div class="pure-control-group">
               <label for="email">
                  Contact Email
                  <span v-if="hasError('email')" class="error">A valid email is required</span>
               </label>
               <input v-model="email" type="email" name="email" />
            </div>
            <div class="pure-control-group">
               <label for="url">
                  Relevant URL
                  <span v-if="hasError('url')" class="error">This information is required</span>
               </label>
               <input v-model="url" name="url" />
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

<script>
import { mapState } from "vuex"
import { mapFields } from "vuex-map-fields"
export default {
   name: "feedback",
   data: function() {
      return {
         errors: [],
      };
   },
   computed: {
      ...mapState({
         status: state => state.feedback.status
      }),
      ...mapFields("feedback", [
         "wantedTo", "explanation", "email", "url"
      ])
   },
   methods: {
      hasError( val) {
         return this.errors.includes(val)
      },
      async submit() {
         if (this.validate()) {
            await this.$store.dispatch("feedback/submitFeedback")
            if ( this.status=="success" ) {
               this.scrollTop()
            }
         }
      },
      scrollTop() {
         var scrollStep = -window.scrollY / (500 / 10),
         scrollInterval = setInterval(()=> {
            if ( window.scrollY != 0 ) {
               window.scrollBy( 0, scrollStep )
            } else {
               clearInterval(scrollInterval)
            }
         },10)
      },
      validate() {
         this.errors.splice(0, this.errors.length)
         if (this.wantedTo == "" ) {
            this.errors.push("wantedTo")
         }
         if (this.explanation == ""  ) {
            this.errors.push("explanation")
         }
         if (this.email == ""  ) {
            this.errors.push("email")
         }
         if (this.url == "") {
            this.errors.push("url")
         }

         if ( this.errors.length > 0) {
            this.$store.commit("system/setError", "Required fields are missing or invalid. Please correct the errors and try again.")
            this.scrollTop()
            return false
         }

         var re = /^([\w-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/
         var invalidEmail = !re.test(this.email)
         if (invalidEmail) {
            this.$store.commit("system/setError", "Please enter a valid email")
            this.errors.push("email")
            return false
         }
         return true
      }
   },
   mounted() {
      this.$store.commit("feedback/clearFeedback")
      var userId = this.$store.state.user.signedInUser
      if (userId && this.$store.state.user.sessionType == "netbadge") {
         this.email = userId + "@virginia.edu"
      }
      let query = Object.assign({}, this.$route.query)
      // Assign the url in decending usefulness.
      let url = query.url || document.referrer || window.location.origin
      this.$store.commit("feedback/setRelatedURL", url)
   }
}
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
