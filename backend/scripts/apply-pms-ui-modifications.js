const fs = require('fs');
const path = require('path');

const pmsPagesDir = path.resolve(__dirname, '../../frontend/src/modules/pms/pages');
const pmsCompDir = path.resolve(__dirname, '../../frontend/src/modules/pms/components');

console.log('Starting PMS UI modifications...');

// =========================================================================
// 1. PmsProjectListPage.jsx (Image 2 -> Baseline Image 1 style)
// =========================================================================
let projList = fs.readFileSync(path.join(pmsPagesDir, 'PmsProjectListPage.jsx'), 'utf8');

// A. Replace Header badge
projList = projList.replace(
  'Phase 01 • Master Rail',
  'Project Master Portfolio'
);

// B. Replace WorkKpiStrip with 5-card grid matching Baseline Planning
const oldKpiSectionRegex = /\{\/\* 3-Liner KPI Overview Strip with \(i\) hover tooltips \*\/\}\s*<WorkKpiStrip items=\{kpiItems\} columns="grid-cols-2 sm:grid-cols-4" \/>/;

const new5CardGridProjects = `{/* 5-Card KPI Overview Grid (Consistent across all submodules) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1 */}
        <div
          onClick={() => {
            setKpiFilter('all');
            setStatusFilter('all');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={\`p-3.5 rounded-xl border transition-all cursor-pointer relative group \${
            kpiFilter === 'all' && statusFilter === 'all'
              ? 'bg-brand-50/70 border-brand-300 ring-2 ring-brand-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }\`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Projects</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                All master real estate developments registered across land, planning, and execution phases.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All real estate developments</div>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => {
            setKpiFilter(kpiFilter === 'planning' ? 'all' : 'planning');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={\`p-3.5 rounded-xl border transition-all cursor-pointer relative group \${
            kpiFilter === 'planning'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }\`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">In Planning</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Projects in land acquisition, legal due diligence, and master layout design.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-blue-700 mt-1">{kpis.planning || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Stages 1–5 active</div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => {
            setKpiFilter(kpiFilter === 'active' ? 'all' : 'active');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={\`p-3.5 rounded-xl border transition-all cursor-pointer relative group \${
            kpiFilter === 'active'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }\`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Under Construction</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Projects actively executing civil work, daily labor logs, and structural work packages.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">{kpis.underConstruction}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Stage 6–10 active civil works</div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => {
            setKpiFilter(kpiFilter === 'completed' ? 'all' : 'completed');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={\`p-3.5 rounded-xl border transition-all cursor-pointer relative group \${
            kpiFilter === 'completed'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }\`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Completed & Handover</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Projects with 100% stage completions, final handover certificates, and possession letters issued.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{kpis.completed}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Handover & After-Sales</div>
        </div>

        {/* KPI 5 */}
        <div
          onClick={() => {
            setKpiFilter(kpiFilter === 'planning' ? 'all' : 'planning');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={\`p-3.5 rounded-xl border transition-all cursor-pointer relative group \${
            kpiFilter === 'planning'
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }\`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Planned Budget</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Aggregate capital expenditure budget planned across active and upcoming construction projects.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 mt-1">{formatCurrencyCr(kpis.plannedBudget)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">\${kpis.portfolioProgress}% portfolio progression</div>
        </div>
      </div>`;

if (oldKpiSectionRegex.test(projList)) {
  projList = projList.replace(oldKpiSectionRegex, new5CardGridProjects);
  console.log('Replaced WorkKpiStrip with 5-Card Grid in PmsProjectListPage.jsx');
}

// C. Update Code & Project column to Stage 11 simple style
projList = projList.replace(
  `<td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                          {proj.code}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 hover:text-brand-600">{proj.name}</div>
                        </div>
                      </div>
                    </td>`,
  `<td className="py-3 px-4">
                      <div className="font-bold text-slate-900 hover:text-brand-600">{proj.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {proj.code} • {proj.currentStageName || 'Planning'}
                      </div>
                    </td>`
);

// D. Update Status column to simple one-liner without bg or border
projList = projList.replace(
  `<span
                        className={\`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase \${
                          proj.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : proj.status === 'planning'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : proj.status === 'completed'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }\`}
                      >
                        {proj.status}
                      </span>`,
  `<span className="text-xs font-semibold uppercase whitespace-nowrap text-slate-700">
                        {proj.status}
                      </span>`
);

// E. Update Actions column to simple text Workspace button without bg or border
projList = projList.replace(
  `<button
                        type="button"
                        onClick={() => navigate(\`/pms/projects/\${proj._id}\`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-md shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                        title="Open 13-stage workspace"
                      >
                        <Layers className="w-3.5 h-3.5 text-brand-600" />
                        <span>Workspace</span>
                      </button>`,
  `<button
                        type="button"
                        onClick={() => navigate(\`/pms/projects/\${proj._id}\`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer mr-2"
                        title="Open workspace"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Workspace</span>
                      </button>`
);

fs.writeFileSync(path.join(pmsPagesDir, 'PmsProjectListPage.jsx'), projList, 'utf8');


// =========================================================================
// 2. PmsPlotListPage.jsx (Image 3 -> Baseline Image 1 style)
// =========================================================================
let plotList = fs.readFileSync(path.join(pmsPagesDir, 'PmsPlotListPage.jsx'), 'utf8');

// A. Replace Header badge
plotList = plotList.replace(
  'Stage 01 • Land Scouting',
  'Land Acquisition & Feasibility'
);

// B. Replace WorkKpiStrip with 5-card grid matching Baseline Planning
const oldKpiSectionPlotRegex = /\{\/\* 3-Liner KPI Overview Strip with \(i\) hover tooltips \*\/\}\s*<WorkKpiStrip items=\{kpiItems\} columns="grid-cols-2 sm:grid-cols-4" \/>/;

const new5CardGridPlots = `{/* 5-Card KPI Overview Grid (Consistent across all submodules) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1 */}
        <div
          onClick={() => {
            setKpiFilter('all');
            setStatusFilter('all');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={\`p-3.5 rounded-xl border transition-all cursor-pointer relative group \${
            kpiFilter === 'all' && statusFilter === 'all'
              ? 'bg-brand-50/70 border-brand-300 ring-2 ring-brand-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }\`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Plots</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Total scouted land parcels registered across all targeted project regions.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All land parcels identified</div>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => {
            setKpiFilter(kpiFilter === 'visitScheduled' ? 'all' : 'visitScheduled');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={\`p-3.5 rounded-xl border transition-all cursor-pointer relative group \${
            kpiFilter === 'visitScheduled'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }\`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Visit Scheduled</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Plots with active surveyor inspection or pending topography verification.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-blue-700 mt-1">{kpis.visitScheduled}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pending field inspection</div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => {
            setKpiFilter(kpiFilter === 'underAnalysis' ? 'all' : 'underAnalysis');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={\`p-3.5 rounded-xl border transition-all cursor-pointer relative group \${
            kpiFilter === 'underAnalysis'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }\`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Under Feasibility</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Parcels undergoing pro-forma financial ROI, IRR, and FSI zoning analysis.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">{kpis.underAnalysis}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Financial analysis in progress</div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => {
            setKpiFilter(kpiFilter === 'approved' ? 'all' : 'approved');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={\`p-3.5 rounded-xl border transition-all cursor-pointer relative group \${
            kpiFilter === 'approved'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }\`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Approved for Acquisition</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Plots with positive investment committee sanction ready for legal verification.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{kpis.approved}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sanctioned & advanced</div>
        </div>

        {/* KPI 5 */}
        <div
          onClick={() => {
            setKpiFilter('all');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={\`p-3.5 rounded-xl border transition-all cursor-pointer relative group \${
            kpiFilter === 'acreage'
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }\`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estimated Outlay</span>
            </div>
            <div className="relative group/tip">
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover/tip:text-slate-600 transition-colors" />
              <div className="absolute right-0 top-5 z-20 hidden group-hover/tip:block bg-slate-900 text-white text-[11px] rounded py-1 px-2 w-48 shadow-lg">
                Total estimated capital required for approved land parcel acquisitions.
              </div>
            </div>
          </div>
          <div className="text-xl font-black text-purple-700 mt-1">{formatCurrencyCr(kpis.totalEstimatedCost)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Capital deployment target</div>
        </div>
      </div>`;

if (oldKpiSectionPlotRegex.test(plotList)) {
  plotList = plotList.replace(oldKpiSectionPlotRegex, new5CardGridPlots);
  console.log('Replaced WorkKpiStrip with 5-Card Grid in PmsPlotListPage.jsx');
}

// C. Update Code & Title column to Stage 11 style (no green block)
plotList = plotList.replace(
  `<td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                          {plot.code}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{plot.title}</div>
                          <div className="text-[11px] text-slate-400">Owner: {plot.owner?.name}</div>
                        </div>
                      </div>
                    </td>`,
  `<td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{plot.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {plot.code} {plot.owner?.name ? \`• Owner: \${plot.owner.name}\` : ''}
                      </div>
                    </td>`
);

// D. Update Feasibility Verdict column to simple one-liner without pill background/border
plotList = plotList.replace(
  `<span
                        className={\`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize \${
                          plot.verdict === 'feasible'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : plot.verdict === 'feasibleWithConditions'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : plot.verdict === 'notFeasible'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-500'
                        }\`}
                      >
                        {plot.verdict === 'feasible' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {plot.verdict === 'feasibleWithConditions' ? 'Conditional' : plot.verdict}
                      </span>`,
  `<span className="text-xs font-semibold whitespace-nowrap text-slate-700 capitalize">
                        {plot.verdict === 'feasibleWithConditions' ? 'Conditional' : plot.verdict || 'Pending'}
                      </span>`
);

// E. Update Status column to simple one-liner without pill background/border
plotList = plotList.replace(
  `<span
                        className={\`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase \${
                          plot.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : plot.status === 'underAnalysis'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : plot.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }\`}
                      >
                        {plot.status}
                      </span>`,
  `<span className="text-xs font-semibold uppercase whitespace-nowrap text-slate-700">
                        {plot.status}
                      </span>`
);

// F. Update Actions column: remove colored pill buttons Feasibility and Legal (S2), make clean simple text buttons without bg and border
plotList = plotList.replace(
  `<button
                        type="button"
                        onClick={() => handleOpenFeasibility(plot)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                        title="Calculate & assess financial feasibility"
                      >
                        <Calculator className="w-3.5 h-3.5 text-purple-600" />
                        <span>Feasibility</span>
                      </button>
                      {plot.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => navigate('/pms/legal-cases')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                          title="Move to Legal Verification (Stage 2)"
                        >
                          <Scale className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Legal (S2)</span>
                        </button>
                      )}`,
  `<button
                        type="button"
                        onClick={() => handleOpenFeasibility(plot)}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer mr-2"
                        title="Calculate & assess financial feasibility"
                      >
                        Feasibility
                      </button>
                      {plot.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => navigate('/pms/legal-cases')}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer mr-2"
                          title="View Legal Due Diligence"
                        >
                          Legal
                        </button>
                      )}`
);

fs.writeFileSync(path.join(pmsPagesDir, 'PmsPlotListPage.jsx'), plotList, 'utf8');


// =========================================================================
// 3. PmsFinanceListPage.jsx (Image 5 -> Simple one liner status without bg/border)
// =========================================================================
let finList = fs.readFileSync(path.join(pmsPagesDir, 'PmsFinanceListPage.jsx'), 'utf8');

// Replace header badge
finList = finList.replace('Stage 11: Finance & Cost Management', 'Finance & Cost Management');

// Replace Status column (no bg, no border, whitespace-nowrap one liner)
finList = finList.replace(
  `<span className={\`px-2.5 py-1 rounded-full text-[10px] font-bold border \${cfg.color}\`}>
                          {cfg.label}
                        </span>`,
  `<span className="text-xs font-semibold whitespace-nowrap text-slate-700">
                          {cfg.label}
                        </span>`
);

// Replace Action button (no green solid bg, clean simple text button)
finList = finList.replace(
  `<button
                          onClick={() => setSelectedRecordId(r._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs font-semibold shadow-xs transition"
                        >
                          Workspace
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>`,
  `<button
                          onClick={() => setSelectedRecordId(r._id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer"
                        >
                          <span>Workspace</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>`
);

fs.writeFileSync(path.join(pmsPagesDir, 'PmsFinanceListPage.jsx'), finList, 'utf8');


// =========================================================================
// 4. Update Status and Action buttons in ALL other PMS list pages
// =========================================================================
const otherPages = [
  'PmsBaselineListPage.jsx',
  'PmsConstructionListPage.jsx',
  'PmsQualityListPage.jsx',
  'PmsProjectControlListPage.jsx',
  'PmsHandoverListPage.jsx',
  'PmsAfterSalesListPage.jsx',
  'PmsPlanningListPage.jsx',
  'PmsPreSiteListPage.jsx',
  'PmsProcurementListPage.jsx',
  'PmsLegalCaseListPage.jsx',
  'PmsLandPurchaseListPage.jsx'
];

otherPages.forEach((p) => {
  const filePath = path.join(pmsPagesDir, p);
  let content = fs.readFileSync(filePath, 'utf8');

  // Strip Stage XX from header badges
  content = content.replace(/Stage \d+:\s*/g, '');
  content = content.replace(/Stage \d+\s*•\s*/g, '');

  // 1. Status: remove rounded-full / border / pill backgrounds
  content = content.replace(
    /<span className=\{`inline-flex items-center(?: gap-1)? px-2\.?5? py-0\.5 rounded-full text-\[10px\] font-semibold border \$\{[^}]+\}`\}>[\s\S]*?<\/span>/g,
    `<span className="text-xs font-semibold whitespace-nowrap text-slate-700">{statusConf.label}</span>`
  );

  content = content.replace(
    /<span className=\{`px-2\.?5? py-0?\.?5? rounded-full text-\[10px\] font-bold(?: border)? \$\{[^}]+\}`\}>[\s\S]*?<\/span>/g,
    `<span className="text-xs font-semibold whitespace-nowrap text-slate-700">{cfg.label}</span>`
  );

  // 2. Action button: simplify to text-brand-600 hover:text-brand-800 without bg or border
  content = content.replace(
    /className="inline-flex items-center gap-1\.?5? px-3 py-1\.?5? bg-[a-z]+-600 text-white rounded-[a-z0-9]+ hover:bg-[a-z]+-700 text-xs font-semibold shadow-xs transition"/g,
    'className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer"'
  );

  content = content.replace(
    /className="inline-flex items-center gap-1 px-2\.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-md shadow-2xs hover:shadow-xs transition-all cursor-pointer"/g,
    'className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer"'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated status and action styling in:', p);
});


// =========================================================================
// 5. Update Workspace Modals to eliminate top whitespace & support full screen (Image 4)
// =========================================================================
const workspaceModals = [
  'BaselinePlanningWorkspaceModal.jsx',
  'ProjectPlanningWorkspaceModal.jsx',
  'PreSiteStartWorkspaceModal.jsx',
  'ProcurementWorkspaceModal.jsx',
  'ConstructionWorkspaceModal.jsx',
  'QualityWorkspaceModal.jsx',
  'ProjectControlWorkspaceModal.jsx',
  'FinanceWorkspaceModal.jsx',
  'HandoverWorkspaceModal.jsx',
  'AfterSalesWorkspaceModal.jsx',
  'LegalCaseWorkspaceModal.jsx',
  'LandPurchaseWorkspaceModal.jsx'
];

workspaceModals.forEach((m) => {
  const filePath = path.join(pmsCompDir, m);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace outer wrapper
  content = content.replace(
    'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto',
    'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden'
  );

  content = content.replace(
    'fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200',
    'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden'
  );

  content = content.replace(
    'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4',
    'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden'
  );

  content = content.replace(
    'fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-3 sm:p-5',
    'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden'
  );

  // Replace inner container: remove my-8 and force h-[92vh] max-h-[92vh]
  content = content.replace(
    'bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden flex flex-col border border-slate-200',
    'bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[92vh] max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150'
  );

  content = content.replace(
    'bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200',
    'bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[92vh] max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150'
  );

  content = content.replace(
    'bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150',
    'bg-white w-full max-w-6xl h-[92vh] max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150'
  );

  content = content.replace(
    'bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200',
    'bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[92vh] max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150'
  );

  // Replace modal body: replace max-h-[calc(85vh-200px)] with flex-1 overflow-y-auto
  content = content.replace(
    'max-h-[calc(85vh-200px)]',
    'flex-1'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated modal viewport geometry in:', m);
});

console.log('All modifications applied successfully.');
