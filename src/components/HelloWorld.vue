<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <section class="password">
      <PatternLock class="pattern-lock"></PatternLock>
    </section>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import PatternLock from './PatternLock.vue';

export default Vue.extend({
  name: 'HelloWorld',
  components: { PatternLock },
  props: {
    msg: String,
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

.password {
}
.pattern-lock {
  margin: 0 auto;
  border: 1px solid black;
  width: 320px;
  min-height: 320px;
}
</style>
