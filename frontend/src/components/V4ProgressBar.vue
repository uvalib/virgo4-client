<template>
   <div class="v4-progress-bar" :id="props.id" >
      <span class="label" v-if="label" v-html="props.label"></span>
      <div class="progress-bar-container">
         <div id="progress" class="progress-bar" :style="{width: `${props.percent}`}"></div>
      </div>
   </div>
</template>

<script setup>
const props = defineProps({
   id: {
      type: String,
      required: true
   },
   label: {
      type: String,
      default: ""
   },
   percent: {
      type: String,
      required: true
   }
})
</script>

<style lang="scss" scoped>
.v4-progress-bar {
   background: #f5f5f5;
   border: 1px solid $uva-grey-100;
   border-radius: 4px;
   padding: 10px;
   box-sizing: border-box;
   margin: 0 5px 15px 5px;
   display: flex;
   flex-direction: column;
   gap: 5px;

   .label {
      font-size: 0.8em;
      font-weight: bold;
   }

   .progress-bar-container {
      box-sizing: border-box;
      display: block;
      height: 15px;
      width: 100%;
      background: $uva-grey-100;
      border: 1px solid $uva-grey;
      border-radius: 2px;

      .progress-bar {
         width: 0%;
         background-color: $uva-green;
         border-radius: 2px;
         height: 100%;
         box-sizing: border-box;
         display: block;
      }
   }
}
</style>
