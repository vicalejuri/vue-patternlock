<template></template>

<script lang='ts'>
import { hash } from '@/utils'

import Point from './Point'

export default class Edge {
  public a: Point
  public b: Point

  public hash: string

  public constructor(a: Point, b: Point) {
    this.a = a
    this.b = b

    this.hash = ''
  }

  public hashIt(): string {
    return hash(this.a.toString() + this.b.toString())
  }
}
</script>

<style>
</style>
