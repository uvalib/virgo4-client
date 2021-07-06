<template>
   <div :id="id" class="truncated-text">
      <div v-if='isTruncated==false'>
         <div v-html="text"></div>
      </div>
      <template v-else>
         <div tabindex="0" :aria-expanded="showFull.toString()"
            class="truncated-content"
            :class="{icon: mode=='icon'}"
            @keydown.prevent.stop.enter="toggle"
            @keydown.space.prevent.stop="toggle" @keyup.stop.esc="hide"
         >
            <div  v-if="!showFull" :id="`${id}-cut`" class="truncated"  aria-live="polite" >
               <span class="text" :inner-html.prop="truncateText(text)"></span>
               <span class="trigger" @click.prevent.stop="toggle">
                  <span  v-if="mode=='text'" class="more">...&nbsp;More</span>
                  <span  v-else class="more icon">...</span>
               </span>
            </div>
            <div v-else class="full" :id="`${id}-full`" aria-live="polite" >
               <span class="text" v-html="text"></span>
               <span class="trigger" @click.prevent.stop="toggle" >
                  <span  v-if="mode=='text'" class="less">...&nbsp;Less</span>
                  <span v-else class="less icon">Less</span>
               </span>
            </div>
         </div>
      </template>
   </div>
</template>

<script>
export default {
   props: {
      text: {
         type: String,
         required: true,
      },
      limit: {
         type: Number,
         default: 80
      },
      mode: {
         type: String,
         default: "text"
      },
      id: {
         type: String,
         required: true
      }
   },
   data: function() {
      return {
         showFull: false
      }
   },
   computed: {
      isTruncated() {
         let strippedFull = this.stripTags(this.text)
         let test = this.truncateText(strippedFull)
         return strippedFull != test
      },
      strippedText() {
         return this.stripTags(this.text)
      }
   },
   methods: {
      truncateText(txt) {
         if (txt.length <= this.limit) return txt
         var trunc = txt.substr(0, this.limit-1)
         var out = trunc.substr(0, trunc.lastIndexOf(' ')).trim()
         return out
      },
      stripTags(txt) {
         let regex = /(<([^>]+)>)/gi;
         return txt.replace(regex, "")
      },
      hide() {
         this.showFull = false
         this.$nextTick( () => {
            let tgtID = `${this.id}-cut`
            let ele = document.getElementById( tgtID )
            if (ele) {
               ele.focus()
               this.$utils.scrollToItem(ele)
            }
         })
      },
      toggle() {
         this.showFull = !this.showFull
         this.$nextTick( () => {
            let tgtID = `${this.id}-full`
            if ( this.showFull == false) {
               tgtID = `${this.id}-cut`
            }
            let ele = document.getElementById( tgtID )
            if (ele) {
               ele.focus()
               if (this.showFull == false) {
                  this.$utils.scrollToItem(ele)
               }
            }
         })
      },
   }
}
</script>

<style lang="scss" scoped>
.full-text {
   background: white;
}
.full-text.icon {
   padding: 5px 18px 5px 5px;
   position: relative;
   top: 0px;
   left: -5px;
   z-index: 999;
   width: 100%;
   box-sizing: border-box;
   background: white !important;
   border: 1px solid var(--uvalib-grey);
   box-shadow: $v4-box-shadow;
   i {
      position: absolute;
      right: 5px;
      top: 5px;
   }
}
.truncated-text {
   font-size: 1em;
   font-weight: normal;
   display: inline-block;
   text-align: left;
   position: relative;
   box-sizing: border-box;

   .truncated-content {
      display: inline-block;
      word-break: break-word;
      -webkit-hyphens: auto;
      -moz-hyphens: auto;
      hyphens: auto;
      cursor: default;
      background: transparent;
      border: none;
      margin: 0;
      padding: 0;
      text-align: left;
      width: 100%;
      box-sizing: border-box;
      &:focus {
         @include be-accessible();
      }
      i {
         position: absolute;
         right: 5px;
         top: 5px;
      }
   }
   .truncated-content.icon:hover {
      text-decoration: underline;
      cursor: pointer;
   }

   .full-text {
      text-align: left;
      &:focus {
         @include be-accessible();
      }
   }
    .full-text.icon {
      outline: none;
      cursor: pointer;
      &:focus {
         background-color: var(--uvalib-teal-lightest)!important;
         color: var(--uvalib-text-dark);
      }
   }

   .more, .less {
      color: var(--color-link);
      cursor: pointer;
      margin-left: 0px;
      font-weight: 500;
      margin-left: 5px;
      font-size: 0.9em;
   }
   .more.icon  {
       color: var( --uvalib-text);
       margin-left: 0px;
   }
   .more:hover, .less:hover {
      text-decoration: underline;
   }
}

</style>
