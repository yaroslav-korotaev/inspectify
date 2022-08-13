export type JsonOrUndefined =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonOrUndefined[]
  | { [key: string]: JsonOrUndefined }
;

const ERROR_KEYS: (keyof Error)[] = ['name', 'message', 'stack', 'cause'];

type RecursiveOptions = {
  value: any;
  seen: Set<object>;
  depth: number;
  maxDepth: number;
  maxEdges: number;
};

function recursive(options: RecursiveOptions): JsonOrUndefined {
  const {
    value,
    seen,
    depth,
    maxDepth,
    maxEdges,
  } = options;
  
  switch (typeof value) {
    case 'object':
      if (value == null) {
        return value;
      }
      
      if (seen.has(value)) {
        return '[circular]';
      }
      
      seen.add(value);
      
      if (Buffer.isBuffer(value)) {
        return `[buffer: ${value.toString('hex')}]`;
      }
      
      if (value instanceof Date) {
        return `[date: ${value.toISOString()}]`;
      }
      
      const dive = (value: any) => recursive({
        value,
        seen,
        depth: depth + 1,
        maxDepth,
        maxEdges,
      });
      
      if (Array.isArray(value)) {
        if (depth > maxDepth) {
          return '[array]';
        }
        
        const result = value.slice(0, maxEdges).map(dive);
        
        if (value.length > maxEdges) {
          result.push(`[...${value.length - maxEdges}]`);
        }
        
        return result;
      }
      
      if (depth > maxDepth) {
        return '[object]';
      }
      
      const result: { [key: string]: JsonOrUndefined } = {};
      
      if (value instanceof Error) {
        for (const key of ERROR_KEYS) {
          result[key] = dive(value[key]);
        }
      }
      
      const keys = Object.keys(value);
      for (const key of keys.slice(0, maxEdges)) {
        result[key] = dive(value[key]);
      }
      
      if (keys.length > maxEdges) {
        result['...'] = keys.length - maxEdges;
      }
      
      return result;
    case 'function':
      return `[function: ${value.name || 'anonymous'}]`;
    case 'bigint':
      return `[bigint: ${value.toString()}]`;
    case 'symbol':
      return `[symbol: ${value.toString()}]`;
    default:
      return value as JsonOrUndefined;
  }
}

export type InspectifyOptions = {
  maxDepth?: number;
  maxEdges?: number;
};

export function inspectify(value: any, options?: InspectifyOptions): JsonOrUndefined {
  return recursive({
    value,
    seen: new Set(),
    depth: 0,
    maxDepth: options?.maxDepth ?? 20,
    maxEdges: options?.maxEdges ?? 200,
  });
}
