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
   color: var(--uvalib-text);
   position: absolute;
   top: 10px;
   left: 10px;
   transform: translateY(-150%);
   border-radius: 5px;
   z-index: 9000;
   transition: transform 100ms;
   box-shadow: $v4-box-shadow-light;
   width: 180px;
   font-size: 0.9em;
   border: 3px solid white;
   &:focus {
      transform: translateY(0%);
      outline-offset: -3px !important;
      outline: 1px solid  var(--uvalib-blue-alt-dark) !important;
      text-decoration: underline !important;
      background-color: var(--uvalib-blue-alt-light);
   }
}
</style>
