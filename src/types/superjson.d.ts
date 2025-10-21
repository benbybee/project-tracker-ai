declare module 'superjson' {
  const superjson: {
    parse: <T>(json: string) => T;
    stringify: <T>(value: T) => string;
    serialize: <T>(value: T) => { json: string; meta: any };
    deserialize: <T>(serialized: { json: string; meta: any }) => T;
  };
  export default superjson;
}
