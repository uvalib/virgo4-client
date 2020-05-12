<template>
   <transition
      name="message-transition"
      enter-active-class="animated faster fadeIn"
      leave-active-class="animated faster fadeOut"
   >
      <div v-if="sessionExpired" class="session">
         <div class="session-message">
            <div class="bar">
               <span>Notice</span>
               <i @click="dismiss" class="close fas fa-times-circle"></i>
            </div>
            <div class="message-body">
               Your Virgo session has expired.
               <br />Click
               <router-link id="resignlink" @click.native="dismiss" to="/signin">here</router-link>&nbsp;to sign in again.
            </div>
            <div class="controls">
               <V4Button mode="primary" id="dismiss" @esc="dismiss" @click="dismiss">OK</V4Button>
            </div>
         </div>
      </div>
   </transition>
</template>

<script>
import { mapState } from "vuex";
export default {
   watch: {
      sessionExpired(newVal, _oldVal) {
         if (newVal) {
            this.focusButton();
         }
      }
   },
   computed: {
      ...mapState({
         sessionExpired: state => state.system.sessionExpired
      })
   },
   methods: {
      focusButton() {
         setTimeout(() => {
            let ele = document.getElementById("resignlink");
            ele.focus();
         }, 500);
      },
      dismiss() {
         this.$store.commit("system/clearSessionExpired");
      }
   }
};
</script>

<style lang="scss" scoped>
div.session {
   position: fixed;
   left: 0;
   right: 0;
   z-index: 5000;
   top: 30%;

   div.session-message {
      display: inline-block;
      text-align: center;
      background: white;
      padding: 0px;
      border: 2px solid var(--uvalib-brand-blue-light);
      box-shadow: $v4-box-shadow;

      .bar {
         padding: 5px;
         background-color: var(--uvalib-brand-blue-light);
         color: white;
         font-weight: bold;
         text-align: left;

         i {
            float: right;
            font-size: 1.3em;
            cursor: pointer;
            margin-left: 10px;
         }
      }

      .message-body {
         padding: 10px 15px;
         color: var(--uvalib-primary-text);
      }

      .controls {
         padding: 0 10px 10px 0;
         font-size: 0.9em;
         text-align: right;
      }
   }
}
</style>


