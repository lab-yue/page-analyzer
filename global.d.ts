import D3 from "d3";
import type { Node, Link } from "./service/pptr";

declare global {
  interface Window {
    d3: typeof D3;
    data: { nodes: Node[]; links: Link[] };
  }
}
