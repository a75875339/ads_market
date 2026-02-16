export const NumberRegex = new RegExp(
  '^' + // No leading content.
    '[-+]?' + // Optional sign.
    '(?:[0-9]{0,30}\\.)?' + // Optionally 0-30 decimal digits of mantissa.
    '[0-9]{1,30}' + // 1-30 decimal digits of integer or fraction.
    '(?:[Ee][-+]?[1-2]?[0-9])?' + // Optional exponent 0-29 for scientific notation.
    '$', // No trailing content.
)
