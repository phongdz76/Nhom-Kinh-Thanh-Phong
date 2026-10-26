import { tawkChatLinkSchema } from "@/domain/schemas";

// Only this embedded document allows vendor inline scripts. The website keeps
// its nonce-based strict CSP. No customer data or authentication is rendered here.
export const chatFramePolicy = [
  "default-src 'none'",
  "script-src 'unsafe-inline' https://*.tawk.to",
  "style-src 'unsafe-inline' https://*.tawk.to https://fonts.googleapis.com",
  "img-src data: blob: https:",
  "font-src 'self' data: https://*.tawk.to https://fonts.gstatic.com",
  "connect-src https://*.tawk.to https://*.tawk.link wss://*.tawk.to",
  "frame-src 'self' https://*.tawk.to",
  "media-src blob: https://*.tawk.to https://*.tawk.link",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self' https://*.tawk.to",
  "frame-ancestors 'self'",
].join("; ");

export function createChatFrame(link: string) {
  // Validate again at the HTTP boundary before interpolating either ID in HTML.
  const [, , propertyId, widgetId] = new URL(
    tawkChatLinkSchema.parse(link),
  ).pathname.split("/");
  const containerId = `tawk_${propertyId}`;
  return `<!doctype html>
<html lang="vi">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
html,body{margin:0;width:100%;height:100%;background:#fff}
body{overflow:auto}
#${containerId}{width:100%;height:100%;min-height:0}
#${containerId} iframe{max-width:100%}
</style></head>
<body><div id="${containerId}"></div>
<script>
var state="loading",checkTimer;
// Reuse Next's self-hosted font, including its Vietnamese glyphs and weights.
// Styling only text containers leaves the vendor's icon fonts intact.
var chatFont="Arial, Helvetica, sans-serif",fontFaces="";
try{
  var siteDocument=window.parent.document;
  var siteFont=window.parent.getComputedStyle(siteDocument.body).getPropertyValue("--font-geist-sans").trim();
  if(siteFont){
    chatFont=siteFont+", Arial, sans-serif";
    var families=siteFont.replace(/["']/g,"").split(",").map(function(name){return name.trim()});
    fontFaces=Array.from(siteDocument.styleSheets).flatMap(function(sheet){
      try{return Array.from(sheet.cssRules).filter(function(rule){
        return rule.type===5 && families.includes(rule.style.fontFamily.replace(/["']/g,""));
      }).map(function(rule){return rule.cssText})}catch(error){return []}
    }).join("\\n");
  }
}catch(error){}
var typography=fontFaces+"\\nhtml body,html body.font-lato,html.font-lato{font-family:"+chatFont+"!important}"+
  "html body .tawk-input,html body .tawk-select,html body .tawk-textarea,html body .tawk-chatinput-editor,html body .tawk-form-label,html body .tawk-timeago{font-family:"+chatFont+"!important}";
var styledDocuments=new WeakSet();
function applyTypography(doc){
  if(!doc || !doc.head)return;
  if(!doc.getElementById("thanhphong-chat-typography")){
    var style=doc.createElement("style");
    style.id="thanhphong-chat-typography";
    style.textContent=typography;
    doc.head.appendChild(style);
  }
  if(!styledDocuments.has(doc)){
    styledDocuments.add(doc);
    doc.addEventListener("load",function(event){
      if(event.target && event.target.tagName==="IFRAME")applyTypography(doc);
    },true);
  }
  Array.from(doc.querySelectorAll("iframe")).forEach(function(frame){
    try{applyTypography(frame.contentDocument)}catch(error){}
  });
}
applyTypography(document);
function notify(type){state=type;window.parent.postMessage({type:type},window.location.origin)}
window.addEventListener("message",function(event){
  if(event.source===window.parent && event.origin===window.location.origin && event.data && event.data.type==="thanhphong:chat:probe" && state!=="loading") notify(state);
});
function hasContent(root){
  if(!root)return false;
  if(root.querySelector("input,textarea,button,[contenteditable=true]"))return true;
  return Array.from(root.querySelectorAll("iframe")).some(function(frame){
    try{return hasContent(frame.contentDocument && frame.contentDocument.body)}catch(error){return false}
  });
}
var Tawk_API={embedded:"${containerId}",disableWidgetFont:true,onLoad:function(){
  applyTypography(document);
  var deadline=Date.now()+20000;
  function check(){
    applyTypography(document);
    if(hasContent(document.getElementById("${containerId}")))notify("thanhphong:chat:ready");
    else if(Date.now()>=deadline)notify("thanhphong:chat:error");
    else checkTimer=setTimeout(check,100);
  }
  check();
}},Tawk_LoadStart=new Date();
window.addEventListener("pagehide",function(){clearTimeout(checkTimer)});
var script=document.createElement("script");
script.async=true;
script.src="https://embed.tawk.to/${propertyId}/${widgetId}";
script.charset="UTF-8";
script.crossOrigin="anonymous";
script.onerror=function(){notify("thanhphong:chat:error")};
document.head.appendChild(script);
</script></body></html>`;
}
