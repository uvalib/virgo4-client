<template>
   <div class="pickup-options">
      <h2>Pickup Location</h2>
      <div class="content">
         <p>
            This pickup location is where you will go to retrieve items you’ve
            requested.
         </p>

         <p>
            If you cannot pick your item up at the location(s) shown below, please
            <a target="_blank" href="https://uva.hosts.atlas-sys.com/remoteauth/illiad.dll?Action=10&Form=30">use this form</a>
            to request your item.
         </p>

         <label for="pickup-sel">Pickup location:
            <transition name="fade" v-on:after-enter="showSaved = false">
               <span v-if="showSaved" class="success"> Saved</span>
            </transition>
            <select v-model="preferencesStore.pickupLibrary" id="pickup-sel"  @change="update">
               <option :value="{id:'', name:''}">Select a location</option>
               <option v-for="l in userStore.libraries" :key="l.id" :value="l">{{l.name}}</option>
            </select>
         </label>
      </div>
   </div>
</template>

<script setup>
import { usePreferencesStore } from "@/stores/preferences"
import { useUserStore }  from "@/stores/user"
import { ref } from 'vue'

const preferencesStore = usePreferencesStore()
const userStore = useUserStore()
const showSaved = ref(false)

function update() {
   preferencesStore.savePreferences().then(() => {
      showSaved.value = true
   })
}
</script>

<style lang="scss" scoped>
.pickup-options {
   text-align: left;
    @media only screen and (max-width: 768px) {
      // prevent overflow on small screens
      width: 100%;
    }
   h2 {
      margin: 0;
      padding: 10px 15px;
      background: var(--uvalib-grey-lightest);
      border-bottom: 1px solid var(--uvalib-grey-light);
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
      margin-bottom: 30px;
      display: block;
   }
   .success {
      color: var(--uvalib-green-dark);
   }

   .fade-leave-active {
      transition: all 1s ease-in 1s;
   }
   .fade-enter {
      opacity: 1;
   }
}
</style>
