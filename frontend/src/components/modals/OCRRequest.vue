<template>
   <VirgoButton class="ocr-button" link @click="ocrClicked" ref="trigger"
      :aria-label="`dowload full text for ${digitalItem.name}`" label="Download Full Text"/>
   <Dialog v-model:visible="showDialog" :modal="true" position="top" header="Extract Item Text" @hide="closeDialog" @show="opened">
      <div v-if="mode=='init'" class="searching">
         <V4Spinner message="Searching for item text..." />
      </div>
      <div class="message" v-else-if="mode=='request'">
         <p>
            We will attempt to extract the full text from '{{digitalItem.name}}'.<br/>This process
            can take several minutes to over an hour depending on the size and condition
            of the document.
         </p>
         <p>
            Please enter your email address below and you will receive an email with the extracted text when it is ready.
         </p>
         <label>Email:</label>
         <input @keyup.enter="okClicked" id="email" type="text" v-model="email" aria-required="true" required="required"/>
      </div>
      <div class="message" v-else-if="mode=='submitted'">
         <p><b>Thank you</b>.<br/><br/>Your request has been submitted and you will receive an email when it is ready.</p>
         <p>You do not need to remain on this page.</p>
      </div>
      <p class="error" v-if="error">{{error}}</p>
      <div class="form-controls" v-if="mode!='init'" >
         <VirgoButton v-if="mode != 'submitted'" severity="secondary" @click="closeDialog" label="Cancel"/>
         <VirgoButton @click="okClicked" label="OK"/>
      </div>
   </Dialog>
</template>

<script setup>
import { ref, computed, nextTick } from "vue"
import { useItemStore } from "@/stores/item"
import { useUserStore } from "@/stores/user"
import analytics from '@/analytics'
import Dialog from 'primevue/dialog'

const emit = defineEmits( ["ocr-started"] )
const props = defineProps({
   dcIndex: {
      type: Number,
      required: true
   },
})

const user = useUserStore()
const item = useItemStore()

const trigger = ref()
const showDialog = ref(false)
const email = ref("")
const error = ref("")
const mode = ref("init")

const digitalItem = computed(()=> {
   return item.digitalContent[props.dcIndex]
})


const ocrClicked = ( async () => {
   showDialog.value = true
   if (digitalItem.value.ocr.status == "NOT_AVAIL") {
      analytics.trigger('OCR', 'OCR_GENERATE_CLICKED', digitalItem.value.pid)
      mode.value = "request"
      nextTick( () => {
         document.getElementById("email").focus()
      })
   } else if (digitalItem.value.ocr.status == "READY") {
      analytics.trigger('OCR', 'OCR_DOWNLOAD_CLICKED', digitalItem.value.pid)
      mode.value = "init"
      await item.downloadOCRText(digitalItem.value)
      showDialog.value = false
   } else {
      analytics.trigger('OCR', 'OCR_GENERATE_CLICKED', digitalItem.value.pid)
      mode.value = "request"
      nextTick( () => {
         document.getElementById("email").focus()
      })
   }
})

const opened = (() => {
   email.value = user.singleEmail
   error.value = ""
})

const closeDialog = (() => {
   showDialog.value = false
   trigger.value.$el.focus()
   mode.value = "init"
})

const okClicked = (async () => {
   if ( mode.value == "submitted") {
      closeDialog()
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
})
</script>

<style lang="scss" scoped>
.ocr-button {
   font-size: 0.9em !important;
   margin-bottom: 10px !important;;
}
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
   margin: 0;
   width: 100%;
   p {
      margin: 0 0 10px 0;
   }
   label {
      margin-top: 10px;
   }
   input {
      box-sizing: border-box;
      width:100%;
   }
}
</style>
