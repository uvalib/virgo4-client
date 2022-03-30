<template>
   <V4Modal :id="props.id" title="Extract Item Text" ref="ocrmodal"
      firstFocusID="wmail" :buttonID="`${id}-open`" @opened="opened" >
      <template v-slot:button>
         <V4Button mode="text" @click="ocrClicked" :id="`${props.id}-open`"
             :aria-label="`dowload full text for ${digitalItem.name}`" style="margin: 0 0 10px 0; font-size: 0.9em;"
         >
            Download Full Text
         </V4Button>
      </template>
      <template v-slot:content>
         <div v-if="mode=='init'" class="searching">
            <V4Spinner message="Searching for item text..." />
         </div>
         <div class="message pure-form"  v-else-if="mode=='request'">
            <p>
               We will attempt to extract the full text from '{{digitalItem.name}}'. This process
               can take several minutes to over an hour depending on the size and condition
               of the document.
            </p>
            <p>
               Please enter your email address below and you will receive an email with the extracted text when it is ready.
            </p>
            <label>Email:</label>
            <input @keyup.enter="okClicked"  id="email" type="text" v-model="email"
               @keydown.shift.tab.stop.prevent="backTabInput"
               aria-required="true" required="required"/>

         </div>
         <div class="message"  v-else-if="mode=='submitted'">
            <p>
               <b>Thank you</b>.<br/>Your request has been submitted and you will receive an email when it is ready.
               <br/>You do not need to remain on this page.
            </p>
         </div>
         <p class="error" v-if="error">{{error}}</p>
       </template>
       <template v-slot:controls>
         <V4Button v-if="mode != 'submitted'" mode="tertiary" id="ocr-cancel" @click="cancelClicked" >
            Cancel
         </V4Button>
         <V4Button mode="primary" id="ocr-ok" @click="okClicked"
            :focusNextOverride="true" @tabnext="nextTabOK"
            :focusBackOverride="true" @tabback="backTabOK">
            OK
         </V4Button>
      </template>
   </V4Modal>
</template>

<script setup>
import { ref, computed, nextTick } from "vue"
import { useItemStore } from "@/stores/item"
import { useUserStore } from "@/stores/user"
import analytics from '@/analytics'

const emit = defineEmits( ["ocr-started"] )
const props = defineProps({
   id: {
      type: String,
      required: true
   },
   dcIndex: {
      type: Number,
      required: true
   },
})

const user = useUserStore()
const item = useItemStore()

const digitalItem = computed(()=> {
   return item.digitalContent[props.dcIndex]
})

const ocrmodal = ref(null)
const email = ref("")
const error = ref("")
const mode = ref("init")

async function ocrClicked() {
   if (digitalItem.value.ocr.status == "NOT_AVAIL") {
      ocrmodal.value.show()
      analytics.trigger('OCR', 'OCR_GENERATE_CLICKED', digitalItem.value.pid)
      mode.value = "request"
      nextTick( () => {
         document.getElementById("email").focus()
      })
   } else if (digitalItem.value.ocr.status == "READY") {
      analytics.trigger('OCR', 'OCR_DOWNLOAD_CLICKED', digitalItem.value.pid)
      await item.downloadOCRText(digitalItem.value)
      mode.value = "init"
   } else {
      ocrmodal.value.show()
      analytics.trigger('OCR', 'OCR_GENERATE_CLICKED', digitalItem.value.pid)
      mode.value = "request"
      nextTick( () => {
         document.getElementById("email").focus()
      })
   }
}
function opened() {
   email.value = user.singleEmail
   error.value = ""
}
function cancelClicked() {
   ocrmodal.value.hide()
   mode.value = "init"
}
async function okClicked() {
   if ( mode.value == "submitted") {
      ocrmodal.value.hide()
      mode.value = "init"
      return
   }
   if ( mode.value == "request") {
      error.value = ""
      if ( email.value == "") {
         error.value =  "An email address is required"
         document.getElementById("email").focus()
      } else {
         await item.generateOCR( digitalItem.value, email.value )
         mode.value ="submitted"
         emit("ocr-started")
      }
   }
}
function nextTabOK() {
   if ( mode.value == "request") {
      document.getElementById("email").focus()
   } else {
      document.getElementById("ocr-ok").focus()
   }
}
function backTabOK() {
   if ( mode.value == "request") {
      document.getElementById("ocr-cancel").focus()
   } else {
      document.getElementById("ocr-ok").focus()
   }
}
function backTabInput() {
   document.getElementById("ocr-ok").focus()
}
</script>

<style lang="scss" scoped>
div.searching {
   text-align: center;
   margin-bottom: 30px;
}
label {
   font-weight: bold;
   margin-top: 20px;
   display: inline-block;
}
p.error {
   font-size: 0.9em;
   color: var(--uvalib-red-emergency);
   text-align: center;
   padding: 0;
   margin: 10px;
}
.message {
   margin: 10px 5px 0 5px;
   input {
      box-sizing: border-box;
      width:100%;
   }
}
</style>
