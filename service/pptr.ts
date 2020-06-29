import puppeteer, { LaunchOptions } from "puppeteer";

export const run = async (url: string, options?: LaunchOptions) => {
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.waitFor(1000);
  await page.addScriptTag({ url: `https://d3js.org/d3.v5.min.js` });
  // other actions...
  // await browser.close();
  const data = await page.evaluate(() => {
    const is = <T>(_: unknown, y: boolean): _ is T => y;
    const fonts: {
      x: number;
      y: number;
      width: number;
      height: number;
      selector: string;
      font: Record<string, string>;
    }[] = [];
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
            const toMark = el;
            const {
              x, // format
              y, // format
              width, // format
              height, // format
            } = el.getBoundingClientRect();
            fonts.push({
              x, // format
              y, // format
              width, // format
              height, // format
              selector: rule.selectorText,
              font,
            });
            // const position = x || y || width || height;
            // const div = document.createElement("div");
            // if (position) div.style.position = "fixed";
            // div.style.left = x.toString() + "px";
            // div.style.top = y.toString() + "px";
            // div.style.height = width.toString() + "px";
            // div.style.width = height.toString() + "px";
            // div.style.outline = "2px red solid";
            // div.style.color = "red";
            // // div.style.background = "#fff";
            // // div.style.boxShadow = "0 0 5px #ccc";
            // div.style.zIndex = Number.MAX_SAFE_INTEGER.toString();
            // div.textContent = JSON.stringify(font);
            // document.documentElement.appendChild(div);
            break; // do only once
          }
        }

        // if (is<CSSMediaRule>(rule, rule.type === CSSRule.MEDIA_RULE)) {
        //   console.log(rule.cssText);
        // }
      }
    }
    return fonts;
  });
  await page.screenshot({ fullPage: true, path: "./pic.png" });
  console.log(JSON.stringify(data, null, 4));
};

run("http://www.google.com/", { headless: false });
