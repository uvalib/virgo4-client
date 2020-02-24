<template>
   <div class="image-container" >
      <router-link class="img-link" :to="detailsURL">
         <v-popover placement="top-center" class="metadata-info" trigger="hover" >
            <img class="trigger" :src="iiifURL(hit)">
            <div class="metadata-popover" slot="popover">
               <div class="metadata-content">
                  <div>{{hit.header.title}}</div>
               </div>
            </div>
         </v-popover>
         <div class="group-cnt" v-if="hit.grouped">{{hit.count}} images</div>
      </router-link>
   </div>
</template>

<script>
import { mapState } from "vuex"
export default {
   props: {
      hit: { type: Object, required: true},
      pool: {type: String, required: true},
      count: {type: Number, required: true}
   },
   components: {
   },
   computed: {
      detailsURL() {
         return `/sources/${this.pool}/items/${this.hit.identifier}`
      },
      ...mapState({
         searching: state => state.searching,
      }),
   },
   methods: {
      iiifURL(item) {
         let iiifField = item.basicFields.find( f=>f.name=="iiif_base_url")
         let iiif = iiifField.value
         return `${iiif}/square/175,175/0/default.jpg`
      },
   }
};
</script>

<style scoped>
.img-link {
   padding:0;
   background-color: transparent;
   border: 1px solid var(--uvalib-grey);
   margin: 3px;
   display: inline-block;
}
img {
   border: 0;
   padding: 0;
   margin: 0 0 -4px 0;
   min-width: 175px;
   min-height: 175px;
   background-color: var(--uvalib-grey-lightest);
   background-image: url('~@/assets/spinner2.gif');
   background-repeat:no-repeat;
   background-position: center center;
}
.image-container {
   position: relative;
   margin:0;
   padding:0;
}
.img-link:hover {
   box-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
}
.image-container:hover {
   top: -2px;
}
.group-cnt {
   position: absolute;
   background: white;
   padding: 2px 8px;
   border-radius: 10px;
   bottom: 8px;
   right: 8px;
   font-size: 0.8em;
   color: var(--uvalib-text);
   border: 1px solid var(--uvalib-grey-dark);
}

.metadata-popover {
   background: white;
   box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
   color: var(--uvalib-text);
   font-size: 0.9em;
   font-weight: normal;
   display: inline-block;
   border-radius: 5px;
   border: 1px solid var(--uvalib-grey-light);
   max-width: 250px;
}
.metadata-content {
   padding: 10px;
}
</style>
