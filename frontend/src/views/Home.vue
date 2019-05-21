<template>
  <div class="home">
    <h4>Welcome to Virgo4</h4>
    <p>API: {{searchAPI}}</p>
  </div>
</template>

<script>

export default {
  name: 'home',
  components: {
  },
  data: function() {
      return {}
  },
  computed: {
    searchAPI() {
      return process.env.VUE_APP_SEARCH_API
    }
  },
}
</script>
