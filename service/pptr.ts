import puppeteer, { LaunchOptions } from "puppeteer";
import path from "path";

export type Node = {
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  width?: number;
  height?: number;
  selector?: string;
  name: string;
  font?: Record<string, string>;
  text?: string;
};

export type Link = { source: number; target: number };

export const run = async (url: string, options?: LaunchOptions) => {
  const browser = await puppeteer.launch(options);

  let page = await browser.newPage();
  await page.setBypassCSP(true);
  await page.setViewport({ width: 1400, height: 1000 });
  await page.goto(url, { waitUntil: "networkidle2" });
  await page.waitFor(1000);
  // await browser.close();
  const data = await page.evaluate(() => {
    const fontStyles: Record<string, { from: number; to: number[] }> = {};
    const is = <T>(_: unknown, y: boolean): _ is T => y;

    function isInView({
      top,
      left,
      // bottom,
      right,
    }: {
      top: number;
      left: number;
      bottom: number;
      right: number;
    }) {
      return (
        top >= 0 &&
        left >= 0 &&
        // bottom && // not check this one
        // bottom <=
        //   (window.innerHeight ||
        //     document.documentElement
        //       .clientHeight) &&
        right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }

    const nodes: Node[] = [];

    const links: { source: number; target: number }[] = [];
    let fontLabelY = 200;
    for (const styleSheet of Array.from(document.styleSheets)) {
      const rules = Array.from(styleSheet.cssRules);
      for (const rule of rules) {
        if (is<CSSStyleRule>(rule, rule.type === CSSRule.STYLE_RULE)) {
          // const props = Array.from(rule.style);

          const font: Record<string, string> = {};
          for (const name of Object.keys(rule.style)) {
            if (
              name.includes("font") &&
              //@ts-ignore
              rule.style[name] &&
              //@ts-ignore
              rule.style[name] !== "inherit"
            ) {
              //@ts-ignore
              font[name] = rule.style[name];
            }
          }

          if (!Object.keys(font).length) {
            continue;
          }

          for (const el of Array.from(
            document.querySelectorAll(rule.selectorText)
          )) {
            // const toMark = el;
            const {
              x, // format
              y, // format
              width, // format
              height, // format
              top,
              left,
              bottom,
              right,
            } = el.getBoundingClientRect();
            if (!isInView({ top, left, bottom, right })) {
              continue;
            }
            const fx = 500 + (x + width / 2) ?? -200;
            const fy = 200 + (y + height / 2);
            nodes.push({
              name: rule.selectorText,
              fx, // format
              fy, // format
              width, // format
              height, // format
              selector: rule.selectorText,
            });
            const text = JSON.stringify(font, null, 4)
              .replace("{\n", "")
              .replace("\n}", "");
            if (fontStyles[text]) {
              fontStyles[text].to.push(nodes.length - 1);
            } else {
              nodes.push({
                fx: 2000, // format
                fy: fontLabelY, // format
                name: rule.selectorText + `.text`,
                text,
              });
              fontStyles[text] = {
                from: nodes.length - 1,
                to: [nodes.length - 2],
              };
              const lines = text.split("\n");
              fontLabelY +=
                (lines.reduce(
                  (acc, curr) => acc + Math.floor(curr.length / 40),
                  0
                ) +
                  lines.length +
                  3) *
                20;
            }
          }
        }

        // if (is<CSSMediaRule>(rule, rule.type === CSSRule.MEDIA_RULE)) {
        //   console.log(rule.cssText);
        // }
      }
    }
    Object.values(fontStyles).forEach((style) => {
      style.to.forEach((to) => {
        links.push({
          source: style.from,
          target: to,
        });
      });
    });

    return { nodes, links };
  });
  await page.waitFor(5000);
  await page.screenshot({ fullPage: true, path: "./pic.png" });

  const pathToHtml = path.join(__dirname, `../render.html`);
  page = await browser.newPage();
  await page.goto(`file:${pathToHtml}`, { waitUntil: "networkidle0" });
  await page.setViewport({ width: 2400, height: 1000 });

  await page.addScriptTag({
    content: `window.data=${JSON.stringify(data)};
  `,
  });

  await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;

    const maxHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );

    const svg = window.d3
      .select("body")
      .append("svg")
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .style("position", "absolute")
      .style("top", 0)
      .style("left", 0)
      .style("z-index", Number.MAX_SAFE_INTEGER.toString())
      .attr("width", 2400)
      .attr("height", maxHeight);
    // use foreignObject instead
    // const filter = svg
    //   .append("defs")
    //   .append("filter")
    //   .attr("id", "text-bg")
    //   .attr("x", 0)
    //   .attr("y", 0)
    //   .attr("width", 1)
    //   .attr("height", 1);
    // filter.append("feFlood").attr("flood-color", "white");
    // filter
    //   .append("feComposite")
    //   .attr("in", "SourceGraphic")
    //   .attr("operator", "xor");

    const { nodes, links } = window.data;

    const simulation = window.d3
      .forceSimulation()

      .nodes(nodes)
      .force("charge", window.d3.forceManyBody())
      .force("link", window.d3.forceLink(links).distance(100))
      //   .force("center", window.d3.forceCenter(700, 200))
      .force("x", window.d3.forceX())
      .force("y", window.d3.forceY())
      .on("tick", ticked);

    let link = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke-width", 1)
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "yellow")
      .attr("stroke-width", 1.5);

    let node = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke-width", 1)
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g");

    node
      .filter((d: any) => !d.text)
      .append("circle")
      .attr("data-x", (d: any) => d.text)
      .attr("r", 8)
      .attr("stroke", "yellow")
      .attr("fill", "#fff")
      .attr("fill-opacity", 0.5);

    node
      .append("foreignObject")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 400)
      .attr("height", 50)
      .style("overflow", "visible")
      .append("xhtml:div")
      .attr("xmlns", "http://www.w3.org/1999/xhtml")
      .style("width", 400)
      .style("height", 50)
      .style("white-space", "pre-line")
      .style("padding", "10px")
      .style("font-size", "14px")
      .style("text-align", "left")
      .style("transform", "translateY(-10px)")
      .style("font-size", "16px")
      .text((d: any) => d.text);
    // .attr("stroke", "#fff");

    // node
    //   .append("text")
    //   // .attr("stroke", "black")
    //   .attr("fill", "black")
    //   // .style("text-anchor", "middle")
    //   .attr("x", 8)
    //   .attr("y", "0.31em")
    //   .text((d: any) => d.text)
    //   //   .attr("stroke", "#fff")
    //   .attr("stroke-width", 1);

    function ticked() {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    }
  });
  await page.waitFor(1000);
  await page.evaluate(() => {
    const svg = document.querySelector("svg")!;
    const bbox = svg.getBBox()!;
    // Update the width and height using the size of the contents
    svg?.setAttribute("height", (bbox.y + bbox.height + bbox.y).toString());
  });
  await page.screenshot({ fullPage: true, path: "./done.png" });

  // console.log(JSON.stringify(data, null, 4));
  await browser.close();
};

run("https://video.unext.jp/", {
  headless: false,
  args: ["--disable-web-security"],
});
