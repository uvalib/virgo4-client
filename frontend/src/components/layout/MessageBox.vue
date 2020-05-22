<template>
   <transition name="message-transition"
      enter-active-class="animated faster fadeIn"
      leave-active-class="animated faster fadeOut">
      <div v-if="hasMessage" class="messsage-box">
         <div class="message" :role="msgRole" aria-modal="true" aria-labelledby="msgtitle" aria-describedby="msgbody"
            :class="{error: type=='error', info: type=='info'}" @keyup.esc="dismiss">
            <div class="bar">
               <span v-if="type=='error'" tabindex="-1" id="msgtitle" class="title" @keydown.shift.tab.prevent.stop="shiftTab">Virgo Error</span>
               <span v-else tabindex="-1" id="msgtitle" class="title" @keydown.shift.tab.prevent.stop="shiftTab">Virgo Message</span>
            </div>
            <div class="message-body" id="msgbody" v-html="messageContent"></div>
            <div class="controls">
               <V4Button v-if="type=='error'" id="okbtn" mode="tertiary" @esc="dismiss" :tabOverride="true"
                  @click="dismiss" @tabback="btnTabBack" @tabnext="btnTabNext">
                  OK
               </V4Button>
               <V4Button v-else id="okbtn" mode="primary" @esc="dismiss" :tabOverride="true" 
                  @click="dismiss" @tabback="btnTabBack" @tabnext="btnTabNext">
                  OK
               </V4Button>
            </div>
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
      msgRole() {
         if ( this.type == "error") {
            return "alertdialog"
         }
         return "dialog"
      },
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
      btnTabNext() {
         this.setFocus("msgtitle", 1)
      },
      btnTabBack() {
         this.setFocus("msgtitle", 1)
      },
      shiftTab() {
         this.setFocus("okbtn", 1)
      },
      setFocus(id, timeout) {
         if (!timeout) {
            timeout = 260
         }
         setTimeout(()=>{
            let ele = document.getElementById(id)
            if (ele ) {
               ele.focus()
            }
         }, timeout)
      },
      dismiss() {
         this.$store.commit("system/setError", "")
         this.$store.commit("system/setMessage", "")
      },
   },
   created() {
      this.setFocus("msgtitle")
   },
};
</script>

<style lang="scss" scoped>
$quarter: math.percentage(1/4);

div.messsage-box {
   position: fixed;
   left: 0;
   right: 0;
   z-index: 9999;
   top: $quarter;

   .message {
      display: inline-block;
      text-align: center;
      background: white;
      padding: 0px;
      box-shadow: $v4-box-shadow;
      min-width: 20%;
      max-width: 80%;
      border-radius: 4px;

      .bar {
         padding: 5px;
         color: white;
         display: flex;
         flex-flow: row nowrap;
         align-items: center;
         justify-content: space-between;

         .title {
            font-size: 1.25em;
            font-weight: normal;
         }

         i.close {
            float:right;
            font-size: 1.4em;
            cursor: pointer;
            margin-left: 10px;
         }
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

      .controls {
         padding: 0 10px 10px 0;
         font-size: 0.9em;
         text-align: right;
      }
   }

   .message.error {
      border: 3px solid var(--uvalib-red-emergency);
      .bar {
         padding: 5px;
         background-color: var(--uvalib-red-emergency);
      }

      .message-body {
         color: var(--uvalib-red-emergency);
      }
   }
   .message.info {
      border: 3px solid var(--uvalib-blue-alt);
      .bar {
         padding: 5px;
         background-color: var(--uvalib-blue-alt);
      }
   }
}

</style>
