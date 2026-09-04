const BLOCKED = /<script|javascript:|on\w+=|xlink:href|foreignObject/i;

export function isSvgSafe(svg: string) {
  return !BLOCKED.test(svg);
}

export function sanitizeSvg(svg: string) {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}
