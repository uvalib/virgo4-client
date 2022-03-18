<template>
   <div class="libary-admin">
      <h2>
         <span>PDA Dashboard</span>
      </h2>
      <div class="content form">
         <h3>PDA orders in the last 7 days</h3>
      </div>
   </div>
</template>

<script>
export default {
};
</script>

<style lang="scss" scoped>
.libary-admin {
   h2 {
      margin: 0;
      padding: 10px 15px;
      background: var(--uvalib-grey-lightest);
      border-bottom: 1px solid var(--uvalib-grey-light);
      font-size: 1.2em;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
      display: flex;
   }
   .content.form {
      h3 {
         font-weight: normal;
         font-size: 1.1em;
      }
      padding: 5px 20px 20px 20px;
      display: flex;
      flex-flow: column;
      justify-content: flex-start;
   }
}
</style>