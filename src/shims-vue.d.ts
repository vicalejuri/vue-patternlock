declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}

declare module 'lighterhtml' {
  export function svg(chunks: TemplateStringsArray, ...interpolations: any[]) : SVGElement
  export function html(chunks: TemplateStringsArray, ...interpolations: any[]) : HTMLElement
}