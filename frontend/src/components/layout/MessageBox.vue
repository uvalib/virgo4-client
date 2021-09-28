<template>
   <transition name="message-transition"
      enter-active-class="animated faster fadeIn"
      leave-active-class="animated faster fadeOut">
      <div v-if="hasMessage" class="messsage-box">
         <div class="message" :role="msgRole" aria-modal="true"
            aria-labelledby="msgtitle" aria-describedby="msgbody"
            @keyup.esc="dismiss"
         >
            <div class="bar">
               <span tabindex="-1" id="msgtitle" class="title" @keydown.shift.tab.prevent.stop="shiftTab">{{message.title}}</span>
               <V4Button aria-label="close message" mode="icon" class="remove" @click="dismiss"
                   :focusBackOverride="true" @tabback="closeIconTabBack"
                  id="v4-msg-close-icon">
                  <i class="close-icon fal fa-window-close"></i>
               </V4Button>
            </div>
            <div class="message-body" id="msgbody" v-html="message.content"></div>
            <div class="details" v-if="message.detail">
               <ErrorDetails :details="message.detail"/>
            </div>
            <div class="controls">
               <V4Button id="okbtn" mode="tertiary" @esc="dismiss" :tabOverride="true"
                  @click="dismiss" :focusBackOverride="true" @tabback="btnTabBack"
                  :focusNextOverride="true" @tabnext="btnTabNext">
                  OK
               </V4Button>
            </div>
         </div>
      </div>
   </transition>
</template>

<script>
import { mapState, mapGetters } from "vuex"
import ErrorDetails from "@/components/disclosures/ErrorDetails"
export default {
   components: {
      ErrorDetails
   },
   computed: {
      ...mapState({
         message: state => state.system.message,
      }),
      ...mapGetters({
         hasMessage: "system/hasMessage",
      }),
      msgRole() {
         if ( this.message.type == "error") {
            return "alertdialog"
         }
         return "dialog"
      },
   },
   methods: {
      btnTabNext() {
         this.setFocus("msgtitle", 1)
      },
      closeIconTabBack() {
         this.setFocus("msgtitle", 1)
      },
      btnTabBack() {
         this.setFocus("v4-msg-close-icon", 1)
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
         this.$store.commit("system/clearMessage")
      },
   },
   created() {
      this.setFocus("msgtitle")
   },
};
</script>

<style lang="scss" scoped>
$quarter: math.percentage(  math.div(1, 4) );

div.messsage-box {
   position: fixed;
   left: 0;
   right: 0;
   z-index: 9999;
   top: $quarter;

   .details {
      text-align: left;
      padding: 0 30px 20px 30px;
   }

   .message {
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

      .title:focus {
          @include be-accessible();
      }

      .message-body {
         max-height: 55vh;
         overflow-y: auto;
         text-align: left;
         padding: 20px 30px 0 30px;
         font-weight: normal;
         opacity: 1;
         visibility: visible;
         text-align: left;
         word-break: break-word;
         -webkit-hyphens: auto;
         -moz-hyphens: auto;
         hyphens: auto;
         color: var(--uvalib-primary-text);
      }

      .controls {
         padding: 15px 10px 10px 0;
         font-size: 0.9em;
         text-align: right;
      }
   }
}

</style>
