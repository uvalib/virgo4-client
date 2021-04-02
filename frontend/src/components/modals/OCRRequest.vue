<template>
   <V4Modal :id="id" title="Extract Item Text" ref="ocrmodal"
      firstFocusID="wmail" :buttonID="`${id}-open`" @opened="opened" >
      <template v-slot:button>
         <V4Button mode="text" @click="ocrClicked" :id="`${id}-open`"
             :aria-label="`dowload full text for ${item.name}`" style="margin: 0 0 10px 0; font-size: 0.9em;"
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
               We will attempt to extract the full text from '{{item.name}}'. This process
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

<script>
import { mapState } from "vuex"

export default {
   props: {
      id: {
         type: String,
         required: true
      },
      dcIndex: {
         type: Number,
         required: true
      },
   },
   computed: {
      ...mapState({
         digitalContent : state => state.item.digitalContent,
         userInfo: state => state.user.accountInfo
      }),
      item() {
         return this.digitalContent[this.dcIndex]
      }
   },
   data: function()  {
      return {
         email: "",
         error: "",
         mode: "init",
      }
   },
   methods: {
      async ocrClicked() {
         this.$refs.ocrmodal.show()
         await this.$store.dispatch("item/getOCRStatus", this.item )
         if (this.item.ocr.status == "NOT_AVAIL") {
            this.$analytics.trigger('OCR', 'OCR_GENERATE_CLICKED', this.item.pid)
            this.mode = "request"
            this.$nextTick( () => {
               document.getElementById("email").focus()
            })
         } else if (this.item.ocr.status == "READY") {
            this.$analytics.trigger('OCR', 'OCR_DOWNLOAD_CLICKED', this.item.pid)
            await this.$store.dispatch("item/downloadOCRText", this.item)
            this.$refs.ocrmodal.hide()
            this.mode = "init"
         } else {
            this.$analytics.trigger('OCR', 'OCR_GENERATE_CLICKED', this.item.pid)
            this.mode = "request"
            this.$nextTick( () => {
               document.getElementById("email").focus()
            })
         }
      },
      opened() {
         this.email = this.userInfo.email
         this.error = ""
      },
      cancelClicked() {
         this.$refs.ocrmodal.hide()
         this.mode = "init"
      },
      async okClicked() {
         if ( this.mode == "submitted") {
            this.$refs.ocrmodal.hide()
            this.mode = "init"
            return
         }
         if ( this.mode == "request") {
            this.error = ""
            if ( this.email == "") {
               this.error =  "An email address is required"
               document.getElementById("email").focus()
            } else {
               await this.$store.dispatch("item/generateOCR", {item: this.item, email: this.email})
               this.mode="submitted"
               this.$emit("ocr-started")
            }
         }
      },
      nextTabOK() {
         if ( this.mode == "request") {
            document.getElementById("email").focus()
         } else {
            document.getElementById("ocr-ok").focus()
         }
      },
      backTabOK() {
         if ( this.mode == "request") {
            document.getElementById("ocr-cancel").focus()
         } else {
            document.getElementById("ocr-ok").focus()
         }
      },
      backTabInput() {
         document.getElementById("ocr-ok").focus()
      }
   }
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
