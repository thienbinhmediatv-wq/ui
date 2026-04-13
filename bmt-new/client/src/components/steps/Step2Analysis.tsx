import { StepWrapper } from "./StepWrapper";
import type { Project } from "@shared/schema";
import { Sparkles, ChevronLeft, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  project: Project;
  stepStatus: string;
  onProcess: () => void;
  onApprove: () => void;
  onRedo: () => void;
  onGoBack?: () => void;
  backLabel?: string;
  isProcessing: boolean;
  isApproving: boolean;
}

export function Step2Analysis({ project, stepStatus, onProcess, onApprove, onRedo, onGoBack, backLabel, isProcessing, isApproving }: Props) {
  const analysis = project.analysisResult as Record<string, string> | null;
  const layout = project.layoutResult as { floors?: Array<{ floor: number; rooms: Array<{ name: string; w: number; h: number }> }> } | null;
  const queryClient = useQueryClient();
  const isPendingOrSubmitted = stepStatus === "pending" || stepStatus === "submitted";
  const isProcessingState = stepStatus === "processing";
  const isErrorState = stepStatus === "error";

  const requiredProjectFields: Array<{ key: string; label: string; isMissing: boolean }> = [
    { key: "title", label: "Tên dự án", isMissing: !project.title?.trim() },
    { key: "landWidth", label: "Chiều rộng khu đất", isMissing: !(Number(project.landWidth) > 0) },
    { key: "landLength", label: "Chiều dài khu đất", isMissing: !(Number(project.landLength) > 0) },
    { key: "floors", label: "Số tầng", isMissing: !(Number(project.floors) > 0) },
    { key: "bedrooms", label: "Số phòng ngủ", isMissing: !(Number(project.bedrooms) > 0) },
    { key: "bathrooms", label: "Số phòng vệ sinh", isMissing: !(Number(project.bathrooms) > 0) },
    { key: "style", label: "Phong cách thiết kế", isMissing: !project.style?.trim() },
    { key: "budget", label: "Ngân sách", isMissing: !(Number(project.budget) > 0) },
  ];
  const missingRequiredFields = requiredProjectFields.filter((field) => field.isMissing);
  const hasMissingRequiredInputs = missingRequiredFields.length > 0;

  const handleBackToStep1 = async () => {
    const res = await fetch(`/api/projects/${project.id}/step/1/redo`, { method: "POST" });
    if (res.ok) queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id] });
  };

  return (
    <StepWrapper
      title="Bước 2: Phân tích hiện trạng & Tạo Layout"
      description="AI phân tích khu đất và tự động tạo bố trí layout phòng."
      stepStatus={stepStatus}
      onProcess={onProcess}
      onApprove={onApprove}
      onRedo={onRedo}
      onGoBack={onGoBack}
      backLabel={backLabel}
      isProcessing={isProcessing}
      isApproving={isApproving}
      loadingContent={
        <div className="rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center" style={{ borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.06)" }} data-testid="step2-loading-analysis">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="mt-4 font-semibold text-sm text-blue-700 dark:text-blue-300">AI đang phân tích hiện trạng khu đất và tạo layout phòng...</p>
          <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-300/80">Quá trình này có thể mất vài phút tùy độ phức tạp.</p>
        </div>
      }
      resultContent={
        <div className="space-y-5">
          {analysis && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Kết quả phân tích AI
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                  <span className="text-xs text-muted-foreground">Kích thước</span>
                  <p className="text-sm font-semibold">{analysis.dimensions}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                  <span className="text-xs text-muted-foreground">Diện tích</span>
                  <p className="text-sm font-semibold">{analysis.area}</p>
                </div>
              </div>
              {analysis.aiAnalysis && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 text-sm whitespace-pre-wrap max-h-80 overflow-y-auto" data-testid="text-ai-analysis">
                  {analysis.aiAnalysis}
                </div>
              )}
            </div>
          )}

          {layout && layout.floors && (
            <div>
              <h3 className="font-semibold mb-3">Layout phòng (AI đề xuất)</h3>
              {layout.floors.map(floor => (
                <div key={floor.floor} className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Tầng {floor.floor}</p>
                  <div className="bg-slate-100 rounded-xl p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {floor.rooms.map((room, i) => (
                        <div
                          key={i}
                          className="bg-white border-2 border-primary/20 rounded-lg p-3 text-center hover:border-primary/50 transition-colors"
                          data-testid={`layout-room-${floor.floor}-${i}`}
                        >
                          <p className="text-xs font-semibold text-primary">{room.name}</p>
                          <p className="text-xs text-muted-foreground">{room.w}m x {room.h}m</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {isPendingOrSubmitted && hasMissingRequiredInputs && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Thiếu dữ liệu bắt buộc từ Bước 1. Vui lòng bổ sung trước khi chạy phân tích.</p>
            <p className="text-xs text-amber-700/90 dark:text-amber-300/90">Thiếu: {missingRequiredFields.map((field) => field.label).join(", ")}.</p>
            <div>
              <Button
                onClick={handleBackToStep1}
                variant="outline"
                className="border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Hoàn thiện dữ liệu Bước 1
              </Button>
            </div>
          </div>
        )}

        {isErrorState && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 space-y-3">
            <p className="text-sm text-red-700 dark:text-red-300">AI xử lý ở Bước 2 chưa thành công. Bạn có thể thử xử lý lại ngay.</p>
            <div>
              <Button onClick={onProcess} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">
                <RotateCcw className="w-4 h-4 mr-2" /> Thử xử lý lại
              </Button>
            </div>
          </div>
        )}

        {isPendingOrSubmitted && !hasMissingRequiredInputs && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">Dữ liệu đầu vào đã sẵn sàng. Nhấn <strong>Tiếp tục</strong> để bắt đầu phân tích hiện trạng và tạo layout.</p>
          </div>
        )}

        {isProcessingState && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">Hệ thống đang xử lý dữ liệu kiến trúc và sinh phương án layout tự động.</p>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700">
            AI sẽ phân tích: hướng nhà, ánh sáng tự nhiên, thông gió, phong thủy sơ bộ. Sau đó tự động tạo bố trí layout phòng cho {project.floors} tầng.
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 space-y-2 text-sm">
          <p><strong>Kích thước:</strong> {project.landWidth}m x {project.landLength}m ({project.landWidth * project.landLength} m²)</p>
          <p><strong>Tầng:</strong> {project.floors} | <strong>Phòng ngủ:</strong> {project.bedrooms}</p>
          <p><strong>Phong cách:</strong> {project.style}</p>
        </div>
      </div>
    </StepWrapper>
  );
}
