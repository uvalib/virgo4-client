<template>
   <div class="pickup-options pure-form">
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
            <select v-model="pickupLibrary" id="pickup-sel"  @change="update">
               <option :value="{id:'', name:''}">Select a location</option>
               <option v-for="l in librariesForUser" :key="l.id" :value="l">{{l.name}}</option>
            </select>
         </label>
      </div>
   </div>
</template>

<script>
import { mapFields } from "vuex-map-fields";
import { mapGetters } from "vuex";
export default {
   data: () => {
      return {
         showSaved: false,
      };
   },
   computed: {
      ...mapFields({
         pickupLibrary: "preferences.pickupLibrary",
      }),
      ...mapGetters({
         librariesForUser: "user/libraries",
      }),
   },
   methods: {
      update() {
         this.$store.dispatch("preferences/savePreferences").then(() => {
            this.showSaved = true
         })
      },
   },
}
</script>

<style lang="scss" scoped>
.pickup-options {
   text-align: left;
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
      width: fit-content;
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
