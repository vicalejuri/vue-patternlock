export type Vector = [
  number,
  number
]

export default class Point {
  public checked: boolean
  public pos: Vector
  private uid!: string

  public constructor(uid: string) {
    this.uid = uid
    this.pos = [0, 0]
    this.checked = false
  }

  public reset() {
    this.checked = false
    this.pos = [0, 0]
  }

  public toString() { return this.uid.toString().toLowerCase() }
}
