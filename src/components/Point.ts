export type Vector = [
  number,
  number
]

export default class Point {
  public checked: boolean = false
  private uid!: string
  private pos: Vector = [0, 0]

  public constructor(uid: string) {
    this.uid = uid
  }

  public reset() {
    this.checked = false
  }

  public toString() { return this.uid }
}
