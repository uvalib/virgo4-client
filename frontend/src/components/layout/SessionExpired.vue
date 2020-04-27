<template>
   <transition name="message-transition"
      enter-active-class="animated faster fadeIn"
      leave-active-class="animated faster fadeOut">
      <div v-if="sessionExpired" class="session">
         <div class="session-message">
               <div class="bar">
                  <span>Notice</span>
                  <i @click="dismiss" class="close fas fa-times-circle"></i>
               </div>
               <div class="message-body">
                  Your Virgo session has expired.<br/>Click
                  <router-link id="resignlink" @click.native="dismiss" to="/signin">here</router-link>
                  to sign in again.
               </div>
                <div class="controls">
                  <V4Button mode="primary" id="dismiss" @esc="dismiss" @click="dismiss">OK</V4Button>
               </div>
            </div>
      </div> 
   </transition>
</template>

<script>
import { mapState } from "vuex"
export default {
   watch: {
      sessionExpired (newVal, _oldVal) {
         if ( newVal ) {
            this.focusButton()
         }
      },
   },
   computed: {
      ...mapState({
         sessionExpired: state => state.system.sessionExpired,
      }),
   },
   methods: {
      focusButton() {
         setTimeout(()=>{
            let ele = document.getElementById("resignlink")
            ele.focus()
         }, 500)
      },
      dismiss() {
         this.$store.commit("system/clearSessionExpired")
      },
   },
};
</script>

<style scoped>
.controls {
   padding: 0 10px 10px 0;
   font-size: 0.9em;
   text-align: right;
}
div.messsage-box {
   position: fixed;
   left: 0;
   right: 0;
   z-index: 9999;
   top: 25%;
}
div.message {
   display: inline-block;
   text-align: center;
   background: white;
   padding: 0px;
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
   min-width: 20%;
   border-radius: 4px;
}
div.message.error {
   border: 3px solid var(--uvalib-red-emergency);
}
div.message.info {
   border: 3px solid var(--uvalib-blue-alt);
}
div.message .bar {
   padding: 5px;
   color: white;
   display: flex;
   flex-flow: row nowrap;
   align-items: center;
   justify-content: space-between;
}
div.message.error .bar {
   padding: 5px;
   background-color: var(--uvalib-red-emergency);
}
div.message.info .bar {
   padding: 5px;
   background-color: var(--uvalib-blue-alt);
}

div.message .bar .title {
   font-size: 1.25em;
   font-weight: normal;
}
div.message i.close {
   float:right;
   font-size: 1.4em;
   cursor: pointer;
   margin-left: 10px;
}

div.message.error .message-body {
   color: var(--uvalib-red-emergency);
}

.message-body {
   text-align: left;
   padding: 20px 30px;
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
</style>
