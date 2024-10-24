<template>
    <a :tab-index="-1" class="skip-to"  href="#v4main">Skip to main content</a>
</template>

<script setup>
</script>

<style scoped lang="scss">
.skip-to {
   font-weight: bolder;
   display: block;
   padding: 10px 20px;
   background: white;
   color: $uva-text-color-dark;
   position: absolute;
   top: 10px;
   left: 10px;
   transform: translateY(-150%);
   border-radius: 5px;
   z-index: 9000;
   transition: transform 100ms;
   width: 200px;
   font-size: 0.9em;
   border: 3px solid white;
   &:focus {
      transform: translateY(0%);
      outline-offset: -3px !important;
      outline: 1px solid  $uva-blue-alt-A !important;
      text-decoration: underline !important;
      background-color: $uva-blue-alt-300;
   }
}
</style>
