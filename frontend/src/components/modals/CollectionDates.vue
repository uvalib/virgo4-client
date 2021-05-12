<template>
   <V4Modal :id="id" title="Select a date" ref="calendardlg"
      :firstFocusID="`${id}-okbtn`" :lastFocusID="`${id}-okbtn`"
      :buttonID="`${id}-open`"
   >
      <template v-slot:button>
         <V4Button class="calendar" mode="primary"
            @click="$refs.calendardlg.show()" :id="`${id}-open`"
            :aria-label="`view collection calendar`">
            <i class="fal fa-calendar-alt"></i>
         </V4Button>
      </template>
      <template v-slot:content>
         <datepicker :inline="true" format="yyyy-MM-dd"
            :value="startDate"
            :disabled-dates="disabledDates"
            @changedMonth="monthChanged"
            @changedYear="yearChanged"
            @selected="dateSelected"
         >
         </datepicker>
       </template>
       <template v-slot:controls>
         <V4Button mode="primary" :id="`${id}-okbtn`" @click="okClicked"
            :focusNextOverride="true" @tabnext="nextTabOK">
            Close
         </V4Button>
      </template>
   </V4Modal>
</template>

<script>
import Datepicker from 'vuejs-datepicker'
import { mapGetters, mapState } from "vuex"
export default {
   name: "collection-dates",
   components: {
      Datepicker
   },
   props: {
      id: {
         type: String,
         required: true
      },
      date: {
         type: String,
         required: true
      }
   },
   computed: {
      startDate() {
         let bits = this.date.split("-")
         let month = parseInt(bits[1],10) - 1 // NOTE: month is zero based!!!!
         return new Date( parseInt(bits[0],10), month, parseInt(bits[2],10))
      },
      ...mapState({
         collectionStartDate : state => state.collection.startDate,
         collectionEndDate : state => state.collection.endDate,
      }),
      ...mapGetters({
         notPublishedDays: 'collection/notPublishedDays',
         pidByDate: 'collection/getPidForDate'
      }),
      disabledDates() {
         return {
            to: new Date(this.collectionStartDate),
            from: new Date(this.collectionEndDate),
            daysOfMonth: this.notPublishedDays,
         }
      }
   },
   methods: {
      dateSelected(date) {
         let ms = ""+(date.getMonth()+1)
         ms = ms.padStart(2, "0")
         let ds = ""+date.getDate()
         ds = ds.padStart(2, "0")
         let dateStr = `${date.getFullYear()}-${ms}-${ds}`
         let pid = this.pidByDate(dateStr)
         this.$router.push(`/sources/uva_library/items/${pid}`)
      },
      yearChanged(dateObj) {
         this.$store.dispatch("collection/setYear", dateObj.year)
      },
      monthChanged(dateObj) {
         // NOTES: when the date is changed with the arrows on top of the calendar, a Date is returned
         // When changed otherwise, a custom object is returned which contains the timestamp of the new yyyy-mm
         // In this case, convert the timestamp to a date annd use it for processing
         let date = dateObj
         if (dateObj.timestamp) {
            date = new Date(dateObj.timestamp)
         }

         // the arrows can scroll thru years, so extract both month and year from the date
         let ms = ""+(date.getMonth()+1)
         ms = ms.padStart(2, "0")
         this.$store.dispatch("collection/setYear", date.getFullYear())
         this.$store.dispatch("collection/setMonth", ms)
      },
      backTabCancel() {
         this.$refs.calendardlg.firstFocusBackTabbed()
      },
      nextTabOK() {
         this.$refs.calendardlg.lastFocusTabbed()
      },
      okClicked() {
         this.$emit('confirmed')
         setTimeout( () => {
            if ( this.$refs.calendardlg ) {
               this.$refs.calendardlg.hide()
            }
         }, 300)
      },
   }
}
</script>

<style lang="scss" scoped>
.v4-button.calendar {
   margin: 0 !important;
}
</style>
