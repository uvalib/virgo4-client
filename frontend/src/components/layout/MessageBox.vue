<template>
   <transition name="message-transition"
      enter-active-class="animated faster fadeIn"
      leave-active-class="animated faster fadeOut">
      <div v-if="hasMessage" class="messsage-box">
         <div class="message" :class="{error: type=='error', info: type=='info'}">
            <div class="bar">
               <span v-if="type=='error'" class="title">Virgo Error</span>
               <span v-ielse class="title">Virgo Message</span>
               <i @click="dismiss" class="close fas fa-times-circle"></i>
            </div>
            <div class="message-body" v-html="messageContent"></div>
         </div>
      </div>
   </transition>
</template>

<script>
import { mapState } from "vuex"
export default {
   props: {
      type: {
         type: String,
         default: "error"
      }
   },
   computed: {
      ...mapState({
         error: state => state.system.error,
         message: state => state.system.message,
      }),
      hasMessage() {
         return (this.error != "" && this.type == "error" || 
                 this.message != "" && this.type == "info")
      },
      messageContent() {
         if (this.type == "error") {
            return this.error
         }
         return this.message
      }
   },
   methods: {
      dismiss() {
         if (this.type == "error") {
            this.$store.commit("system/setError", "")
         } else {
            this.$store.commit("system/setMessage", "")
         }
      },
   },
};
</script>

<style scoped>
div.messsage-box {
   position: fixed;
   left: 0;
   right: 0;
   z-index: 5000;
   top: 35%;
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
