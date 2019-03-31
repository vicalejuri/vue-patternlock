import Vue from 'vue'
import { shallowMount } from '@vue/test-utils';
import PatternLock from '@/components/PatternLock.vue';

Vue.config.productionTip = false

const KEY_EXAMPLE = 'THANK YOU VERY MUCH'

describe('PatternLock.vue', () => {
  it('Should receive seed as prop', () => {
    console.warn = () => false
    console.error = () => false
    const f = () => {
      const wrapper = shallowMount(PatternLock, {});
    }
    expect(f).toThrowError()
  });
  it('Should have predictable points UID based on passed hmackey', () => {
    const UIDS = [
      3328374819,
      2162706501,
      3410834516,
      780639869,
      644496795, 
      1122729592,
      3411758391,
      26494985,
      42405960,
    ]
    const wrapper = shallowMount(PatternLock, { propsData: 
      {'hmackey': KEY_EXAMPLE}
    })
    expect(wrapper.vm.$data.points.length).toBe(UIDS.length)
    for(let i=0; i < UIDS.length; i++){
      expect(wrapper.vm.$data.points[i].valueOf()).toBe(UIDS[i])
    }
  })
  it('Should emit a sha256 digest when pattern is complete', () => {
    /* Pattern:
        → → →
        ← ← ↵
        * * *
     */
    const wrapper = shallowMount(PatternLock, { propsData: 
      {'hmackey': KEY_EXAMPLE}
    })

    // Set dragging to true
    const wr = wrapper.find('.patternlock')
    wr.trigger('pointerdown')

    const points = wrapper.vm.$data.points
    
    // Trigger movement
    const pointsElWrapper = wrapper.findAll('.hitbox-point')
    for(let i=0; i < 6; i++){
      const pointEl = pointsElWrapper.at(i)
      pointEl.trigger('pointerover')
    }
    expect(wrapper.emitted('drawComplete')[0]).toEqual('fa38720b33b5a6637636f45f28adfdc1bb8b1e0febcd8dbd9078c56c58053933')
  })
});
