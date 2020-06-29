import puppeteer, { LaunchOptions } from "puppeteer";

export const run = async (url: string, options?: LaunchOptions) => {
  const browser = await puppeteer.launch(options);

  const page = await browser.newPage();
  await page.setBypassCSP(true);
  await page.setViewport({ width: 1400, height: 1000 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitFor(1000);

  await page.addScriptTag({ url: `https://d3js.org/d3.v5.min.js` });
  await page.addStyleTag({
    content: `text {
       pointer-events: none;
       font-size: 18px;
     }`,
  });
  // await browser.close();
  const data = await page.evaluate(() => {
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
      .style("position", "fixed")
      .style("top", 0)
      .style("left", 0)
      .style("z-index", Number.MAX_SAFE_INTEGER.toString())
      .attr("width", 1400)
      .attr("height", maxHeight);

    const filter = svg
      .append("defs")
      .append("filter")
      .attr("id", "text-bg")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 1)
      .attr("height", 1);
    filter.append("feFlood").attr("flood-color", "white");
    filter
      .append("feComposite")
      .attr("in", "SourceGraphic")
      .attr("operator", "xor");
    const fontStyles: Record<string, { from: number; to: number[] }> = {};
    const is = <T>(_: unknown, y: boolean): _ is T => y;

    const nodes: {
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
    }[] = [];

    const links: { source: number; target: number }[] = [];

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
            } = el.getBoundingClientRect();
            const fx = x + width / 2 ?? 500;
            const fy = y + height / 2 ?? 500;
            nodes.push({
              name: rule.selectorText,
              fx, // format
              fy, // format
              width, // format
              height, // format
              selector: rule.selectorText,
            });
            const text = JSON.stringify(font);
            if (fontStyles[text]) {
              fontStyles[text].to.push(nodes.length - 1);
            } else {
              nodes.push({
                // x: x + width / 2, // format
                // y: y + height / 2, // format
                name: rule.selectorText + `.text`,
                text,
              });
              fontStyles[text] = {
                from: nodes.length - 1,
                to: [nodes.length - 2],
              };
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

    console.log({ nodes, links });
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
      .attr("stroke", "#000")
      .attr("stroke-width", 1);

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
      .attr("stroke", "black")
      .attr("fill", "#fff")
      .attr("fill-opacity", 0.5);

    node
      .append("text")
      .attr("filter", "url(#text-bg)")
      .attr("x", 8)
      .attr("y", "0.31em")
      .text((d: any) => d.text);
    // .attr("stroke", "#fff");

    node
      .append("text")
      // .attr("stroke", "black")
      .attr("fill", "black")
      // .style("text-anchor", "middle")
      .attr("x", 8)
      .attr("y", "0.31em")
      .text((d: any) => d.text)
      //   .attr("stroke", "#fff")
      .attr("stroke-width", 1);

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

    return nodes;
  });
  await page.waitFor(20000);
  await page.screenshot({ fullPage: true, path: "./pic.png" });
  console.log(JSON.stringify(data, null, 4));
  await browser.close();
};

run("https://www.google.com", {
  headless: false,
  args: ["--disable-web-security"],
});
