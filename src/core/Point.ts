export type Vector = [
  number,
  number
]

export interface IVector extends Array<Vector> { }

export default class Point {
  public checked: boolean
  public pos: Vector

  private uid!: number
  public constructor(uid: number) {
    this.uid = uid
    this.pos = [0, 0]
    this.checked = false
  }

  public reset() {
    this.checked = false
    this.pos = [0, 0]
  }

// tslint:disable-next-line: no-bitwise
  public valueOf() { return this.uid >>> 0 }
}
