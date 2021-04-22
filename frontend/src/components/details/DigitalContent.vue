<template>
   <div class="digital-content">
      <div class="working" v-if="loadingDigitalContent">
         <V4Spinner message="Searching for digital content..." />
      </div>
      <div class="items" v-if="hasDigitalContent || googleBooksURL || hasExternalImages">
         <h2>View Online</h2>
         <div class="viewer" v-if="hasDigitalContent">
            <iframe :src="curioURL" style="background:black;" :width="curioWidth"  :height="curioHeight" allowfullscreen frameborder="0"/>
         </div>
         <div v-else-if="hasImage" class="img-view large" ref="viewer">
            <img :src="imageURL('med')" :data-src="imageURL('full')" class="pure-img thumb large">
            <div class="img-toolbar">
               <a target="_blank" :href="imageURL('max')">
                  View full size<i class="fal fa-external-link-alt"></i>
               </a>
            </div>
         </div>

         <template v-if="poolMode=='image'">
            <div v-if="details.related.length > 0" class="related">
               <label>Related Images</label>
               <a :href="relatedImageURL(r)"  v-for="r in details.related" :key="`r${r.id}`">
                  <img :src="`${r.iiif_image_url}/square/200,200/0/default.jpg`" />
               </a>
            </div>
         </template>

         <div v-else class="value">
            <template v-if="pdfContent.length > 0">
               <div class='do-header'>{{pdfContent.length}} Digital Object<span v-if="pdfContent.length>1">s</span></div>
               <div class="hscroller">
                  <div class="hcontent">
                     <div v-for="item in pdfContent" :key="item.pid"
                        class="download-card" role="button"
                        :class="{current: isCurrent(item)}"
                        @click.stop="viewerClicked(item)"
                     >
                        <V4ProgressBar v-if="generatePDFInProgress(item)" :id="item.name"
                           :style="{top: pdfTop(item)}"
                           :percent="item.pdf.status" label="Generating PDF"
                        />
                        <V4ProgressBar v-if="generateOCRInProgress(item)" :id="item.name"
                           :style="{top: ocrTop(item)}"
                           :percent="item.ocr.status" label="Extracting Text"
                        />
                        <img v-if="item.thumbnail" :src="item.thumbnail"/>
                        <span class="label">{{item.name}}</span>
                        <span class="link" tabindex="0"
                           @click.stop="pdfClicked(item)"
                           @keyup.stop.enter="pdfClicked(item)"
                           @keydown.space.prevent.stop="pdfClicked(item)"
                           :aria-label="`download pdf for ${item.name}`"
                        >
                           Download PDF
                        </span>
                        <OCRRequest v-if="isSignedIn && item.ocr || item.ocr && item.ocr.status == 'READY'"
                           :id="'ocr-${item.details.identifier}'"
                           :dcIndex="digitalContentIndex(item)"
                           @ocr-started="ocrStarted(item)"
                        />
                        <span class="link" tabindex="0"
                           @click.stop="viewerClicked(item)"
                           @keyup.stop.enter="viewerClicked(item)"
                           @keydown.space.prevent.stop="viewerClicked(item)"
                           :aria-label="`open ${item.name} in viewer`"
                        >
                           <i v-if="isCurrent(item)" class="fas fa-check-circle"></i>
                           Open in Viewer
                        </span>
                     </div>
                  </div>
               </div>
            </template>
         </div>

         <div class="google" v-if="googleBooksURL">
            <a :href="googleBooksURL" target="_blank" aria-label="google books preview">
               <img alt="Google Books Preview" src="//books.google.com/intl/en/googlebooks/images/gbs_preview_button1.gif"/>
            </a>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState, mapGetters } from "vuex"
import V4ProgressBar from "@/components/V4ProgressBar"
import OCRRequest from "@/components/modals/OCRRequest"
export default {
   components: {
      V4ProgressBar, OCRRequest
   },
   data: function() {
      return {
         selectedDigitalObjectIdx: 0,
         pdfTimerID: -1,
         ocrTimerID: -1
      }
   },
   watch: {
      loadingDigitalContent() {
         if (this.loadingDigitalContent == false && this.hasDigitalContent == true) {
            this.digitalContent.forEach( dc => {
               if (dc.pdf ) {
                  this.$analytics.trigger('PDF', 'PDF_LINK_PRESENTED', dc.pid)
               }
               if (dc.ocr ) {
                  this.$analytics.trigger('OCR', 'OCR_LINK_PRESENTED', dc.pid)
               }
            })
         }
      }
   },
   computed: {
      ...mapState({
         details : state => state.item.details,
         digitalContent : state => state.item.digitalContent,
         googleBooksURL : state => state.item.googleBooksURL,
         loadingDigitalContent : state => state.item.loadingDigitalContent,
         displayWidth: state => state.system.displayWidth
      }),
      ...mapGetters({
         hasDigitalContent: 'item/hasDigitalContent',
         poolDetails: 'pools/poolDetails',
         isSignedIn: 'user/isSignedIn'
      }),
      hasExternalImages() {
         let iiifField = this.details.detailFields.find( f => f.name=="iiif_image_url")
         if (iiifField) return true
         return false
      },
      pdfContent() {
         return this.digitalContent.filter( dc => dc.pdf)
      },
      poolMode() {
         let details = this.poolDetails(this.details.source)
         return details.mode
      },
      curioURL() {
         let selDO = this.digitalContent[this.selectedDigitalObjectIdx]
         let idx = selDO.oEmbedURL.indexOf("/oembed")
         let url = selDO.oEmbedURL.substring(0, idx)
         url += "/view/" + selDO.pid
         return url
      },
      curioWidth() {
         let w = 800
         if ( this.displayWidth < 800) {
            w = this.displayWidth *0.95
         }
         return w
      },
      curioHeight() {
         return this.curioWidth*0.75
      },
      hasImage() {
         let iiifField = this.details.detailFields.find( f => f.name=="iiif_image_url")
         if (iiifField) {
            return true
         }
         return false
      }
   },
   methods: {
      imageURL(size) {
         let iiifField = this.details.detailFields.find( f => f.name=="iiif_image_url")
         if (!iiifField) return ""
         if ( size == 'full') {
            return [`${iiifField.value}/full/1200,/0/default.jpg`]
         } else if (size == 'max') {
            return [`${iiifField.value}/full/full/0/default.jpg`]
         }
         return [`${iiifField.value}/full/600,/0/default.jpg`]
      },
      relatedImageURL( r ) {
         return `/sources/${this.details.source}/items/${r.id}`
      },
      viewerClicked(item) {
         this.selectedDigitalObjectIdx = this.digitalContent.findIndex( i => i.pid == item.pid)
      },
      isCurrent(item) {
         let curr = this.digitalContent[this.selectedDigitalObjectIdx]
         return (curr.pid == item.pid)
      },
      digitalContentIndex( item) {
         return this.digitalContent.findIndex( i => i.pid == item.pid)
      },
      ocrTop(item) {
         if ( this.generatePDFInProgress(item) ) {
            return "65%"
         }
         return "40%"
      },
      pdfTop(item) {
         if ( this.generateOCRInProgress(item) ) {
            return "30%"
         }
         return "40%"
      },
      generatePDFInProgress(item) {
         if ( !item.pdf) return false
         return !( item.pdf.status == "READY" || item.pdf.status == "ERROR" || item.pdf.status == "NOT_AVAIL" ||  item.pdf.status == "UNKNOWN")
      },
      generateOCRInProgress(item) {
         if ( !item.ocr) return false
         return !( item.ocr.status == "READY" || item.ocr.status == "NOT_AVAIL" ||  item.ocr.status == "UNKNOWN")
      },
      async pdfClicked( item ) {
         await this.$store.dispatch("item/getPDFStatus", item )
         if (item.pdf.status == "READY" || item.pdf.status == "100%") {
            this.$analytics.trigger('PDF', 'PDF_DOWNLOAD_CLICKED', item.pid)
            window.location.href=item.pdf.url
            return
         } else if (item.pdf.status == "ERROR" ) {
            this.store.commit('system/setError', "Sorry, the PDF for "+item.name+" is currently unavailable.")
            return
         }

         if ( item.pdf.status == "NOT_AVAIL" ) {
            this.$analytics.trigger('PDF', 'PDF_GENERATE_CLICKED', item.pid)
            await this.$store.dispatch("item/generatePDF", item)
         }

         this.pdfTimerID = setInterval( async () => {
             await this.$store.dispatch("item/getPDFStatus", item )
             if (item.pdf.status == "READY" || item.pdf.status == "100%") {
               clearInterval(this.pdfTimerID)
               window.location.href=item.pdf.url
            } else if (item.pdf.status == "ERROR" ) {
               clearInterval(this.pdfTimerID)
               this.store.commit('system/setError', "Sorry, the PDF for "+item.name+" is currently unavailable.")
            }
         }, 1000)
      },
      ocrStarted(item) {
         this.ocrTimerID = setInterval( async () => {
             await this.$store.dispatch("item/getOCRStatus", item )
             if (item.ocr.status == "READY" || item.ocr.status == "100%") {
               clearInterval(this.ocrTimerID)
               await this.$store.dispatch("item/downloadOCRText", item)
            } else if (item.ocr.status == "ERROR" ) {
               clearInterval(this.ocrTimerID)
               this.store.commit('system/setError', "Sorry, unable to extract text for "+item.name)
            }
         }, 5000)
      },
   },
   destroyed() {
      if ( this.ocrTimerID > -1) {
         clearInterval(this.ocrTimerID)
      }
      if ( this.pdfTimerID > -1) {
         clearInterval(this.pdfTimerID)
      }
   }
}
</script>
<style lang="scss" scoped>
.digital-content {
   width: 95%;
   margin: 0 auto;

   .working {
      text-align: center;
      margin: 20px 0 30px 0;
      font-size: 0.85em;
   }

   h2 {
      color: var(--color-primary-orange);
      text-align: center;
      margin: 30px 0 30px 0;
   }

   div.viewer {
      margin-bottom: 25px;
   }

   .google {
      margin-top: 25px;
   }

   div.items {
      margin: 25px 0 0 0;
      .download-card.current {
         border: 3px solid var(--uvalib-brand-blue-light);
      }
      .download-card {
         position: relative;
         display: inline-block;
         text-align: center;
         margin: 5px;
         border: 1px solid var(--uvalib-grey-light);
         padding: 15px 10px 10px 10px;
         box-shadow: $v4-box-shadow-light;
         cursor: pointer;
         min-width: 150px;
         background: white;
         &:hover {
            top: -2px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0,1);
         }

         &:focus {
            @include be-accessible();
         }

         span.label  {
            display: block;
            font-weight: 500;
            font-size:0.9em;
            margin: 10px 0;
         }
         span.link {
            color: var(--color-link);
            font-size:0.9em;
            display: block;
            font-weight: 500;
            margin: 5px 0 10px 0;
            display: flex;
            flex-flow: row nowrap;
            justify-content: center;
            align-content: center;
            align-items: center;
            display: block;
            i {
               display: inline-block;
            }
            &:hover {
               text-decoration: underline;
            }
             &:focus {
               @include be-accessible();
            }
         }

         .v4-progress-bar {
            position: absolute;
            left: 10px;
            right: 10px;
            top: 40%;
            transform: translateY(-50%);
         }
      }
   }
   .img-view {
      display: inline-block;
      margin: 0 auto;
      .img-toolbar {
         padding: 10px 0;
         text-align: right;
         a {
            font-weight: 100 !important;
            i {
               margin-left: 8px;
            }
         }
      }
   }

   div.related {
      width: 90%;
      margin: 15px auto 0 auto;
      text-align: left;
      label {
         padding:0 0 5px 0;
         border-bottom: 2px solid var(--color-brand-blue);
         margin-bottom: 10px;
         display: block;
         font-weight: 500;
      }
      a {
         display: inline-block;
         margin: 10px;
      }
      img {
         background-image: url('~@/assets/dots.gif');
         background-repeat:no-repeat;
         background-position: center center;
         min-width: 175px;
         min-height: 175px;
         background-color: rgb(252, 252, 252);
         box-shadow: $v4-box-shadow;
         &:hover {
            box-shadow: 0px 2px 8px 0 #444;
         }
      }
   }
}
.do-header {
   background: #efefef;
   border: 1px solid var(--uvalib-grey-light);
   border-bottom: 0;
   padding: 10px 0 5px 0;
   text-align: center;
}
.hscroller {
   overflow: scroll;
   background: #efefef;
   border: 1px solid var(--uvalib-grey-light);
   border-top: 0;

   .hcontent {
      display: flex;
      flex-flow: row nowrap;
      justify-content: center;
      align-items: stretch;
      padding: 0 15px 15px 15px;
   }
}
::v-deep .pdf {
   padding-top: 0 !important;
}

</style>
