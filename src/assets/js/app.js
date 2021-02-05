import Vue from 'vue';
import App from './Test.vue';

new Vue({
    el: '#app',
    render: h => h(App),
})


const test = () => {
    console.log('file');
}

test();
