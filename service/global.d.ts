import D3 from "d3";
import type { Node, Link } from "./pptr";

declare global {
  interface Window {
    d3: typeof D3;
    data: {
      title: string;
      file: string;
      nodes: Node[];
      links: Link[];
      medias: string[];
    };
  }
}
