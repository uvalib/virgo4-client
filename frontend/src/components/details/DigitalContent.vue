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
                  View full size<i class="fas fa-external-link-alt"></i>
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
            <vue-horizontal-list :items="pdfContent"
               :options="{item: {class: 'pdf', padding: 0}, navigation: {start: 576}, list: {padding:0}}"
            >
               <template v-slot:default="{item}">
                  <div class="download-card" role="button" :class="{current: isCurrent(item)}" @click.stop="viewerClicked(item)">
                     <V4ProgressBar v-if="generatePDFInProgress(item)" :id="item.name"
                        :percent="item.pdf.status" label="Generating PDF"
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
               </template>
            </vue-horizontal-list>
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
import VueHorizontalList from 'vue-horizontal-list'
export default {
   components: {
      VueHorizontalList, V4ProgressBar
   },
   data: function() {
      return {
         selectedDigitalObjectIdx: 0,
      }
   },
   watch: {
      loadingDigitalContent() {
         if (this.loadingDigitalContent == false && this.hasDigitalContent == true) {
            this.digitalContent.forEach( dc => {
               if (dc.pdf ) {
                  this.$analytics.trigger('PDF', 'PDF_LINK_PRESENTED', dc.pid)
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
         console.log(selDO)
         let idx = selDO.oEmbedURL.indexOf("/oembed")
         let url = selDO.oEmbedURL.substring(0, idx)
         url += "/view/" + selDO.pid
         console.log(url)
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
      generatePDFInProgress(item) {
         if ( !item.pdf) return false
         return !( item.pdf.status == "READY" || item.pdf.status == "ERROR" || item.pdf.status == "NOT_AVAIL" ||  item.pdf.status == "UNKNOWN")
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

         var timerID = setInterval( async () => {
             await this.$store.dispatch("item/getPDFStatus", item )
             if (item.pdf.status == "READY" || item.pdf.status == "100%") {
               clearInterval(timerID)
               window.location.href=item.pdf.url
            } else if (item.pdf.status == "ERROR" ) {
               clearInterval(timerID)
               this.store.commit('system/setError', "Sorry, the PDF for "+item.name+" is currently unavailable.")
            }
         }, 1000)
      },
   },
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
            margin: 5px 0;
         }
         span.link {
            color: var(--color-link);
            font-size:0.9em;
            display: block;
            font-weight: 500;
            margin-bottom: 5px;
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
::v-deep .pdf {
   padding-top: 0 !important;
}

</style>
