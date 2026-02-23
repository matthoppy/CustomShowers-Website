/**
 * Fabrication Preview Component
 * Shows calculated cut sizes and deductions for testing purposes
 * This should be hidden from customers but visible during development/testing
 */

import React from 'react';
import { PanelModel } from '@/types/square';
import {
    calculatePanelDeductions,
    calculateHingePlacement,
    selectHingeForDoor,
    checkSupportRequirements,
    PanelDeductions
} from '@/lib/showerCalculations';
import { calculateGlassWeight } from '@/types/square';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface FabricationPreviewProps {
    panels: PanelModel[];
    isFloorToCeiling: boolean;
    supportPanelRequired: boolean;
    showDetails?: boolean;
}

interface PanelFabricationData {
    panel: PanelModel;
    deductions: PanelDeductions;
    weight: number;
    hingePlacement?: ReturnType<typeof calculateHingePlacement>;
    hingeSelection?: ReturnType<typeof selectHingeForDoor>;
}

export const FabricationPreview: React.FC<FabricationPreviewProps> = ({
    panels,
    isFloorToCeiling,
    supportPanelRequired,
    showDetails = true
}) => {
    // Calculate deductions for each panel
    const panelData: PanelFabricationData[] = panels.map((panel, index) => {
        const tightWidth = panel.width_mm || 500;
        const tightHeight = panel.height_mm || 2000;

        // Determine corner configuration based on panel plane
        const isLongPanel = panel.plane === 'front';
        const hasLeftCorner = index > 0 && panels[index - 1] !== undefined;
        const hasRightCorner = index < panels.length - 1 && panels[index + 1] !== undefined;

        const deductions = calculatePanelDeductions(
            tightWidth,
            tightHeight,
            panel,
            isFloorToCeiling,
            supportPanelRequired,
            { isLongPanel, hasLeftCorner, hasRightCorner }
        );

        const weight = calculateGlassWeight(deductions.cutWidth, deductions.cutHeight);

        let hingePlacement;
        let hingeSelection;

        if (panel.panel_type === 'door_hinged') {
            hingePlacement = calculateHingePlacement(deductions.cutHeight);
            hingeSelection = selectHingeForDoor(deductions.cutWidth, deductions.cutHeight);
        }

        return {
            panel,
            deductions,
            weight,
            hingePlacement,
            hingeSelection
        };
    });

    // Check support requirements
    const supportCheck = checkSupportRequirements(panels);

    return (
        <Card className="bg-slate-900 text-white border-slate-700">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-400" />
                    Fabrication Preview (Testing Only)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Support Requirements */}
                {(supportCheck.supportPanelRequired || supportCheck.supportBarRequired) && (
                    <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-3">
                        <h4 className="font-semibold text-amber-400 mb-2">Support Requirements</h4>
                        {supportCheck.supportPanelRequired && (
                            <p className="text-sm text-amber-200">
                                <AlertTriangle className="w-4 h-4 inline mr-1" />
                                Support panel required: {supportCheck.supportPanelReason}
                            </p>
                        )}
                        {supportCheck.supportBarRequired && (
                            <p className="text-sm text-amber-200">
                                <AlertTriangle className="w-4 h-4 inline mr-1" />
                                Support bar required for {supportCheck.supportBarPanelId}: {supportCheck.supportBarReason}
                            </p>
                        )}
                    </div>
                )}

                {/* Panel Cut List */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-slate-300">Glass Cut List</h4>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-2 px-2">Panel</th>
                                    <th className="text-left py-2 px-2">Type</th>
                                    <th className="text-right py-2 px-2">Tight Size</th>
                                    <th className="text-right py-2 px-2">Cut Size</th>
                                    <th className="text-right py-2 px-2">Weight</th>
                                    {panels.some(p => p.panel_type === 'door_hinged') && (
                                        <th className="text-left py-2 px-2">Hinge</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {panelData.map(({ panel, deductions, weight, hingeSelection }) => (
                                    <tr key={panel.panel_id} className="border-b border-slate-800">
                                        <td className="py-2 px-2 font-mono">{panel.panel_id}</td>
                                        <td className="py-2 px-2 capitalize">
                                            {panel.panel_type === 'door_hinged' ? 'Door' : 'Fixed'}
                                            <span className="text-slate-500 text-xs ml-1">
                                                ({panel.plane})
                                            </span>
                                        </td>
                                        <td className="py-2 px-2 text-right font-mono text-slate-400">
                                            {panel.width_mm || '?'} × {panel.height_mm || '?'}
                                        </td>
                                        <td className="py-2 px-2 text-right font-mono text-green-400">
                                            {deductions.cutWidth} × {deductions.cutHeight}
                                        </td>
                                        <td className="py-2 px-2 text-right font-mono">
                                            {weight}kg
                                        </td>
                                        {panels.some(p => p.panel_type === 'door_hinged') && (
                                            <td className="py-2 px-2">
                                                {hingeSelection && (
                                                    <span className={`inline-flex items-center gap-1 ${hingeSelection.isUpgrade ? 'text-amber-400' : 'text-green-400'
                                                        }`}>
                                                        {hingeSelection.brand.charAt(0).toUpperCase() + hingeSelection.brand.slice(1)}
                                                        {hingeSelection.isUpgrade && (
                                                            <span className="text-xs">(upgrade)</span>
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detailed Deductions (Expandable) */}
                {showDetails && (
                    <details className="mt-4">
                        <summary className="cursor-pointer text-slate-400 hover:text-white">
                            Show Deduction Details
                        </summary>
                        <div className="mt-2 space-y-3">
                            {panelData.map(({ panel, deductions, hingePlacement, hingeSelection }) => (
                                <div key={panel.panel_id} className="bg-slate-800 rounded p-3">
                                    <h5 className="font-mono font-semibold mb-2">{panel.panel_id}</h5>

                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <p className="text-slate-400 mb-1">Vertical Deductions:</p>
                                            <ul className="list-disc list-inside space-y-0.5">
                                                {deductions.vertical.breakdown.map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                                <li className="font-semibold text-green-400">
                                                    Total: -{deductions.vertical.total}mm
                                                </li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 mb-1">Horizontal Deductions:</p>
                                            <ul className="list-disc list-inside space-y-0.5">
                                                {deductions.horizontal.breakdown.map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                                <li className="font-semibold text-green-400">
                                                    Total: -{deductions.horizontal.total}mm
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    {hingePlacement && (
                                        <div className="mt-3 pt-3 border-t border-slate-700">
                                            <p className="text-slate-400 mb-1">Hinge Placement:</p>
                                            <p className="text-xs">
                                                Top offset: {hingePlacement.topHingeOffset}mm |
                                                Bottom offset: {hingePlacement.bottomHingeOffset}mm |
                                                Clear gap: {hingePlacement.clearGap}mm
                                            </p>
                                            {hingePlacement.warning && (
                                                <p className="text-amber-400 text-xs mt-1">
                                                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                                                    {hingePlacement.warning}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {hingeSelection?.warning && (
                                        <p className="text-red-400 text-xs mt-2">
                                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                                            {hingeSelection.warning}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </details>
                )}

                {/* Warnings Summary */}
                {panelData.some(d => d.hingePlacement?.warning || d.hingeSelection?.warning) && (
                    <div className="bg-red-900/30 border border-red-600 rounded-lg p-3 mt-4">
                        <h4 className="font-semibold text-red-400 mb-2">Warnings</h4>
                        {panelData.map(({ panel, hingePlacement, hingeSelection }) => (
                            <React.Fragment key={panel.panel_id}>
                                {hingePlacement?.warning && (
                                    <p className="text-sm text-red-200">
                                        {panel.panel_id}: {hingePlacement.warning}
                                    </p>
                                )}
                                {hingeSelection?.warning && (
                                    <p className="text-sm text-red-200">
                                        {panel.panel_id}: {hingeSelection.warning}
                                    </p>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
