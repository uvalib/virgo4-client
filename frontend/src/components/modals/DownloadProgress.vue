<template>
   <V4Modal :id="id" title="Download Progress" ref="progressmodal" 
      @opened="opened"
      :buttonID="`${id}-open`">
      <template v-slot:button>
         <V4Button mode="text" @click="$refs.progressmodal.show()" 
            :id="`${id}-open`"
             :aria-label="ariaLabel"
         >
            {{name}}
         </V4Button>
      </template>
      <template v-slot:content>
         <p>
            Digitial currently content is being generated.
         </p><p>
            When progress reaches 100%, this message will disappear and the download link will be active.
         </p>
         <div class="progress">
            <label>Progress:</label> 
            <div class="progress-bar-container">
               <div id="progress" class="progress-bar"></div>
            </div>
         </div>
      </template>
   </V4Modal>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   props: {
      id: {
         type: String,
         required: true
      },
      name: {
         type: String,
         default: "" 
      },
      ariaLabel: {
         type: String,
         default: ""    
      }
   },
   data: function()  {
      return {
         timerID: null,
         ready: false
      }
   },
   computed: {
      ...mapGetters({
         getPDF: 'item/getPDF',
      })
   },
   methods: {
      opened() {
         let pdf = this.getPDF(this.name)
         if ( pdf.status == "NOT_AVAIL") {
            this.$store.dispatch("item/generateDigitalContent", {name: this.name, type: "PDF"} )   
         } 

         this.timerID = setInterval( async () => {
            await this.$store.dispatch("item/getDigitalContentStatus", {name: this.name, type: "PDF"} )   
            let pdfStatus = this.getPDF(this.name).status
            if (pdfStatus == "READY") {
               pdfStatus = "100%"
               clearInterval(this.timerID)
            }
            let bar = document.getElementById("progress")
            if (bar) {
               bar.style.width = pdfStatus
            }
         }, 2000)
      },
      dlgClosed() {
         if ( this.timerID ) {
            clearInterval(this.timerID)
            this.timerID = null
         }
      }
   }
}
</script>

<style lang="scss" scoped>
.progress-bar-container {
   box-sizing: border-box;
   display: block;
   height: 20px;
   margin: 10px 0 20px 0;
   width: 100%;
   background: var(--uvalib-grey-light);
   border: 1px solid var(--uvalib-grey);
   box-shadow: inset 0 0 4px var(--uvalib-grey);
   border-radius: 2px;

   .progress-bar {
      width: 0%;
      background-color: var(--uvalib-green );
      box-shadow: inset 0 0 4px var(--uvalib-grey);
      border-radius: 2px;
      height: 100%;
      box-sizing: border-box;
      display: block;
   }
}  
</style>
