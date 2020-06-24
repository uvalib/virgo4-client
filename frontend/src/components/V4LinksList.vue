<template>
   <div :id="id" class="links-list">
      <div v-if="links.length < 5" class="link-list">
         <template v-for="(val,idx) in truncatedLinks">
            <div class="link-wrap" :key="`${id}-${idx}`">
               <span class="number">{{idx+1}}.</span>
               <router-link :to="val.url" class="link">
                  {{val.label}}
               </router-link>
            </div>
         </template>
      </div>
      <div v-else tabindex="0" :aria-expanded="showFull.toString()" 
            class="truncated-content" :id="`${id}-cut`"
            @keyup.stop.prevent @keydown.prevent.stop.enter="toggle" 
            @keydown.space.prevent.stop="toggle" @keyup.stop.esc="hide"
      >
         <div :id="`${id}-list`" aria-live="polite">
            <template v-for="(val,idx) in truncatedLinks">
               <div class="link-wrap" :key="`${id}-${idx}`">
                  <span class="number">{{idx+1}}.</span>
                  <router-link :to="val.url" class="link">
                     {{val.label}}
                  </router-link>
               </div>
            </template>
            <div class="controls">
               <span tabindex="0" role="button" v-if="!showFull" class="more" @click.prevent.stop="toggle">...More ({{links.length}} items)</span>
               <span tabindex="0" role="button" v-else class="less" @click.prevent.stop="toggle">...Less</span>
            </div>
         </div>
      </div>
   </div>
</template>

<script>
export default {
   props: {
      id: {
         type: String,
         required: true
      },
      links: {
         type: Array,
         required: true
      },
   },
   data: function()  {
      return {
         showFull: false
      }
   },
   computed: {
      truncatedLinks() {
         if ( this.showFull ) {
            return this.links
         }
         return this.links.slice(0,5)
      }
   },
   methods: {
      hide() {
         this.showFull = false
         this.$nextTick( () => {
            let tgt = document.getElementById(this.id+"-cut")
            tgt.scrollIntoView()
            tgt.focus()
         })
      },
      toggle() {
         this.showFull = !this.showFull
         if ( this.showFull == false ) {
             this.$nextTick( () => {
               let tgt = document.getElementById(this.id+"-cut")
               tgt.scrollIntoView({behavior: "smooth"})
               tgt.focus()
            })
         } else {
            let links = document.getElementsByClassName("link")
            links[0].focus()
         }
      },
   }
}
</script>

<style lang="scss" scoped>
.links-list {
   .link-wrap {
      .number {
         margin-right: 5px;
         display: inline-block;
      }
   }
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
   }
   .controls {
      text-align: right;
      margin-top: 10px;
      .more, .less {
         color: var(--color-link);
         cursor: pointer;
         margin-left: 0px;
         font-weight: 500;
         margin-left: 5px;
         font-size: 0.9em;
         &:focus {
            @include be-accessible();
         }
         &:hover {
            text-decoration: underline;
         }
      }
   }
}
</style>

