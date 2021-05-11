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
         <datepicker :inline="true" format="yyyy-MM-dd" :value="startDate"></datepicker>
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
         return new Date(bits[0], bits[1], bits[2])
      }
   },
   methods: {
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
