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
               <V4Button aria-label="close expired dialog" mode="icon" class="remove" @click="dismiss"
                  :focusBackOverride="true" @tabback="setFocus('dismiss')"
                  id="v4-msg-close-icon"
               >
                  <i class="close-icon fal fa-window-close"></i>
               </V4Button>
            </div>
            <div class="message-body" id="msgbody">
               Your Virgo session has expired.
               <p>
                  <router-link aria-describedby="msgbody" id="resignlink" @click="dismiss" to="/signin">Sign in again.</router-link>
               </p>
            </div>
            <div class="controls">
               <V4Button mode="tertiary" id="dismiss" @esc="dismiss" @click="dismiss"
                  :focusBackOverride="true" @tabback="setFocus('resignlink')"
                  :focusNextOverride="true" @tabnext="setFocus('v4-msg-close-icon')"
                  aria-describedby="msgbody dismiss"
               >
                  OK
               </V4Button>
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
            this.setFocus("resignlink")
         }
      }
   },
   computed: {
      ...mapState({
         sessionExpired: state => state.system.sessionExpired
      })
   },
   methods: {
      setFocus(id) {
         this.$nextTick(() => {
            let ele = document.getElementById(id)
            ele.focus();
         })
      },
      dismiss() {
         this.$store.commit("system/clearSessionExpired");
      }
   },
   created() {
      this.setFocus("resignlink")
   },
};
</script>

<style lang="scss" scoped>
div.session {
   position: fixed;
   left: 0;
   right: 0;
   z-index: 5000;
   top: 30%;

   .session-message {
      display: inline-block;
      text-align: left;
      background: white;
      padding: 0px;
      box-shadow: $v4-box-shadow;
      min-width: 20%;
      max-width: 80%;
      border-radius: 5px;
      .bar {
         padding: 5px;
         color: var(--uvalib-text-dark);
         font-weight: 500;
         display: flex;
         flex-flow: row nowrap;
         align-items: center;
         justify-content: space-between;
         background-color: var(--uvalib-blue-alt-light);
         border-bottom: 2px solid var(--uvalib-blue-alt);
         border-radius: 5px 5px 0 0;
         font-size: 1.1em;
         padding: 10px;
      }

      .message-body {
         max-height: 55vh;
         overflow-y: auto;
         text-align: left;
         padding: 20px 30px 0 30px;
         font-weight: normal;
         opacity: 1;
         visibility: visible;
         text-align: center;
         word-break: break-word;
         -webkit-hyphens: auto;
         -moz-hyphens: auto;
         hyphens: auto;
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


