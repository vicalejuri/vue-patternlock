export type Vector = [
  number,
  number
]

export default class Point {
  public checked: boolean = false
  public pos: Vector = [0, 0]
  private uid!: string

  public constructor(uid: string) {
    this.uid = uid
  }

  public reset() {
    this.checked = false
  }

  public toString() { return this.uid }
}
