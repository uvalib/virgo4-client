<template>
   <div class="image-container">
      <router-link class="img-link" :to="detailsURL">
         <img :src="iiifURL(hit)">
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
      popoverTemplate() {
         return `<div class="img-popover">${this.hit.header.title}</div>`
      }
   },
   methods: {
      iiifURL(item) {
         let iiifField = item.basicFields.find( f=>f.name=="iiif_base_url")
         let iiif = iiifField.value
         return `${iiif}/square/200,200/0/default.jpg`
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
</style>
