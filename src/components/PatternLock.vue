<template>
  <div class="patternlock" @pointerdown="start" @pointerup="end" @pointermove="draw">
    <div class="patternlock__container" ref="container">
      <div class="quadrant debug" v-for="point in points" :key="point.uid">
        <button class="point" :aria-toggled="point.checked"/>
      </div>
      <svg class="line-container" viewBox="0 0 1 1">
        <path ref="path" :d="linePath" fill="none" stroke="blue" stroke-width="0.01"></path>
      </svg>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import { fnv1a } from '@/utils'

import shortid from 'shortid'

import Point, { Vector } from './Point'
import Edge from './Edge.vue'

@Component
export default class PatternLock extends Vue {
  public name = 'pattern-lock'

  @Prop({ default: 'SEED_CHANGE_ME_TO_USERNAME_OR_OTHER_SECRET' })
  private seed!: string

  private points: Point[] = []
  private edges: Edge[] = []

  private lastActivePoint: Vector = [0, 0]
  private line: Vector[] = []

  private containerRect!: ClientRect

  private isPointerdown: boolean = false

  public constructor() {
    super()

    // Seed shortid before creating values for points
    shortid.seed(fnv1a(this.seed))

    for (let i = 0; i < 9; i++) {
      this.points.push(new Point(shortid.generate()))
    }
  }

  public mounted() {
    // Retrieve container size in screen space
    this.containerRect = (this.$refs.container as HTMLElement).getBoundingClientRect()

    // Retrieve points position after mount
  }

  private vectorToStr(v: Vector): string {
    return v[0] + ' ' + v[1]
  }

  private get linePath() {
    if (this.line.length >= 1) {
      let firstPoint = this.line[0]
      // move to (start)
      return `M ${this.vectorToStr(firstPoint)}` +
        // line to (each point in path)
        (this.line.slice(1).map((l: Vector) => ` L ${this.vectorToStr(l)}`))
        // Finish
        + ''
    }
  }

  /**
   * Convert from screen space to local coordinates(relative to container abs position)
   */
  private screenPositionToLocal(screenPos: Vector): Vector {
    return [screenPos[0] - this.containerRect.left,
    screenPos[1] - this.containerRect.top]
  }

  /**
   * Convert from screen space to normalized [0,1] coordinates
   */
  private screenPositionNormalized(screenPos: Vector): Vector {

    let posNormal: Vector = this.screenPositionToLocal(screenPos)
    let normX = posNormal[0] / this.containerRect.width
    let normY = posNormal[1] / this.containerRect.height

    return [normX, normY]
  }

  /**
   * Pattern drawing handling
   */
  private start(ev: PointerEvent) {
    let posScreen: Vector = [ev.clientX, ev.clientY];
    let posLocal: Vector = this.screenPositionNormalized(posScreen)

    this.line = [posLocal, posLocal]
    this.isPointerdown = true
  }

  private draw(ev: PointerEvent) {
    if (!this.isPointerdown) { return }

    let posScreen: Vector = [ev.clientX, ev.clientY];
    let posLocal: Vector = this.screenPositionNormalized(posScreen)

    const lastIdx = this.line.length - 1
    Vue.set(this.line, lastIdx, posLocal);
  }

  private end(ev: PointerEvent) {
    this.line = []
    this.isPointerdown = false
  }
}
</script>

<style lang="scss">
.patternlock {
  --padding: 50px;
  --background: #000;
  --dots: #fff;
  --success: #b4d455;
  --error: #e4504a;

  display: flex;
  padding: var(--padding);
  background-color: var(--background);

  &__container {
    position: relative;
    display: grid;
    width: 100%;
    grid-template-rows: 1fr 1fr 1fr;
    grid-template-columns: 1fr 1fr 1fr;
  }

  .quadrant {
    display: flex;
    align-items: center;
    justify-content: center;

    &.debug {
      outline: 1px dashed #bbbbbb;
    }
  }

  .point {
    padding: 0;
    border: 0;
    outline: 0;
    width: 0.5rem;
    height: 0.5rem;
    background-color: var(--dots);
    border-radius: 50%;
    overflow: hidden;
  }

  .line-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
}
</style>
