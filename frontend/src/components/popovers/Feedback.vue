<template>
   <v-popover v-on:apply-show='clear' class="inline">
      <span class="trigger">
         <span class="alt-color-dark">Please give us your feedback.</span>
      </span>
      <div class="feedback-container" slot="popover">
         <div class="popover-header">
            <span>Virgo Feedback</span>
            <i v-close-popover class="close fas fa-times-circle"></i>
         </div>
         <div class="message">
           <div v-if="!feedback.status.success" class="feedback-form pure-form pure-form-aligned">
             <p>Virgo 4 is being developed as the next version of the library catalog.</p>
             <div class="pure-control-group">
               <label for="wantedTo">First, explain what you wanted to do.</label>
               <textarea cols="30" rows="5" name="wantedTo" v-model="wantedTo"/>
             </div>
             <div class="pure-control-group">
               <label for="explanation">How did it go?</label>
               <textarea cols="30" rows="5" name="explanation" v-model="explanation"/>
             </div>
             <div class="pure-control-group">
               <label for="email">Contact Email</label>
               <input v-model="email" type="email" name="email" />
             </div>
           </div>


           <p v-if="feedback.status.message" v-html="feedback.status.message"></p>
           <div class="action-group">
             <button v-if="!feedback.status.success" @click="submit"
               class="pure-button pure-button-primary"
               :disabled="feedback.status.submitting"
             >Leave Feedback</button>

             <span v-close-popover class="pure-button pure-button-tertiary">Close</span>
           </div>
         </div>
      </div>
   </v-popover>
</template>

<script>

import {mapState} from "vuex"
import { mapFields } from 'vuex-map-fields'

export default {
  computed: {
    ...mapState({
      feedback: state => state.feedback,
    }),
    ...mapFields(['feedback',
                 'feedback.wantedTo',
                 'feedback.explanation',
                 'feedback.email',
                 'feedback.status'
    ]),
  },
  methods: {
    submit() {
      if(this.validate()) {
        this.$store.dispatch("feedback/submitFeedback")
      }
    },
    clear() {
      this.$store.commit('feedback/clearFeedback')
      var userId = this.$store.state.user.signedInUser
      if (userId && (this.$store.state.user.sessionType == "netbadge"))
        this.feedback.email = userId + "@virginia.edu"
    },
    validate() {

      var re = /^([\w-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
      var invalidEmail = !re.test(this.email)

      if(!(this.wantedTo && this.explanation)) {
        this.status.message = "Please enter all of the fields."
        return false
      } else if (invalidEmail) {
        this.status.message = "Please enter a valid email."
      } else {
        return true
      }
    }
  }
};
</script>

<style scoped>
div.popover-header {
   padding: 6px 0px 6px 8px;
   color: white;
   background-color: var(--uvalib-grey-dark);
   font-size: 1.15em;
   font-weight: bold;
   border-radius: 5px 5px 0 0;
}
.feedback-container {
   background: white;
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
   color: var(--uvalib-text);
   font-size: 1em;
   font-weight: normal;
   display: inline-block;
   padding: 0;
   border-radius: 5px;
}
i.fas.fa-times-circle.close {
   font-size: 1.1em;
   float:right;
   margin-right: 8px;
}
i.fas.fa-times-circle.close:hover {
   opacity: 1;
   cursor: pointer;
}
div.message {
   padding: 20px;
   text-align: center;
   border-left: 1px solid var(--uvalib-grey-dark);
   border-right: 1px solid var(--uvalib-grey-dark);
   border-bottom: 1px solid var(--uvalib-grey-dark);
   border-radius: 0 0 5px 5px;
}
a.feedback {
   color: var(--color-link);
   font-weight: 500;
   text-decoration: none;
}
a.feedback:hover {
  text-decoration: underline;
}

.action-group {
  display: inline-grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 40px;
}
span.alt-color-dark {
   color: var(--color-link-darker);
   font-weight: 500;
}

</style>
