import { Crosshair, Maximize2 } from "lucide-react";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/Material";
import { WindowFrame } from "../ui/WindowFrame";

export function ScreenshotOverlayWindow() {
  return (
    <WindowFrame title="截图 / OCR" subtitle="预留窗口">
      <div className="grid h-full place-items-center bg-app p-8">
        <EmptyState
          icon={<Crosshair size={24} />}
          title="截图框选区域"
          description="后续会在这里接入截图框选、OCR 调用和截图翻译流程。"
        />
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
          <Button icon={<Maximize2 size={16} />}>预留框选区域</Button>
        </div>
      </div>
    </WindowFrame>
  );
}
