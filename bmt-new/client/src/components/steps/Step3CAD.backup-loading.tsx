import { useState } from "react";
import { StepWrapper } from "./StepWrapper";
import type { Project } from "@shared/schema";
import { FileText, Ruler, Layers, Grid3X3, ArrowUpDown, Building2, Download, GitBranch, AlertTriangle, XCircle, Eye, EyeOff, FolderOpen, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Props {
  project: Project;
  stepStatus: string;
  stepNumber?: number;
  projectId?: number;
  onProcess: () => void;
  onApprove: () => void;
  onRedo: () => void;
  onGoBack?: () => void;
  backLabel?: string;
  isProcessing: boolean;
  isApproving: boolean;
}

type ViewMode = "combined" | "ai" | "technical";

export function Step3CAD({ project, stepStatus, stepNumber, projectId, onProcess, onApprove, onRedo, onGoBack, backLabel, isProcessing, isApproving }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("combined");
  const [dxfDownloading, setDxfDownloading] = useState(false);

  async function handleExportDXF() {
    if (!projectId) return;
    setDxfDownloading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/export-dxf`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Lỗi không xác định" }));
        alert("Xuất DXF thất bại: " + (err.message ?? res.statusText));
        return;
      }
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `CAD_project_${projectId}.dxf`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Lỗi khi tải file DXF: " + (e?.message ?? e));
    } finally {
      setDxfDownloading(false);
    }
  }

  const cadResult = project.cadResult as {
    cadDrawings?: Array<{ name: string; type: string; imageUrl?: string; overlayUrl?: string; floor?: number }>;
    svgFloorplans?: Array<{ floor: number; floorLabel: string; svgUrl: string }>;
    roomData?: Array<{
      floor: number;
      floorLabel: string;
      rooms: Array<{
        id: string; name: string; area: number; function: string;
        cxRatio: number; cyRatio: number; widthRatio: number; heightRatio: number;
      }>;
    }>;
    cadDescription?: string;
    dimensions?: {
      totalArea: number;
      wallThickness: number;
      floorHeight: number;
      setback?: string;
      stairSteps?: number;
      titleBlock?: string;
      layers?: string[];
      scale?: string;
    };
  } | null;

  const hasSVG = (cadResult?.svgFloorplans?.length ?? 0) > 0;
  const formattedErrors = (cadResult as any)?.formattedValidationErrors as Array<{ type: string; detail: string; consequence: string }> | undefined;
  const hasValidationErrors = (formattedErrors?.length ?? 0) > 0 || ((cadResult as any)?.layoutValidationWarnings?.length ?? 0) > 0;

  return (
    <StepWrapper
      title="Bước 3: Bản vẽ CAD 2D chuẩn A/E"
      description="AI tạo mặt bằng từng tầng với title block BMT DECOR, dimension 3 lớp, grid references chuẩn kiến trúc."
      stepStatus={stepStatus}
      stepNumber={stepNumber}
      projectId={projectId}
      onProcess={onProcess}
      onApprove={onApprove}
      onRedo={onRedo}
      onGoBack={onGoBack}
      backLabel={backLabel}
      isProcessing={isProcessing}
      isApproving={isApproving}
      resultContent={
        cadResult ? (
          <div className="space-y-5">

            {/* Smart CAD Validation Errors */}
            {hasValidationErrors && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4" data-testid="cad-validation-errors">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span className="font-bold text-sm text-red-700">LỖI KIỂM TRA LAYOUT CAD</span>
                </div>
                <div className="space-y-3">
                  {formattedErrors?.length ? formattedErrors.map((err, i) => (
                    <div key={i} className="bg-white border border-red-100 rounded-lg p-3">
                      <div className="flex items-start gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                        <span className="font-semibold text-sm text-red-700">{err.type}</span>
                      </div>
                      <p className="text-xs text-gray-700 mb-1 pl-6">{err.detail}</p>
                      <p className="text-xs text-orange-700 font-medium pl-6">→ {err.consequence}</p>
                    </div>
                  )) : (cadResult as any)?.layoutValidationWarnings?.map((w: string, i: number) => (
                    <div key={i} className="bg-white border border-red-100 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-700">{w}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-800 font-medium">
                    💡 Để khắc phục: Quay lại Bước 2 và điều chỉnh bố trí phòng sao cho tổng chiều rộng không vượt quá {project.landWidth}m và tổng diện tích không quá 85% × {(project.landWidth * project.landLength).toFixed(0)}m² = {(project.landWidth * project.landLength * 0.85).toFixed(0)}m².
                  </p>
                </div>
              </div>
            )}

            {/* AI Layout Review Notes from Step 2 */}
            {(() => {
              const reviewNotes = (project.layoutResult as any)?.layoutReviewNotes as string[] | undefined;
              if (!reviewNotes?.length) return null;
              return (
                <div className="rounded-xl border-2 border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
                    <span className="font-bold text-sm text-yellow-700">NHẬN XÉT KIỂM DUYỆT LAYOUT (AI Review)</span>
                  </div>
                  <div className="space-y-2">
                    {reviewNotes.map((note, i) => (
                      <div key={i} className="bg-white border border-yellow-100 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-yellow-800">{note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Technical Specs Bar */}
            {cadResult.dimensions && (
              <div className="bg-slate-900 text-white rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-sm text-orange-400">THÔNG SỐ KỸ THUẬT — BMT DECOR STANDARD</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between bg-slate-800 rounded p-2">
                    <span className="text-slate-400">Tổng diện tích sàn</span>
                    <span className="font-bold text-white">{Number(cadResult.dimensions.totalArea).toFixed(2)} m²</span>
                  </div>
                  <div className="flex justify-between bg-slate-800 rounded p-2">
                    <span className="text-slate-400">Cao tầng thông thủy</span>
                    <span className="font-bold text-white">{cadResult.dimensions.floorHeight}m</span>
                  </div>
                  <div className="flex justify-between bg-slate-800 rounded p-2">
                    <span className="text-slate-400">Khoảng lùi</span>
                    <span className="font-bold text-orange-300">{cadResult.dimensions.setback || "1.2m"}</span>
                  </div>
                  {(cadResult.dimensions.stairSteps ?? 0) > 0 && (
                  <div className="flex justify-between bg-slate-800 rounded p-2">
                    <span className="text-slate-400">Bậc cầu thang (Sinh)</span>
                    <span className="font-bold text-orange-300">{cadResult.dimensions.stairSteps} bậc × 17cm</span>
                  </div>
                  )}
                  <div className="flex justify-between bg-slate-800 rounded p-2">
                    <span className="text-slate-400">Tỉ lệ bản vẽ</span>
                    <span className="font-bold text-white">{cadResult.dimensions.scale || "1/100"}</span>
                  </div>
                  <div className="flex justify-between bg-slate-800 rounded p-2">
                    <span className="text-slate-400">Tường ngoài / trong</span>
                    <span className="font-bold text-white">{cadResult.dimensions.wallThickness * 1000 || 200}mm / 100mm</span>
                  </div>
                </div>
                {cadResult.dimensions.layers && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {cadResult.dimensions.layers.map(l => (
                      <Badge key={l} variant="outline" className="text-xs border-orange-400/50 text-orange-300 bg-orange-950/30">
                        {l}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs border-slate-500 text-slate-300">
                      DIMENSION 3 LỚP
                    </Badge>
                    <Badge variant="outline" className="text-xs border-slate-500 text-slate-300">
                      GRID REFS
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Export to AutoCAD button */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-950 to-slate-900 rounded-xl border border-blue-700/40">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FolderOpen className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-sm text-white">Xuất file AutoCAD 2025</span>
                </div>
                <p className="text-xs text-slate-400">
                  Tải file <strong className="text-blue-300">.DXF</strong> — mở trực tiếp trong AutoCAD 2025, BricsCAD, LibreCAD. Đầy đủ layer: TUONG, CỬA, CỬA_SỔ, KT_CHIEU, VAN_BAN. Đơn vị mm, tỉ lệ 1:100.
                </p>
              </div>
              <button
                onClick={handleExportDXF}
                disabled={dxfDownloading}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors shrink-0 shadow-lg"
              >
                <Download className="w-4 h-4" />
                {dxfDownloading ? "Đang xuất..." : "Tải DXF"}
              </button>
            </div>

            {/* CAD Floor Plan Images — 3 Lớp Composite */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Bản vẽ Mặt bằng từng tầng
                </h3>
                {/* View mode toggle */}
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("combined")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === "combined" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    SVG
                  </button>
                  <button
                    onClick={() => setViewMode("ai")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === "ai" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    AutoCAD
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Fallback: hiển thị SVG trực tiếp khi cadDrawings rỗng */}
                {(!cadResult.cadDrawings || cadResult.cadDrawings.length === 0) && hasSVG &&
                  cadResult.svgFloorplans!.map((svgInfo, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm">
                      <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Grid3X3 className="w-4 h-4 text-orange-400" />
                          <span className="font-bold text-sm">{svgInfo.floorLabel} — Bản vẽ kỹ thuật</span>
                        </div>
                        <Badge variant="outline" className="text-xs border-orange-400 text-orange-300">TỈ LỆ 1/100</Badge>
                      </div>
                      <div className="bg-white p-2 overflow-hidden" style={{ position: "relative" }}>
                        <img
                          src={svgInfo.svgUrl}
                          alt={svgInfo.floorLabel}
                          className="w-full object-contain bg-white"
                          style={{ maxHeight: "700px", maxWidth: "100%" }}
                        />
                        {(() => {
                          const matchRoomData = cadResult.roomData?.find(r => r.floor === svgInfo.floor);
                          if (!matchRoomData?.rooms?.length) return null;
                          return (
                            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                              {matchRoomData.rooms.map((room, ri) => (
                                <div key={ri} style={{ position: "absolute", left: `${room.cxRatio * 100}%`, top: `${room.cyRatio * 100}%`, transform: "translate(-50%, -50%)`, textAlign: "center", lineHeight: 1.2 }}>
                                  <div style={{ fontSize: "clamp(6px, 1.2vw, 10px)", fontWeight: 700, color: "#111", fontFamily: "Arial Narrow, Arial, sans-serif", whiteSpace: "nowrap", textShadow: "0 0 3px white, 0 0 3px white" }}>{room.name}</div>
                                  <div style={{ fontSize: "clamp(5px, 1vw, 8px)", color: "#333", fontFamily: "Arial, sans-serif", whiteSpace: "nowrap", textShadow: "0 0 2px white" }}>{room.area}m²</div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))
                }

                {cadResult.cadDrawings?.map((d, i) => {
                  const matchSvg = cadResult.svgFloorplans?.find(s => s.floor === d.floor);

                  return (
                    <div key={i} className="rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm" data-testid={`cad-drawing-${i}`}>
                      <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Grid3X3 className="w-4 h-4 text-orange-400" />
                          <span className="font-bold text-sm">{d.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs border-orange-400 text-orange-300">TỈ LỆ 1/100</Badge>
                          <Badge variant="outline" className="text-xs border-slate-400 text-slate-300">
                            KT-{String(i + 1).padStart(2, "0")}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-white p-2 overflow-hidden">
                        {viewMode === "technical" && matchSvg?.svgUrl && (
                          <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
                            <img
                              src={matchSvg.svgUrl}
                              alt={`${d.name} — Kỹ thuật`}
                              className="w-full object-contain bg-white"
                              style={{ maxHeight: "700px", maxWidth: "100%" }}
                            />
                          </div>
                        )}

                        {viewMode === "ai" && d.imageUrl && (
                          <img
                            src={d.imageUrl}
                            alt={d.name}
                            className="w-full object-contain bg-white block"
                            style={{ maxWidth: "100%", maxHeight: "700px" }}
                          />
                        )}

                        {viewMode === "combined" && matchSvg?.svgUrl && (
                          <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
                            <img
                              src={matchSvg.svgUrl}
                              alt={`${d.name} — Kỹ thuật`}
                              style={{ width: "100%", maxWidth: "100%", display: "block", maxHeight: "700px", objectFit: "contain" }}
                            />
                            {d.imageUrl && (
                              <img
                                src={d.imageUrl}
                                alt={`${d.name} — AI`}
                                style={{
                                  position: "absolute", top: 0, left: 0,
                                  width: "100%", height: "100%",
                                  objectFit: "contain",
                                  mixBlendMode: "multiply",
                                  opacity: 0.55,
                                  pointerEvents: "none",
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
                        <span>DIRECTOR: Võ Quốc Bảo</span>
                        <span>BMT DECOR — 7/92 Thành Thái, P.14, Q.10, TP.HCM</span>
                        <span>SỐ BẢN VẼ: KT-{String(i + 1).padStart(2, "0")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {cadResult.cadDescription && (
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Mô tả kỹ thuật chi tiết
                </h4>
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm whitespace-pre-wrap max-h-80 overflow-y-auto font-mono text-blue-900 dark:text-blue-100">
                  {cadResult.cadDescription}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                <div className="flex items-center gap-1 mb-1">
                  <Ruler className="w-3 h-3 text-orange-500" />
                  <span className="text-xs text-orange-600 font-bold">LỚP 1</span>
                </div>
                <p className="text-xs text-orange-700">Tổng thể khu đất theo Sổ đỏ</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="flex items-center gap-1 mb-1">
                  <Ruler className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-600 font-bold">LỚP 2</span>
                </div>
                <p className="text-xs text-blue-700">Kích thước thông thủy từng phòng</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-1 mb-1">
                  <ArrowUpDown className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 font-bold">LỚP 3</span>
                </div>
                <p className="text-xs text-green-700">Chi tiết khoảng lùi {cadResult.dimensions?.setback || "1.2m"}</p>
              </div>
            </div>

          </div>
        ) : null
      }
    >
      {stepStatus === "processing" && !cadResult ? (
        <div className="bg-slate-50 rounded-xl p-6 space-y-4">
          <div className="text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <h4 className="font-medium text-lg">Đang xử lý bản vẽ CAD</h4>
            <p className="text-sm text-muted-foreground">Hệ thống đang gửi dữ liệu sang kỹ thuật viên. Vui lòng chờ trong giây lát...</p>
          </div>
          <Progress value={undefined} className="h-2 animate-pulse" />
          <p className="text-xs text-muted-foreground text-center">
            Thời gian xử lý dự kiến khoảng 10 phút.
          </p>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
          <p className="font-medium">AI sẽ tạo bản vẽ CAD 2D chuẩn A/E bao gồm:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-start gap-2">
              <Grid3X3 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Mặt bằng từng tầng</p>
                <p className="text-xs text-muted-foreground">Tường, cột, cửa đi, cầu thang</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Ruler className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Dimension 3 lớp</p>
                <p className="text-xs text-muted-foreground">Tổng thể, phòng, khoảng lùi</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Layers className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Title Block chuẩn BMT</p>
                <p className="text-xs text-muted-foreground">Lề phải, đầy đủ thông tin</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ArrowUpDown className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Cầu thang số Sinh</p>
                <p className="text-xs text-muted-foreground">Bậc 16-18cm, thông thủy &gt;2.2m</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            <Badge variant="outline" className="text-xs">A-WALL</Badge>
            <Badge variant="outline" className="text-xs">A-COLM</Badge>
            <Badge variant="outline" className="text-xs">A-DIM</Badge>
            <Badge variant="outline" className="text-xs">A-BOUND</Badge>
            <Badge variant="outline" className="text-xs bg-orange-50">TỈ LỆ 1/100</Badge>
          </div>
        </div>
      )}
    </StepWrapper>
  );
}
