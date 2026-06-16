import { Crosshair, Maximize2 } from "lucide-react";
import { Button } from "../ui/Button";
import { WindowFrame } from "../ui/WindowFrame";

export function ScreenshotOverlayWindow() {
  return (
    <WindowFrame title="截图 / OCR 框选" subtitle="第一阶段预留窗口">
      <div className="grid h-full place-items-center p-6">
        <div className="w-full max-w-lg rounded-lg border border-dashed border-primary/50 bg-panel/80 p-8 text-center">
          <Crosshair className="mx-auto text-primary" size={34} />
          <h2 className="mt-4 text-lg font-semibold">ScreenshotOverlayWindow</h2>
          <p className="mt-2 text-sm leading-6 text-muted">TODO: 接入截图框选、OCR 调用和截图翻译流程。</p>
          <div className="mt-5 flex justify-center">
            <Button icon={<Maximize2 size={16} />}>预留框选区域</Button>
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}
