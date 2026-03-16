export interface StringFeature {

  /**
   * Placeholder should be two characters, the opener and the closer. An identifier may be placed in between the two placeholder characters.
   */
  placeholder?: string;

  /**
   * The idSeparator should be a single character. Separates the placeholder identifier which may be a number or a string matching the identifier pattern /[a-z_][a-z0-9_-]*\/i from the optional formatting parameters.
   */
  idSeparator?: string;
}
