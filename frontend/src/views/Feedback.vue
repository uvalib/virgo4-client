<template>
   <div class="feedback">
      <h1>Virgo Feedback</h1>
      <V4Spinner message="Submitting feedback..." v-if="status=='submit'" v-bind:overlay="true" />
      <div v-if="status!='success'" class="feedback-content">
         <div class="feedback-form pure-form">
            <h2>Virgo 4 is being developed as the next version of the library catalog.</h2>
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
         </div>

         <div class="action-group">
            <V4Button mode="primary" @click="submit">Leave Feedback</V4Button>
         </div>
      </div>
      <div v-else>
         <div class="feedback-form">
            <h3>Thank you for your feedback!</h3> 
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
         "wantedTo", "explanation", "email"
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
               setTimeout( ()=>{
                  if ( this.$route.name == "feedback" ) {
                     this.$router.push("/")
                  }
               }, 10000)
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
   }
}
</script>

<style scoped>
.feedback {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
.feedback-content {
   width: 60%;
   margin: 0 auto;
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
.feedback-form {
   text-align: left;
}
span.alt-color-dark {
   color: var(--color-link-darker);
   font-weight: 500;
}
h2 {
   font-size: 1.1em;
   font-weight: 500;
   color: var(uvalib-text);
}
.feedback-form.pure-form label {
   font-weight: 500;
   display: block;
   margin: 20px 0 5px 0;
}
.action-group {
   text-align: right;
   margin: 15px 0 30px 0;
}
textarea, input[type=email] {
   box-sizing: content-box;
   width: 100%;
}
h3 {
   text-align: center;
   font-size: 1.3em;
   color: var(--color-primary-text);
   margin: 35px;
   font-weight: 500;
}
span.error {
   color: var(--uvalib-red-emergency);
   font-weight: 500;
   margin-left: 5px;
}
</style>
