import type { ChatGateway } from "@/frontend/application/ports";

export const tawkChatGateway: ChatGateway = {
  embed(link) {
    const [, , propertyId, widgetId] = new URL(link).pathname.split("/");
    const containerId = `tawk_${propertyId}`;
    // Both IDs are validated by the application. The vendor's script and
    // branding stay inside this document, without a second website launcher.
    return {
      document: `<!doctype html>
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
var state="loading";
function notify(type){state=type;window.parent.postMessage({type:type},window.origin)}
window.addEventListener("message",function(event){
  if(event.source===window.parent && event.origin===window.origin && event.data && event.data.type==="thanhphong:chat:probe" && state!=="loading") notify(state);
});
var Tawk_API={embedded:"${containerId}",onLoad:function(){notify("thanhphong:chat:ready")}},Tawk_LoadStart=new Date();
var script=document.createElement("script");
script.async=true;
script.src="https://embed.tawk.to/${propertyId}/${widgetId}";
script.charset="UTF-8";
script.crossOrigin="anonymous";
script.onerror=function(){notify("thanhphong:chat:error")};
document.head.appendChild(script);
</script></body></html>`,
    };
  },
};
