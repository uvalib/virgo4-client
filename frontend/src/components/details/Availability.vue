<template>
   <div class="availability">
      <div class="working" v-if="availability.searching" >
         <V4Spinner message="Loading Availability..."/>
      </div>
      <div class="availability-content" v-if="showAvailability">
         <h2>Availability</h2>
         <div class="ra-box ra-fiy" v-if="hasItems || hasRequestOptions">
            <strong>Please note that stacks browsing is not available because of building restrictions due to COVID-19.</strong>
            Many items are available for pickup. To make a request, sign in and use the "Request" button in the item record.
            If you have questions, or need help accessing materials, use Ask a Librarian web chat.
            <a href="https://www.library.virginia.edu/news/covid-19/" target="_blank">Learn more about Library resources during COVID-19</a>.
         </div>
         <div class="ra-box ra-fiy" v-if="availabilityStatement" v-html="availabilityStatement"></div>
         <div class="ra-box ra-fiy" v-if="accessRestriction" v-html="accessRestriction"></div>

         <p class="error" v-if="availability.error" v-html="availability.error"></p>

         <div class="digital-content">
            <div class="pdfs" v-if="hasPDFContent">
               <label>Download PDF:</label>
               <div class="value">
                  <vue-horizontal-list :items="pdfs"
                     :options="{item: {class: 'pdf', padding: 0}}">
                     <template v-slot:default="{item}">
                        <div class="download-card">
                           <a v-if="item.status=='READY'" :href="item.url" :aria-label="`download pdf for ${item.name}`" class="pdf-download">
                              <img v-if="item.thumbnail" :src="item.thumbnail"/>
                              <span class="label">{{item.name}}</span>
                           </a>
                           <DownloadProgress v-else :name="item.name" :id="`${details.identifier}-pdf${item.name}`"
                              :thumb="item.thumbnail"
                              :ariaLabel="`download pdf for ${item.name}`"
                           />
                        </div>
                     </template>
                  </vue-horizontal-list>
               </div>
            </div>
            <div class="google" v-if="googleBooksURL">
               <a :href="googleBooksURL" target="_blank" aria-label="google books preview">
                  <img alt="Google Books Preview" src="//books.google.com/intl/en/googlebooks/images/gbs_preview_button1.gif"/>
               </a>
            </div>
         </div>

         <BoundWithItems v-if="hasBoundWithItems"/>

         <div class="items" v-if="hasItems || hasRequestOptions">
            <RequestContainer :titleId="titleId" />
            <ul class="holdings" v-if="details.holdings">
               <li v-for="(lib, idx) in details.holdings.libraries" :key="`lib${idx}`">
                  {{lib.library}}
                  <ul class="location">
                     <li v-for="(loc, lidx) in lib.locations" :key="`loc${lidx}`">
                        {{loc.location}}
                        <ul class="call">
                           <li v-for="(cn, cidx) in loc.call_numbers" :key="`cn${cidx}`">
                              {{cn.call_number}}
                              <ul class="copy">
                                 <li>{{cn.text.join(" ")}}</li>
                              </ul>
                           </li>
                        </ul>
                     </li>
                  </ul>
               </li>
            </ul>
            <table class="fields" v-if="hasItems">
               <thead>
                  <tr>
                     <th>Library</th>
                     <th>Current Location</th>
                     <th>Call Number</th>
                     <th>Barcode</th>
                  </tr>
               </thead>

               <tr v-for="(item,idx) in availability.items" :key="`val-${idx}`">
                  <td class="value">{{formatValue(item.library)}}</td>
                  <td class="value">{{formatValue(item.current_location)}}</td>
                  <td class="value">{{formatValue(item.call_number)}}</td>
                  <td class="value">
                     <template v-if="item.notice">
                        <AvailabilityNotice :label="formatValue(item.barcode)" :message="item.notice" />
                     </template>
                     <template v-else>
                        {{formatValue(item.barcode)}}
                     </template>
                  </td>
               </tr>
            </table>
         </div>
      </div>
   </div>
</template>

<script>
import { mapGetters } from "vuex"
import { mapState } from "vuex"
import AvailabilityNotice from "@/components/disclosures/AvailabilityNotice"
import RequestContainer from "@/components/requests/RequestContainer"
import BoundWithItems from "@/components/details/BoundWithItems"
import DownloadProgress from '@/components/modals/DownloadProgress'
import VueHorizontalList from 'vue-horizontal-list'
export default {
  components: {
    AvailabilityNotice, RequestContainer, BoundWithItems, DownloadProgress, VueHorizontalList
  },
   props: {
      titleId: String
   },
   computed: {
      showAvailability() {
         return this.availability.searching == false && (this.hasItems || this.hasRequestOptions ||
            this.hasPDFContent || this.googleBooksURL != "" || this.availabilityFields.length > 0 )
      },
      ...mapState({
         details : state => state.item.details,
         googleBooksURL : state => state.item.googleBooksURL,
      }),
      ...mapGetters({
         availability: 'item/availability',
         isDevServer: 'system/isDevServer',
         hasRequestOptions: 'requests/hasRequestOptions',
         hasBoundWithItems: 'item/hasBoundWithItems'
      }),
      hasPDFContent() {
         return this.details.digitalContent.filter( dc => dc.type == "PDF").length > 0
      },
      pdfs() {
         return this.details.digitalContent.filter( dc => dc.type == "PDF")
      },
      hasItems(){
         return Array.isArray(this.availability.items) && this.availability.items.length > 0

      },
      availabilityStatement() {
         let f = this.details.detailFields.find( f=>f.name == "availability_statement")
         if (f) {
            return f.value
         }
         return ""
      },
      accessRestriction() {
         let f = this.details.detailFields.find( f=>f.name == "access_note")
         if (f) {
            return f.value
         }
         return ""
      },
      availabilityFields() {
         return this.details.detailFields.filter( f => f.display == "availability")
      }
   },
   methods: {
      formatValue(val) {
         if ( val == "On Shelf" ) {
            return "On Shelf Now"
         }
         return val
      },
   },
   created() {
      this.$store.dispatch("item/getAvailability", this.titleId )
   }
}
</script>
<style lang="scss" scoped>
.availability {
   h2 {
      color: var(--color-primary-orange);
      text-align: center;
   }
   .ra-box.ra-fiy {
      margin-bottom: 10px;
   }
   .working {
      margin-bottom: 25px;
   }
}
::v-deep .pdf {
   padding-top: 0 !important;
}
.availability-content {
   margin: 0 0 10vh 0;
   text-align: left;

   div.items {
      border: 1px solid var(--uvalib-grey-light);
      border-radius: 5px;
      margin-top: 25px;
   }

   div.value {
      margin: 10px 0 0 20px;
   }
   div.google {
      margin: 25px 0 0 0;
   }
   label {
      font-weight: bold;
      display: block;
   }

   div.pdfs {
      margin: 25px 0 0 0;

      .download-card {
         display: inline-block;
         text-align: center;
         margin: 5px;
         border: 1px solid var(--uvalib-grey-light);
         padding: 10px;
         border-radius: 3px;
         box-shadow: $v4-box-shadow-light;
         img {
            display: inline-block;
            border-radius: 5px;
         }
         span {
            display: block
         }
      }
   }

   ul {
      list-style: none;
   }

   ul.holdings {
      padding: 15px;
      border-top: 1px solid var(--uvalib-grey-light);
      font-weight: bold;
      margin: 0;
   }

   ul.location, ul.call, ul.copy  {
      font-weight: normal;
   }
   ul.copy  {
      padding-bottom: 10px;
   }

   table {
      width: 100%;
      font-weight: normal;
      text-align: left;
      border-collapse: collapse;
   }
   table td {
      padding: 4px 5px;
      border-top: 1px solid var(--uvalib-grey-light);
   }
   table th {
      padding: 4px 5px;
      background: var(--uvalib-grey-lightest);
      border-top: 1px solid var(--uvalib-grey);
      border-bottom: 1px solid var(--uvalib-grey);
   }
}
@media only screen and (max-width: 700px) {
  td, th {
     font-size: 2.5vw;
     word-break: break-word;
  }
  .availability-content {
      width: 100vw;
      position: relative;
      left: calc(-50vw + 50% );
      border-left: none;
      border-right: none;
  }
}
</style>
