import Chart from 'chart.js/auto';
import { EMPLOYEES } from './data.js';

// Global Chart References
let chartDept = null;
let chartRole = null;
let chartAge = null;
let chartTenure = null;
let chartOvertime = null;
let chartTravel = null;
let chartSatisfaction = null;
let chartWorklife = null;

// App State
const state = {
  activeTab: 'overview',
  filters: {
    dept: 'All',
    gender: 'All',
    marital: 'All',
    overtime: 'All',
    ageband: 'All'
  },
  explorer: {
    search: '',
    chip: 'all',
    page: 1,
    pageSize: 15
  }
};

// Common Chart Styling Options
const chartTheme = {
  color: '#9ca3af',
  font: {
    family: "'Plus Jakarta Sans', sans-serif",
    size: 11
  },
  grid: {
    color: 'rgba(255, 255, 255, 0.05)'
  }
};

// Filter records based on active slicers
function getFilteredEmployees() {
  return EMPLOYEES.filter(emp => {
    if (state.filters.dept !== 'All' && emp.department !== state.filters.dept) return false;
    if (state.filters.gender !== 'All' && emp.gender !== state.filters.gender) return false;
    if (state.filters.marital !== 'All' && emp.maritalStatus !== state.filters.marital) return false;
    if (state.filters.overtime !== 'All' && emp.overTime !== state.filters.overtime) return false;
    if (state.filters.ageband !== 'All' && emp.ageBand !== state.filters.ageband) return false;
    return true;
  });
}

// Compute Cohort Metrics
function updateKPIs(subset) {
  const total = subset.length;
  const attritionCount = subset.reduce((acc, e) => acc + e.attritionFlag, 0);
  const rate = total > 0 ? ((attritionCount / total) * 100).toFixed(1) : '0.0';
  
  const avgTenure = total > 0 ? (subset.reduce((acc, e) => acc + e.yearsAtCompany, 0) / total).toFixed(1) : '0.0';
  const avgIncome = total > 0 ? Math.round(subset.reduce((acc, e) => acc + e.monthlyIncome, 0) / total) : 0;
  const totalPayrollM = total > 0 ? (subset.reduce((acc, e) => acc + e.monthlyIncome, 0) / 1000000).toFixed(2) : '0.00';

  document.getElementById('val-total').textContent = total.toLocaleString();
  document.getElementById('val-attrition-count').textContent = attritionCount.toLocaleString();
  document.getElementById('val-attrition-rate').textContent = `${rate}%`;
  document.getElementById('val-tenure').textContent = `${avgTenure} yrs`;
  document.getElementById('val-salary').textContent = `$${avgIncome.toLocaleString()}`;
  document.getElementById('kpi-salary').querySelector('.kpi-footer').textContent = `Payroll run: $${totalPayrollM}M/mo`;

  const cohortPill = document.getElementById('active-cohort-pill');
  if (cohortPill) {
    cohortPill.innerHTML = `Showing <strong>${total.toLocaleString()}</strong> of ${EMPLOYEES.length.toLocaleString()} records`;
  }
}

// Render or Update Overview Charts
function renderOverviewCharts(subset) {
  // 1. Department Breakdown
  const deptMap = {};
  subset.forEach(e => {
    if (!deptMap[e.department]) deptMap[e.department] = { total: 0, left: 0 };
    deptMap[e.department].total++;
    if (e.attritionFlag) deptMap[e.department].left++;
  });
  const deptLabels = Object.keys(deptMap);
  const deptRates = deptLabels.map(d => deptMap[d].total > 0 ? Number(((deptMap[d].left / deptMap[d].total) * 100).toFixed(1)) : 0);

  const ctxDept = document.getElementById('chart-dept')?.getContext('2d');
  if (ctxDept) {
    if (chartDept) chartDept.destroy();
    chartDept = new Chart(ctxDept, {
      type: 'bar',
      data: {
        labels: deptLabels,
        datasets: [{
          label: 'Attrition Rate (%)',
          data: deptRates,
          backgroundColor: ['#6366f1', '#06b6d4', '#f43f5e'],
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: ctx => `Departed: ${deptMap[deptLabels[ctx.dataIndex]].left} / ${deptMap[deptLabels[ctx.dataIndex]].total} staff`
            }
          }
        },
        scales: {
          x: { ticks: chartTheme, grid: { display: false } },
          y: { ticks: chartTheme, grid: chartTheme.grid, title: { display: true, text: 'Attrition %', color: '#6b7280' } }
        }
      }
    });
  }

  // 2. Job Role Breakdown
  const roleMap = {};
  subset.forEach(e => {
    if (!roleMap[e.jobRole]) roleMap[e.jobRole] = { total: 0, left: 0 };
    roleMap[e.jobRole].total++;
    if (e.attritionFlag) roleMap[e.jobRole].left++;
  });
  const sortedRoles = Object.keys(roleMap).sort((a, b) => {
    const rateA = roleMap[a].total > 0 ? roleMap[a].left / roleMap[a].total : 0;
    const rateB = roleMap[b].total > 0 ? roleMap[b].left / roleMap[b].total : 0;
    return rateB - rateA;
  });
  const roleRates = sortedRoles.map(r => roleMap[r].total > 0 ? Number(((roleMap[r].left / roleMap[r].total) * 100).toFixed(1)) : 0);

  const ctxRole = document.getElementById('chart-role')?.getContext('2d');
  if (ctxRole) {
    if (chartRole) chartRole.destroy();
    chartRole = new Chart(ctxRole, {
      type: 'bar',
      data: {
        labels: sortedRoles,
        datasets: [{
          label: 'Attrition Rate (%)',
          data: roleRates,
          backgroundColor: roleRates.map(r => r >= 25 ? '#f43f5e' : r >= 15 ? '#f59e0b' : '#3b82f6'),
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: ctx => `Exits: ${roleMap[sortedRoles[ctx.dataIndex]].left} / ${roleMap[sortedRoles[ctx.dataIndex]].total} staff`
            }
          }
        },
        scales: {
          x: { ticks: chartTheme, grid: chartTheme.grid },
          y: { ticks: { ...chartTheme, autoSkip: false }, grid: { display: false } }
        }
      }
    });
  }

  // 3. Age Band Breakdown
  const ageBands = ['<25', '25-34', '35-44', '45-54', '55+'];
  const ageMap = {};
  ageBands.forEach(b => ageMap[b] = { total: 0, left: 0 });
  subset.forEach(e => {
    if (ageMap[e.ageBand]) {
      ageMap[e.ageBand].total++;
      if (e.attritionFlag) ageMap[e.ageBand].left++;
    }
  });
  const ageRates = ageBands.map(b => ageMap[b].total > 0 ? Number(((ageMap[b].left / ageMap[b].total) * 100).toFixed(1)) : 0);

  const ctxAge = document.getElementById('chart-age')?.getContext('2d');
  if (ctxAge) {
    if (chartAge) chartAge.destroy();
    chartAge = new Chart(ctxAge, {
      type: 'bar',
      data: {
        labels: ageBands,
        datasets: [{
          label: 'Attrition Rate (%)',
          data: ageRates,
          backgroundColor: '#8b5cf6',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: ctx => `Exits: ${ageMap[ageBands[ctx.dataIndex]].left} / ${ageMap[ageBands[ctx.dataIndex]].total}`
            }
          }
        },
        scales: {
          x: { ticks: chartTheme, grid: { display: false } },
          y: { ticks: chartTheme, grid: chartTheme.grid }
        }
      }
    });
  }

  // 4. Tenure Curve
  const tenureCounts = {};
  for (let i = 0; i <= 10; i++) tenureCounts[i] = { total: 0, left: 0 };
  subset.forEach(e => {
    const yr = Math.min(e.yearsAtCompany, 10);
    tenureCounts[yr].total++;
    if (e.attritionFlag) tenureCounts[yr].left++;
  });
  const tenureLabels = Object.keys(tenureCounts).map(k => k === '10' ? '10+ yrs' : `${k} yrs`);
  const tenureLeft = Object.keys(tenureCounts).map(k => tenureCounts[k].left);

  const ctxTenure = document.getElementById('chart-tenure')?.getContext('2d');
  if (ctxTenure) {
    if (chartTenure) chartTenure.destroy();
    chartTenure = new Chart(ctxTenure, {
      type: 'line',
      data: {
        labels: tenureLabels,
        datasets: [{
          label: 'Attrition Exits',
          data: tenureLeft,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#10b981',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: chartTheme, grid: { display: false } },
          y: { ticks: chartTheme, grid: chartTheme.grid, title: { display: true, text: 'Exits Count', color: '#6b7280' } }
        }
      }
    });
  }
}

// Render Diagnostics Tab Charts
function renderDiagnosticsCharts(subset) {
  // 1. Overtime vs Non-OverTime
  const otMap = { 'Yes': { total: 0, left: 0 }, 'No': { total: 0, left: 0 } };
  subset.forEach(e => {
    if (otMap[e.overTime]) {
      otMap[e.overTime].total++;
      if (e.attritionFlag) otMap[e.overTime].left++;
    }
  });
  const otLabels = ['OverTime: Yes', 'OverTime: No'];
  const otRates = [
    otMap['Yes'].total > 0 ? Number(((otMap['Yes'].left / otMap['Yes'].total) * 100).toFixed(1)) : 0,
    otMap['No'].total > 0 ? Number(((otMap['No'].left / otMap['No'].total) * 100).toFixed(1)) : 0
  ];

  const ctxOT = document.getElementById('chart-overtime')?.getContext('2d');
  if (ctxOT) {
    if (chartOvertime) chartOvertime.destroy();
    chartOvertime = new Chart(ctxOT, {
      type: 'bar',
      data: {
        labels: otLabels,
        datasets: [{
          label: 'Attrition Rate (%)',
          data: otRates,
          backgroundColor: ['#f43f5e', '#10b981'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: chartTheme, grid: { display: false } },
          y: { ticks: chartTheme, grid: chartTheme.grid }
        }
      }
    });
  }

  // 2. Business Travel
  const trvMap = {};
  subset.forEach(e => {
    if (!trvMap[e.businessTravel]) trvMap[e.businessTravel] = { total: 0, left: 0 };
    trvMap[e.businessTravel].total++;
    if (e.attritionFlag) trvMap[e.businessTravel].left++;
  });
  const trvLabels = Object.keys(trvMap);
  const trvRates = trvLabels.map(t => trvMap[t].total > 0 ? Number(((trvMap[t].left / trvMap[t].total) * 100).toFixed(1)) : 0);

  const ctxTrv = document.getElementById('chart-travel')?.getContext('2d');
  if (ctxTrv) {
    if (chartTravel) chartTravel.destroy();
    chartTravel = new Chart(ctxTrv, {
      type: 'bar',
      data: {
        labels: trvLabels.map(t => t.replace('_', ' ')),
        datasets: [{
          label: 'Attrition Rate (%)',
          data: trvRates,
          backgroundColor: '#06b6d4',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: chartTheme, grid: { display: false } },
          y: { ticks: chartTheme, grid: chartTheme.grid }
        }
      }
    });
  }

  // 3. Job Satisfaction Score (1 to 4)
  const satMap = { 1: { total: 0, left: 0 }, 2: { total: 0, left: 0 }, 3: { total: 0, left: 0 }, 4: { total: 0, left: 0 } };
  subset.forEach(e => {
    if (satMap[e.jobSatisfaction]) {
      satMap[e.jobSatisfaction].total++;
      if (e.attritionFlag) satMap[e.jobSatisfaction].left++;
    }
  });
  const satRates = [1, 2, 3, 4].map(s => satMap[s].total > 0 ? Number(((satMap[s].left / satMap[s].total) * 100).toFixed(1)) : 0);

  const ctxSat = document.getElementById('chart-satisfaction')?.getContext('2d');
  if (ctxSat) {
    if (chartSatisfaction) chartSatisfaction.destroy();
    chartSatisfaction = new Chart(ctxSat, {
      type: 'line',
      data: {
        labels: ['1 (Low)', '2 (Medium)', '3 (High)', '4 (Very High)'],
        datasets: [{
          label: 'Attrition Rate (%)',
          data: satRates,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: chartTheme, grid: { display: false } },
          y: { ticks: chartTheme, grid: chartTheme.grid }
        }
      }
    });
  }

  // 4. Work-Life Balance vs Marital Status
  const wlMap = { 1: { total: 0, left: 0 }, 2: { total: 0, left: 0 }, 3: { total: 0, left: 0 }, 4: { total: 0, left: 0 } };
  subset.forEach(e => {
    if (wlMap[e.workLifeBalance]) {
      wlMap[e.workLifeBalance].total++;
      if (e.attritionFlag) wlMap[e.workLifeBalance].left++;
    }
  });
  const wlRates = [1, 2, 3, 4].map(w => wlMap[w].total > 0 ? Number(((wlMap[w].left / wlMap[w].total) * 100).toFixed(1)) : 0);

  const ctxWl = document.getElementById('chart-worklife')?.getContext('2d');
  if (ctxWl) {
    if (chartWorklife) chartWorklife.destroy();
    chartWorklife = new Chart(ctxWl, {
      type: 'bar',
      data: {
        labels: ['1 (Bad)', '2 (Fair)', '3 (Good)', '4 (Best)'],
        datasets: [{
          label: 'Attrition Rate (%)',
          data: wlRates,
          backgroundColor: ['#f43f5e', '#fb923c', '#38bdf8', '#4ade80'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: chartTheme, grid: { display: false } },
          y: { ticks: chartTheme, grid: chartTheme.grid }
        }
      }
    });
  }
}

// Master refresh for analytics
function refreshAnalytics() {
  const subset = getFilteredEmployees();
  updateKPIs(subset);
  renderOverviewCharts(subset);
  renderDiagnosticsCharts(subset);
  renderExplorerTable();
}

// SIMULATOR LOGIC
function calculateRisk() {
  const dept = document.getElementById('sim-dept').value;
  const role = document.getElementById('sim-role').value;
  const age = Number(document.getElementById('sim-age').value);
  const tenure = Number(document.getElementById('sim-tenure').value);
  const income = Number(document.getElementById('sim-income').value);
  const overtime = document.getElementById('sim-overtime').value;
  const sat = Number(document.getElementById('sim-satisfaction').value);
  const wl = Number(document.getElementById('sim-worklife').value);
  const marital = document.getElementById('sim-marital').value;
  const stock = Number(document.getElementById('sim-stock').value);

  // Update slider value labels
  document.getElementById('lbl-sim-age').textContent = `${age} yrs`;
  document.getElementById('lbl-sim-tenure').textContent = `${tenure} yr${tenure === 1 ? '' : 's'}`;
  document.getElementById('lbl-sim-income').textContent = `$${income.toLocaleString()}`;

  // Baseline attrition is 16.1%
  let score = 16.0;
  const vulnerabilities = [];

  // OverTime impact (one of strongest drivers)
  if (overtime === 'Yes') {
    score += 15.0;
    vulnerabilities.push('OverTime workload logged: Increases turnover probability by +15%');
  } else {
    score -= 5.0;
  }

  // Job Role Impact
  if (role === 'Sales Representative') {
    score += 22.0;
    vulnerabilities.push('Sales Representative role: 39.8% baseline attrition rate');
  } else if (role === 'Laboratory Technician') {
    score += 8.0;
    vulnerabilities.push('Lab Technician role: High technical burnout risk (+8%)');
  } else if (role === 'Human Resources') {
    score += 7.0;
  } else if (role === 'Manager' || role === 'Research Director') {
    score -= 10.0;
  }

  // Early Tenure Risk
  if (tenure <= 1) {
    score += 12.0;
    vulnerabilities.push('First-year tenure flight window: 58% of leavers depart in years 0–2');
  } else if (tenure <= 3) {
    score += 6.0;
  } else if (tenure >= 8) {
    score -= 8.0;
  }

  // Age Band Risk
  if (age < 25) {
    score += 16.0;
    vulnerabilities.push('Early-career staff under 25: 39.2% market attrition baseline');
  } else if (age < 32) {
    score += 5.0;
  } else if (age >= 50) {
    score -= 4.0;
  }

  // Satisfaction
  if (sat === 1) {
    score += 8.0;
    vulnerabilities.push('Low Job Satisfaction survey score (Level 1)');
  } else if (sat === 4) {
    score -= 6.0;
  }

  // Work-Life Balance
  if (wl === 1) {
    score += 12.0;
    vulnerabilities.push('Poor Work-Life Balance rating: Critical burnout precursor');
  } else if (wl === 4) {
    score -= 5.0;
  }

  // Stock Option
  if (stock === 0) {
    score += 7.0;
    vulnerabilities.push('Zero stock option equity alignment (Level 0)');
  } else if (stock >= 1) {
    score -= 6.0;
  }

  // Single Marital Status
  if (marital === 'Single') {
    score += 5.0;
  }

  // Clamp score
  score = Math.min(Math.max(Math.round(score), 4), 95);

  // Update UI Elements
  const scoreNum = document.getElementById('sim-score-num');
  const scoreLabel = document.getElementById('sim-score-label');
  const barFill = document.getElementById('sim-bar-fill');
  const vulnList = document.getElementById('sim-vulnerability-list');
  const rxText = document.getElementById('sim-rx-text');

  scoreNum.textContent = `${score}%`;
  barFill.style.width = `${score}%`;

  if (score < 20) {
    scoreLabel.textContent = 'LOW RISK';
    scoreLabel.style.color = '#6ee7b7';
    scoreLabel.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
    scoreLabel.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    rxText.textContent = 'Personnel shows strong retention resilience. Maintain current engagement cadence and support career trajectory with milestone reviews.';
  } else if (score < 40) {
    scoreLabel.textContent = 'MODERATE RISK';
    scoreLabel.style.color = '#93c5fd';
    scoreLabel.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
    scoreLabel.style.borderColor = 'rgba(59, 130, 246, 0.3)';
    rxText.textContent = 'Monitor monthly workload and ensure competitive milestone bonuses are acknowledged. Schedule quarterly 1-on-1 check-ins with department lead.';
  } else if (score < 65) {
    scoreLabel.textContent = 'ELEVATED RISK';
    scoreLabel.style.color = '#fcd34d';
    scoreLabel.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
    scoreLabel.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    rxText.textContent = 'Execute early intervention: Schedule an executive Stay Interview within 14 days, reduce overtime hours, and review lateral rotation opportunities.';
  } else {
    scoreLabel.textContent = 'CRITICAL FLIGHT RISK';
    scoreLabel.style.color = '#fb7185';
    scoreLabel.style.backgroundColor = 'rgba(244, 63, 94, 0.15)';
    scoreLabel.style.borderColor = 'rgba(244, 63, 94, 0.3)';
    rxText.textContent = 'Urgent retention protocol: High probability of exit within 90 days. Cap overtime immediately, award retention equity or bonus grant, and conduct skip-level managerial alignment.';
  }

  // Populate Vulnerabilities
  vulnList.innerHTML = vulnerabilities.length > 0
    ? vulnerabilities.map(v => `<li class="vulnerability-item">${v}</li>`).join('')
    : '<li class="vulnerability-item">No critical risk flags detected for this profile.</li>';
}

// PERSONNEL EXPLORER TABLE
function renderExplorerTable() {
  const baseSubset = getFilteredEmployees();
  const searchQ = state.explorer.search.toLowerCase().trim();

  let filtered = baseSubset.filter(e => {
    if (state.explorer.chip === 'attrition-yes' && e.attrition !== 'Yes') return false;
    if (state.explorer.chip === 'attrition-no' && e.attrition !== 'No') return false;
    if (state.explorer.chip === 'overtime-yes' && e.overTime !== 'Yes') return false;

    if (searchQ) {
      const matchId = String(e.id).includes(searchQ);
      const matchRole = e.jobRole.toLowerCase().includes(searchQ);
      const matchDept = e.department.toLowerCase().includes(searchQ);
      if (!matchId && !matchRole && !matchDept) return false;
    }
    return true;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / state.explorer.pageSize));
  state.explorer.page = Math.min(state.explorer.page, totalPages);

  const startIdx = (state.explorer.page - 1) * state.explorer.pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + state.explorer.pageSize);

  const tbody = document.getElementById('table-body');
  if (tbody) {
    if (pageItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 2rem; color: #9ca3af;">No personnel records matching current filter criteria.</td></tr>`;
    } else {
      tbody.innerHTML = pageItems.map(e => `
        <tr>
          <td><strong>#${e.id}</strong></td>
          <td><span class="badge-tag ${e.attrition === 'Yes' ? 'badge-yes' : 'badge-no'}">${e.attrition === 'Yes' ? 'Left' : 'Active'}</span></td>
          <td>${e.department}</td>
          <td>${e.jobRole}</td>
          <td>${e.ageBand} (${e.age}y)</td>
          <td>${e.yearsAtCompany} yrs</td>
          <td>$${e.monthlyIncome.toLocaleString()}</td>
          <td><span class="badge-tag ${e.overTime === 'Yes' ? 'badge-yes' : 'badge-no'}">${e.overTime}</span></td>
          <td>${e.jobSatisfaction}/4</td>
          <td>${e.workLifeBalance}/4</td>
          <td>${e.maritalStatus}</td>
        </tr>
      `).join('');
    }
  }

  // Update pagination DOM
  const pageInfo = document.getElementById('pagination-info');
  const pageCur = document.getElementById('page-current');
  const btnPrev = document.getElementById('btn-prev-page');
  const btnNext = document.getElementById('btn-next-page');

  if (pageInfo) {
    pageInfo.textContent = totalFiltered > 0 
      ? `Showing ${startIdx + 1} - ${Math.min(startIdx + state.explorer.pageSize, totalFiltered)} of ${totalFiltered.toLocaleString()} records`
      : '0 records found';
  }
  if (pageCur) pageCur.textContent = `Page ${state.explorer.page} of ${totalPages}`;
  if (btnPrev) btnPrev.disabled = state.explorer.page <= 1;
  if (btnNext) btnNext.disabled = state.explorer.page >= totalPages;
}

// Export CSV handler
function exportCSV() {
  const subset = getFilteredEmployees();
  if (subset.length === 0) return;

  const headers = ['EmployeeID', 'Attrition', 'Department', 'JobRole', 'Age', 'AgeBand', 'YearsAtCompany', 'MonthlyIncome', 'OverTime', 'JobSatisfaction', 'WorkLifeBalance', 'MaritalStatus', 'StockOptionLevel'];
  const rows = subset.map(e => [
    e.id,
    e.attrition,
    `"${e.department}"`,
    `"${e.jobRole}"`,
    e.age,
    e.ageBand,
    e.yearsAtCompany,
    e.monthlyIncome,
    e.overTime,
    e.jobSatisfaction,
    e.workLifeBalance,
    e.maritalStatus,
    e.stockOptionLevel
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `hr_attrition_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// SETUP EVENT LISTENERS
function setupEvents() {
  // Navigation Tabs
  const tabBtns = document.querySelectorAll('.nav-tab');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      state.activeTab = targetTab;

      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      const activePane = document.getElementById(`pane-${targetTab}`);
      if (activePane) activePane.classList.add('active');

      // Refresh charts when tab becomes visible
      if (targetTab === 'overview' || targetTab === 'diagnostics') {
        setTimeout(refreshAnalytics, 50);
      }
    });
  });

  // Global Slicers
  const filterDept = document.getElementById('filter-dept');
  const filterGender = document.getElementById('filter-gender');
  const filterMarital = document.getElementById('filter-marital');
  const filterOvertime = document.getElementById('filter-overtime');
  const filterAgeband = document.getElementById('filter-ageband');
  const btnReset = document.getElementById('btn-reset-filters');

  filterDept?.addEventListener('change', e => { state.filters.dept = e.target.value; state.explorer.page = 1; refreshAnalytics(); });
  filterGender?.addEventListener('change', e => { state.filters.gender = e.target.value; state.explorer.page = 1; refreshAnalytics(); });
  filterMarital?.addEventListener('change', e => { state.filters.marital = e.target.value; state.explorer.page = 1; refreshAnalytics(); });
  filterOvertime?.addEventListener('change', e => { state.filters.overtime = e.target.value; state.explorer.page = 1; refreshAnalytics(); });
  filterAgeband?.addEventListener('change', e => { state.filters.ageband = e.target.value; state.explorer.page = 1; refreshAnalytics(); });

  btnReset?.addEventListener('click', () => {
    state.filters = { dept: 'All', gender: 'All', marital: 'All', overtime: 'All', ageband: 'All' };
    if (filterDept) filterDept.value = 'All';
    if (filterGender) filterGender.value = 'All';
    if (filterMarital) filterMarital.value = 'All';
    if (filterOvertime) filterOvertime.value = 'All';
    if (filterAgeband) filterAgeband.value = 'All';
    state.explorer.page = 1;
    refreshAnalytics();
  });

  // Simulator Inputs
  const simFields = [
    'sim-dept', 'sim-role', 'sim-age', 'sim-tenure', 'sim-income',
    'sim-overtime', 'sim-satisfaction', 'sim-worklife', 'sim-marital', 'sim-stock'
  ];
  simFields.forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener('input', calculateRisk);
    el?.addEventListener('change', calculateRisk);
  });

  // Explorer Table Search & Chips
  const searchInput = document.getElementById('table-search');
  searchInput?.addEventListener('input', e => {
    state.explorer.search = e.target.value;
    state.explorer.page = 1;
    renderExplorerTable();
  });

  const chips = document.querySelectorAll('.chip-btn');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.explorer.chip = chip.getAttribute('data-filter');
      state.explorer.page = 1;
      renderExplorerTable();
    });
  });

  // Pagination
  document.getElementById('btn-prev-page')?.addEventListener('click', () => {
    if (state.explorer.page > 1) {
      state.explorer.page--;
      renderExplorerTable();
    }
  });

  document.getElementById('btn-next-page')?.addEventListener('click', () => {
    state.explorer.page++;
    renderExplorerTable();
  });

  // Export CSV
  document.getElementById('btn-export-csv')?.addEventListener('click', exportCSV);
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupEvents();
  refreshAnalytics();
  calculateRisk();
});
