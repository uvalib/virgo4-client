<template>
   <div class="truncated-text">
      <div v-if='isTruncated==false'>
         <router-link v-if="tgtURL" :to="tgtURL">
            <div v-html="truncatedText"></div>
         </router-link>
         <div v-else v-html="truncatedText"></div>
      </div>
      <template v-else>
         <div v-if="mode=='text'" class="truncated-content">
            <router-link v-if="tgtURL" :to="tgtURL">
               <div v-html="truncatedText"></div>
            </router-link>
            <div v-else v-html="truncatedText"></div>
         </div>
         <v-popover class="full-trigger" :open="showFull"  trigger="manual" @hide="hide"  @esc="hide">
            <V4Button v-if="mode=='text'" mode="text" :aria-pressed="showFull" @click="textClicked" @esc="hide">
               More
            </V4Button>
            <V4Button v-else mode="icon" :aria-pressed="showFull" @click="textClicked" @esc="hide">
               <span v-html="truncatedText"></span>
               <i class="icon fas fa-chevron-circle-down"></i>
            </V4Button>
            <div class="full-text-popover" slot="popover">
               <div v-if="title" class="popover-header">
                  {{title}}
                  <i v-close-popover class="close fas fa-times-circle"></i>
               </div>
               <div class="full-text" v-html="text"></div>
            </div>
         </v-popover>
      </template>
   </div>
</template>

<script>
export default {
   props: {
      title: {
         type: String,
         default: "",
      },
      text: {
         type: String,
         required: true,
      },
      limit: {
         type: Number,
         default: 80
      },
      tgtURL: {
         type: String,
         default: ""
      },
      mode: {
         type: String, 
         default: "text"
      }
   },
   data: function() {
      return {
         showFull: false
      }
   },
   computed: {
      isTruncated() {
         let test = this.truncatedText
         return this.text != test
      },
      truncatedText() {
         if (this.text.length <= this.limit) return this.text
         var trunc = this.text.substr(0, this.limit-1)
         var out = trunc.substr(0, trunc.lastIndexOf(' ')).trim()
         return out+"... "
      }
   },
   methods: {
      hide() {
         this.showFull = false
      },
      textClicked() {
         this.showFull = !this.showFull
      },
   }
}
</script>

<style lang="scss" scoped>
.truncated-text {
   font-size: 1em;
   font-weight: normal;

   .truncated-content {
      display: inline-block;
      word-break: break-word;
      -webkit-hyphens: auto;
      -moz-hyphens: auto;
      hyphens: auto;
      cursor: default;
   }
}

.full-trigger {
   display: inline-block;
   i.trigger.more {
      color: var(--color-link);
      cursor: pointer;
      margin-left: 10px;
      font-weight: 500;
      font-size: 0.8em;
   }
   i.trigger.more:hover {
      text-decoration: underline;
   }
   i.icon {
      font-size: 1.2em;
      margin-left: 2px;
      color: var(--uvalib-grey);
   }
}

.full-text-popover {
   background: white;
   border-radius: 5px;
   box-shadow: $v4-box-shadow-light;
   border: 1px solid var(--uvalib-grey-dark);
   margin: 0 10%;

   .popover-header {
      padding: 5px;
      color: white;
      background-color: var(--uvalib-grey-dark);
      font-weight: 500;
      text-align: center;

      i.close {
         font-size: 1.1em;
         float:right;
      }
   }

   .full-text {
      font-size: 0.95em;
      padding: 10px;
      line-height: 1.5em;
      font-weight: 100;
      max-width: 90%;
   }
}

</style>
