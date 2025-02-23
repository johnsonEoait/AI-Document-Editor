declare module 'html-docx-js/dist/html-docx' {
  interface HtmlDocx {
    asBlob: (html: string) => Blob;
  }
  const htmlDocx: HtmlDocx;
  export default htmlDocx;
} 