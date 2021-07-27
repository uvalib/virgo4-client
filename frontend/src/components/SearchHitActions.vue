<template>
   <div class="icon-wrap">
      <template v-if="showCitations">
         <div class="citation-control">
            <Citations title="Citations" :id="`citation-${hit.identifier}`" style="margin-right: 10px"
               :itemURL="hit.itemURL" format="all" buttonLabel="Cite" :from="from" :toolbarButton="true"
               :ariaLabel="`citations for ${hit.identifier}`" >
            </Citations>
         </div>
      </template>
      <V4Button v-if="from=='COLLECTION'"  mode="icon" :id="`pdf-${hit.identifier}`"
         @click="pdfClicked" :aria-label="`download pdf for ${hit.header.title}`" style="position:relative"
      >
         <vue-ellipse-progress v-if="generatePDFInProgress"
            :progress="pdfProgress" :size="32" :legend="true" thickness="10%"
            style="position: absolute; background: white; opacity:0.8; top:1px; left: -4px;"/>
         <i class="pdf fal fa-file-pdf"></i>
      </V4Button>
      <V4Button v-if="from=='DETAIL' || from=='COLLECTION'"  mode="icon" @click="shareClicked" :id="`share-${hit.identifier}`"
         :aria-label="`copy link to ${hit.header.title}`"
      >
         <i class="share fal fa-share-alt"></i>
      </V4Button>
      <div class="bm-control">
         <AddBookmark v-if="isSignedIn" :data="$utils.toBookmarkData(pool,hit,from)" :id="`bm-modal-${hit.identifier}`"/>
         <SignInRequired v-else  :data="$utils.toBookmarkData(pool,hit,from)" :id="`bm-modal-${hit.identifier}`" act="bookmark" />
      </div>
   </div>
</template>

<script>
import AddBookmark from '@/components/modals/AddBookmark'
import SignInRequired from '@/components/modals/SignInRequired'
import Citations from '@/components/modals/Citations'
import { mapGetters,mapState } from "vuex"
export default {
   props: {
      hit: {
         type: Object,
         required: true
      },
      pool: {
         type: String,
         required: true
      },
      from: {
         type: String,
         default: ""
      },
   },
   components: {
      AddBookmark,SignInRequired,Citations
   },
   computed: {
      ...mapState({
         loadingDigitalContent : state => state.item.loadingDigitalContent,
         digitalContent : state => state.item.digitalContent,
      }),
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
      }),
      showCitations() {
         if (this.from.toUpperCase() == 'SEARCH' || this.from.toUpperCase() == 'COLLECTION') {
            return true
         }
         return false
      },
      generatePDFInProgress() {
         if ( this.loadingDigitalContent ) return false
         if ( this.from !='COLLECTION' ) return false
         if ( !this.digitalContent ) return false
         let item = this.digitalContent[0]
         if ( !item ) return false
         if ( !item.pdf) return false
         return !( item.pdf.status == "READY" || item.pdf.status == "ERROR" || item.pdf.status == "FAILED" ||
            item.pdf.status == "NOT_AVAIL" ||  item.pdf.status == "UNKNOWN")
      },
      pdfProgress() {
         if ( this.loadingDigitalContent == true ) return 0
         if ( !this.digitalContent ) return 0
         let item = this.digitalContent[0]
         let status = item.pdf.status
         if (status == "READY" || status == "100%") {
            return 100
         }
         if ( status.includes("%")) {
            return parseInt(status.replace("%", ""),10)
         }
         return 0
      }
   },
   methods: {
      async pdfClicked( ) {
         let item = this.digitalContent[0]
         await this.$store.dispatch("item/getPDFStatus", item )
         if (item.pdf.status == "READY" || item.pdf.status == "100%") {
            this.$analytics.trigger('PDF', 'PDF_DOWNLOAD_CLICKED', item.pid)
            window.location.href=item.pdf.url
            return
         } else if (item.pdf.status == "ERROR") {
            this.store.commit('system/setError', "Sorry, the PDF for "+item.name+" is currently unavailable. Please try again later.")
            return
         }

         if ( item.pdf.status == "NOT_AVAIL" || item.pdf.status == "FAILED") {
            this.$analytics.trigger('PDF', 'PDF_GENERATE_CLICKED', item.pid)
            await this.$store.dispatch("item/generatePDF", item)
         }

         this.pdfTimerID = setInterval( async () => {
             await this.$store.dispatch("item/getPDFStatus", item )
             if (item.pdf.status == "READY" || item.pdf.status == "100%") {
               clearInterval(this.pdfTimerID)
               window.location.href=item.pdf.url
            } else if (item.pdf.status == "ERROR" || item.pdf.status == "FAILED") {
               clearInterval(this.pdfTimerID)
               this.store.commit('system/setError', "Sorry, the PDF for "+item.name+" is currently unavailable. Please try again later.")
            }
         }, 1000)
      },
      shareClicked() {
         this.$analytics.trigger('Results', 'SHARE_ITEM_CLICKED', this.hit.identifier)
         let URL = window.location.href
         this.$copyText(URL, undefined, (error, _event) => {
            if (error) {
               this.$store.commit("system/setError", "Unable to copy Item URL to clipboard: "+error)
            } else {
              this.$store.commit("system/setMessage", "Item URL copied to clipboard.")
            }
         })
      }
   }
}
</script>

<style lang="scss" scoped>
.v4-button {
   margin-right: 8px !important;
}
.icon-wrap {
   display: flex;
   flex-flow: row nowrap;
   margin-left: auto;
   align-content: center;
   i.share {
      color: #444;
      cursor: pointer;
      font-size: 1.4em;
      display: inline-block;
      box-sizing: border-box;
      margin: 0px;
      padding:0;
      &:hover {
         color:var(--uvalib-brand-blue-light);
      }
   }
}
i.pdf {
   color: #444;
   cursor: pointer;
   font-size: 1.6em;
   display: inline-block;
   box-sizing: border-box;
   margin: 0px;
   padding:0;
   &:hover {
      color:var(--uvalib-brand-blue-light);
   }
}
.citation-control {
   margin-right: 5px;
}
</style>
