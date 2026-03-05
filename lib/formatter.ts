export interface Formatter<In, Out = unknown> {
  (input: In[]): Out[];
}
