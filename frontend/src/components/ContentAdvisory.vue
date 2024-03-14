<template>
   <div class="advisory" :class="props.mode">
      <div class="icon-wrap"><span class="icon"></span></div>
      <div class="text"  v-if="props.mode == 'full'">
         <h5>Content advisory:</h5>
         <p>
            This item may include language or imagery which is offensive, oppressive, harmful, or inappropriate for some contexts; possibly including violence or hate speech.
            This warning is provided to allow viewers to make an informed choice about ways to engage withthe material, taking appropriate care for themselves and others who may be affected.
         </p>
      </div>
      <div class="text" v-else>
         <p>
            <b>Content advisory:</b>&nbsp;This item may include language or imagery that is offensive, oppressive, harmful, or inappropriate for some contexts.
         </p>
      </div>
   </div>
</template>

<script setup>
const props = defineProps({
   mode: {
      type: String,
      reqired: true,
      validator(value) {
         return ['brief', 'full'].includes(value)
      },
   },
})
</script>

<style lang="scss" scoped>
@media only screen and (min-width: 768px) {
   .advisory {
      margin: 34px 0 51px 0;
      max-width: 900px;
      padding: 34px 68px 34px 34px;
      h5 {
         font-size: 20px;
      }
      .icon-wrap {
         margin-right: 34px;
         .icon {
            width: 50px;
            height: 50px;
         }
      }
      p {
         font-size: 17px;
         margin: 15px 0 0 0;
      }
   }
}
@media only screen and (max-width: 768px) {
   .advisory {
      padding: 17px 34px 17px 17px;
      h5 {
         font-size: 17px;
      }
      .icon-wrap {
         margin-right: 17px;
         .icon {
            width: 30px;
            height: 30px;
         }
      }
      p {
         font-size: 15px;
         margin: 10px 0 0 0;
      }
   }
}
   .advisory.brief {
      margin: 17px 0;
      font-size: 15px;
      padding: 17px 34px;
      align-items: center;
      max-width: none;
      p {
         margin: 0;
      }
      .icon-wrap {
         margin-right: 17px;
         padding: 5px;
         .icon {
            width: 35px;
            height: 35px;
         }
      }
   }
   .advisory {
      background-color: #F3EC45;
      border-radius: 10px;
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: flex-start;
      h5 {
         padding: 0;
         margin: 0;
         text-align: left;
         font-family: "franklin-gothic-urw", arial, sans-serif;
      }
      p {
         font-family: "franklin-gothic-urw-book", arial, sans-serif;
         padding: 0;
         text-align: left;
      }
      .icon-wrap {
         background-color: #2b2b2b;
         border-radius: 50px;
         padding: 10px;
         .icon {
            display: block;
            background-image: url(/src/assets/eye-slash.svg);
            background-repeat: no-repeat;
            background-position: center center;
            background-color: #2b2b2b;
            border-radius: 40px;
         }
      }
   }
</style>