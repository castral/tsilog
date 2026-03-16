/**
 * The following rules govern the interpretation of a multiline raw string literal:
 *
 *     The opening quotes must be the last non-whitespace characters on their line, and the closing quotes must be the first non-whitespace characters on their line.
 *     Any whitespace to the left of the closing quotes is removed from all lines of the raw string literal.
 *     Any whitespace following the opening quotes on the same line is ignored.
 *     Whitespace-only lines following the opening quote are included in the string literal.
 *     The newline before the closing quotes isn't included in the literal string.
 *     When whitespace precedes the end delimiter on the same line, the exact number and kind of whitespace characters (for example, spaces vs. tabs) must exist at the beginning of each content line. Specifically, a space doesn't match a horizontal tab, and vice versa.
 *
 */

// style support is added via name after the opening raw literal quotes before the first newline character.
/**
 * escaping newlines and whitespace:
 * ```TypeScript
 *  const multiline = `'''
 *    this is the first line\
 *    this is the second line
 *  '''`;
 * ```
 * the resulting output value of `multiline` would be:
 * ```TypeScript
 * 'This is the first linethis is the second line'
*  ````
  */
