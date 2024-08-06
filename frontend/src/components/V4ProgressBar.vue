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
   border: 1px solid var(--uvalib-grey-light);
   border-radius: 5px;
   padding: 10px;
   box-sizing: border-box;

   .label {
      font-size: 0.8em;
      margin: 0;
      font-weight: bold;
   }

   .progress-bar-container {
      box-sizing: border-box;
      display: block;
      height: 20px;
      margin: 5px 0 10px 0;
      width: 100%;
      background: var(--uvalib-grey-light);
      border: 1px solid var(--uvalib-grey);
      box-shadow: inset 0 0 4px var(--uvalib-grey);
      border-radius: 2px;

      .progress-bar {
         width: 0%;
         background-color: var(--uvalib-green );
         box-shadow: inset 0 0 4px var(--uvalib-grey);
         border-radius: 2px;
         height: 100%;
         box-sizing: border-box;
         display: block;
      }
   }
}
</style>
