export type Serializable =
  | string
  | number
  | boolean
  | undefined
  | null
  | Serializable[]
  | { [key: string]: Serializable }
;
