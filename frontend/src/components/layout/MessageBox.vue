<template>
   <transition name="message-transition"
      enter-active-class="animated faster fadeIn"
      leave-active-class="animated faster fadeOut">
      <div v-if="systemStore.hasMessage || systemStore.hasError" class="messsage-box">
         <div class="message" :role="msgRole" aria-modal="true"
            aria-labelledby="msgtitle" aria-describedby="msgbody"
            @keyup.esc="dismiss"
         >
            <div class="bar">
               <span id="msgtitle" class="title">{{systemStore.message.title}}</span>
               <V4Button aria-label="close message" mode="icon" class="remove" @click="dismiss"
                  :focusBackOverride="true" @tabback="setFocus('okbtn')"
                  id="v4-msg-close-icon"
               >
                  <i class="close-icon fal fa-window-close"></i>
               </V4Button>
            </div>
            <div class="message-body" id="msgbody" v-html="systemStore.message.content"></div>
            <div class="details" v-if="systemStore.message.detail">
               <p>Details</p>
               <div class="content" v-html="systemStore.message.detail"></div>
            </div>
            <div class="controls">
               <V4Button id="okbtn" mode="tertiary" @esc="dismiss" :tabOverride="true"
                  @click="dismiss" :focusBackOverride="true" @tabback="setFocus('v4-msg-close-icon')"
                  :focusNextOverride="true" @tabnext="setFocus('v4-msg-close-icon')"
                  aria-describedby="msgtitle msgbody okbtn"
               >
                  OK
               </V4Button>
            </div>
         </div>
      </div>
   </transition>
</template>

<script setup>
import { useSystemStore } from "@/stores/system"
import { computed, onMounted, nextTick } from 'vue'

const systemStore = useSystemStore()

const msgRole = computed( ()=> {
   if ( systemStore.message.type == "error") {
      return "alertdialog"
   }
   return "dialog"
})

function setFocus(id) {
   nextTick(()=>{
      let ele = document.getElementById(id)
      if (ele ) {
         ele.focus()
      }
   })
}

function dismiss() {
   systemStore.clearMessage()
}

onMounted(() => {
   setFocus("okbtn")
})
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
      padding: 0 30px 10px 30px;
      p {
         font-weight: bold;
         margin: 5px 0;
      }
      .content {
         padding: 5px 5px 0 15px;
         font-family: monospace;
      }
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
