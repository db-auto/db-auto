export function cleanLineEndings ( text: string ) {
  return text.replace ( /((?<!\r)\n|\r(?!\n))/g, '\r\n' )
}