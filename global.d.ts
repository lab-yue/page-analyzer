import D3 from "d3";
declare global {
  interface Window {
    d3: typeof D3;
  }
}
