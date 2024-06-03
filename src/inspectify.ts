import { type Serializable } from './types';

export type InspectifyOptions = {
  maxDepth?: number;
  maxEdges?: number;
};

export function inspectify(value: any, options?: InspectifyOptions): Serializable {
  return recursive({
    value,
    seen: new Set(),
    depth: 0,
    maxDepth: options?.maxDepth ?? 20,
    maxEdges: options?.maxEdges ?? 200,
  });
}

const ERROR_KEYS: (keyof Error)[] = ['name', 'message', 'stack', 'cause'];

type RecursiveParams = {
  value: any;
  seen: Set<object>;
  depth: number;
  maxDepth: number;
  maxEdges: number;
};

function recursive(params: RecursiveParams): Serializable {
  const {
    value,
    seen,
    depth,
    maxDepth,
    maxEdges,
  } = params;
  
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'undefined':
      return value;
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
      
      const result: { [key: string]: Serializable } = {};
      
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
      return `[unknown: ${'' + value}]`;
  }
}
