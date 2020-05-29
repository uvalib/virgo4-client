<template>
   <V4Popover class="download-progress" id="download" title="Download Progress" maxWidth="350px"
      alabel="download progress" @opened="popoverOpened" @closed="popoverClosed">
      <template v-slot:trigger>
        {{name}}
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
   </V4Popover>
</template>

<script>
import { mapGetters } from "vuex"
export default {
   props: {
      name: {
         type: String,
         required: true
      },
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
      popoverOpened() {
         let pdf = this.getPDF(this.name)
         if ( pdf.status == "NOT_AVAIL") {
            this.$store.dispatch("item/generateDigitalContent", {name: this.name, type: "PDF"} )   
         } 

         this.timerID = setInterval( async () => {
            await this.$store.dispatch("item/getDigitalContentStatus", {name: this.name, type: "PDF"} )   
            let pdfStatus = this.getPDF(this.name).status
            if (pdfStatus == "READY") {
               pdfStatus = "100%"
            }
            let bar = document.getElementById("progress")
            if (bar) {
               bar.style.width = pdfStatus
            }
         }, 2000)
      },
      popoverClosed() {
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
   height: 15px;
   width: 100%;
   background: var(--uvalib-grey-light);
   margin: 10px 0 0 0;
   border: 1px solid var(--uvalib-grey);
   box-shadow: inset 0 0 4px var(--uvalib-grey-dark);
   border-radius: 3px;

   .progress-bar {
      width: 0%;
      background-color: var(--uvalib-green );
      box-shadow: inset 0 0 4px var(--uvalib-grey-dark);
      border-radius: 3px;
      height: 100%
   }
}  
</style>
