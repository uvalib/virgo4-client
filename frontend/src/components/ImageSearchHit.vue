<template>
   <router-link class="img-link" :to="detailsURL">
         <img :src="iiifURL(hit)">
   </router-link>
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
.img-link:hover {
   box-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
   position: relative;
   top: -2px;
}
img {
   border: 0;
   padding: 0;
   margin: 0 0 -4px 0;
}
</style>
