<template>
  <div class="home">
    <HelloWorld2 msg="Plase login"/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import HelloWorld2 from '@/components/HelloWorld.vue'; // @ is an alias to /src

export default Vue.extend({
  name: 'home',
  components: {
    HelloWorld2,
  },
});
</script>
