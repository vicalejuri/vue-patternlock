import sha256, { Hash, HMAC } from "fast-sha256";

/**
 * Helpers
 */
export const compose = (...fns: any[]) => {
  const [tailFn, ...restFns] = fns.reverse();
  return (...args: any[]) => restFns.reduce((value, fn) => fn(value), tailFn(...args));
};
export const pipe = (...fns: any[]) => compose(...fns.reverse());

/** Digest UINT8Array to hexadecimal(ASCII) format */
declare const Buffer: any;
export function Uint2hex(x: Uint8Array) { return (new Buffer(x).toString('hex')) }

/** Convert js String to a UINT32 number */
export function str2Uint32(x: string) : number {
  // tslint:disable: no-bitwise
  return x.split("")
    .map(a => a.charCodeAt(0))
    .reduce((a, b) => (a * b) ^ (b ** 1 / b) % Number.MAX_SAFE_INTEGER) 

    // Hack to convert to UINT32
    >>> 0;
}

/** Convert JS string to an Raw Array of UInt8 (ASCII|Unicode) */
function str2Uint8(x: string): Uint8Array {
  return Uint8Array.from(
    x.split('').map<number>(
      (c: string, i: number) => (c.codePointAt(0) || 0)
    )
  )
}
export const digest = Uint2hex;

/** Hash functions */
export const hash = pipe(str2Uint8, sha256)
export const hashDigest = pipe(hash, digest)

// Fast hash and checksum
// https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function
const FNV_PRIME = 1099511628211;
const FNV_OFFSET = 14695981039346656037 ;
export function fnv1a(x: string) {
  return (
    x
      .padStart(32, '.!')
      .split("")
      .map((c, i) => c.charCodeAt(0))

      // fnv over each character
      .reduce((a: number, b: number) => {
        // tslint:disable-next-line: no-bitwise
        return ((b ^ a) * FNV_PRIME) % Number.MAX_SAFE_INTEGER;
      }, FNV_OFFSET)

  );
}
