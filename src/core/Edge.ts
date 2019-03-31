import Point from './Point'

export default class Edge {
  public a: Point
  public b: Point

  public constructor(a: Point, b: Point) {
    this.a = a
    this.b = b
  }

  public valueOf(): number {
    // tslint:disable-next-line: no-bitwise
    return (this.a.valueOf() ^ this.b.valueOf()) 
  }
}
