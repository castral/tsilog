export interface Reporter<Out> {
  (output: Out[]): void;
}
