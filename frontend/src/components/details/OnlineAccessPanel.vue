<template>
   <section class="online" aria-live="polite">
      <div class="panel">
         <div class="gutter"></div>
         <div class="content">
            <h3>Access online</h3>
            <div class="header">Source</div>
            <div class='provider' v-for="s in props.sources">

            </div>
         </div>
      </div>
   </section>
</template>

<script setup>

const props = defineProps({
   title: {
      type: String,
      required: true
   },
   pool: {
      type: String,
      required: true
   },
   sources: {
      type: Array,
      required: true
   }
})

const providerLabel = ((provider) => {
   let p = poolStore.findProvider(props.pool, provider)
   if ( p ) return p.label
   return provider
})

</script>

<style lang="scss" scoped>
.online {
   text-align: left;
   .panel {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: stretch;
      border: 1px solid var(--uvalib-grey-light);
      border-radius: 0 5px 5px 0;
      .gutter {
         width: 17px;
         background-color:#E6F2F7;
         border-right: 1px solid var(--uvalib-grey-light);
      }
      .content {
         flex-grow: 1;
         padding: 0 15px 15px 15px;
         h3 {
            font-size: 1.15em;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--uvalib-grey-light);
            margin-bottom: 10px;
         }
         .header {
            font-size: 0.97em;
            font-weight: bold;
         }
      }
   }
}
</style>