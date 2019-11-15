<template>
  <v-popover class="popover">
    <span class="trigger">
      <span>&nbsp;<i class="fas fa-exclamation-triangle"></i></span>
    </span>
    <div class="container" slot="popover">
      <div class="popover-header">
        <span>Availability Notice</span>
        <i v-close-popover class="close fas fa-times-circle"></i>
      </div>
      <div class="message">
        <p>{{ message }}</p>
      </div>
    </div>
  </v-popover>
</template>

<script>

export default {
  props: {
    message: String
  }
};
</script>

<style scoped>
div.popover-header {
  padding: 6px 0px 6px 8px;
  color: white;
  background-color: var(--color-primary-orange);
  font-size: 1.15em;
  font-weight: bold;
  border-radius: 5px 5px 0 0;
}
.container {
  max-width: 30em;
  background: white;
  box-shadow: 1px 1px 15px #333;
  color: var(--color-primary-text);
  font-size: 0.9em;
  font-weight: 500;
  display: inline-block;
  padding: 0;
  border-radius: 5px;
}
i.fas.fa-times-circle.close {
  opacity: 0.8;
  font-size: 1.1em;
  float:right;
  margin-right: 8px;
}
i.fas.fa-times-circle.close:hover {
  opacity: 1;
  cursor: pointer;
}
div.message {
  padding: 20px;
  border-left: 5px solid var(--color-primary-orange);
  border-right: 5px solid var(--color-primary-orange);
  border-bottom: 5px solid var(--color-primary-orange);
  border-radius: 0 0 5px 5px;
}
.popover {
  display: inline;
}
.trigger {
  color: var(--color-primary-orange);
}
</style>
