<template>
   <div class="pickup-options">
      <h3>Pickup Location</h3>
      <div class="content">
         <p>
            This pickup location is where you will go to retrieve items you’ve
            requested.
         </p>

         <p>
            If you cannot pick your item up at the location(s) shown below, please
            <a target="_blank" aria-describedby="new-window" href="https://uva.hosts.atlas-sys.com/remoteauth/illiad.dll?Action=10&Form=30">use this form</a>
            to request your item.
         </p>

         <label for="pickup-sel">Pickup location:
            <select v-model="tgtLibrary" id="pickup-sel"  @change="update">
               <option :value="{id:'', name:''}">Select a location</option>
               <option v-for="l in userStore.libraries" :key="l.id" :value="l">{{l.name}}</option>
            </select>
            <Message variant="simple" severity="success" v-if="showSaved" :life="2000" >Saved</Message>
         </label>
      </div>
   </div>
</template>

<script setup>
import { usePreferencesStore } from "@/stores/preferences"
import { useUserStore }  from "@/stores/user"
import { ref } from 'vue'
import Message from 'primevue/message'

const preferences = usePreferencesStore()
const userStore = useUserStore()
const showSaved = ref(false)
const tgtLibrary = ref(preferences.pickupLibrary)

const update = ( async () => {
   await preferences.updatePickupLibrary(tgtLibrary.value)
   showSaved.value = true
   setTimeout( ()=>{showSaved.value = false}, 2100)
})
</script>

<style lang="scss" scoped>
.pickup-options {
   text-align: left;
   padding-bottom: 20px;
    @media only screen and (max-width: 768px) {
      // prevent overflow on small screens
      width: 100%;
    }
   h3 {
      margin: 0;
      padding: 10px 15px;
      background: $uva-grey-200;
      border-bottom: 1px solid $uva-grey-100;
      font-size: 1.2em;
   }
   div.content {
     padding: 5px 20px 0px 20px;
     #pickup-sel {
       margin-top: 15px;
     }
   }
   a:link {
      text-decoration: underline !important;
   }
   label {
      font-weight: 500;
      margin-top: 30px;
   }
   #pickup-sel {
      max-width: 100%;
      display: block;
      margin-bottom: 10px;
   }
}
</style>
