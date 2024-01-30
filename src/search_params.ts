const trueValues = ["", "true", "1", "yes", "y", "on"];
const falseValues = ["false", "0", "no", "n", "off"];

export class ExtendedSearchParams extends URLSearchParams {
  isTrue(key: string): boolean {
    return this.has(key) && trueValues.includes(this.get(key)!.toLowerCase());
  }
  isExplicitFalse(key: string): boolean {
    return falseValues.includes(this.get(key)?.toLowerCase() ?? "");
  }
}
