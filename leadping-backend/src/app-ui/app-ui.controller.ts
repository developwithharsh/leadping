import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('app')
export class AppUiController {
  @Get()
  serveApp(
    @Query('user_id') userId: string,
    @Query('tier') tier: string,
    @Query('backend') backend: string,
    @Res() res: Response,
  ) {
    const backendUrl = backend || 'https://leadping-7y2w.onrender.com';
    const html = buildAppHtml(userId || '', tier || 'free', backendUrl);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    res.send(html);
  }
}

function esc(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildAppHtml(userId: string, tier: string, backendUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LeadPing</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --blue-deep:#0C2D5E;--blue-mid:#185FA5;--blue-light:#EBF4FD;--blue-border:#B5D4F4;
  --green-wa:#25D366;--green-wa-dark:#1DA855;--green-sent:#128C7E;
  --yellow:#FEF9C3;--yellow-text:#854D0E;
  --gray-50:#F9FAFB;--gray-100:#F3F4F6;--gray-200:#E5E7EB;--gray-300:#D1D5DB;
  --gray-400:#9CA3AF;--gray-600:#6B7280;--gray-700:#374151;--gray-900:#111827;--red:#DC2626;
}
html,body{width:100%;height:100%;overflow:hidden;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:var(--gray-900);font-size:13px}
.sb-header{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;background:var(--blue-deep);position:sticky;top:0;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
.sb-logo{display:flex;align-items:center;gap:9px}
.sb-brand{font-size:15px;font-weight:700;color:#fff;letter-spacing:.01em;line-height:1}
.sb-tagline{font-size:10px;color:rgba(255,255,255,.55);letter-spacing:.03em;line-height:1}
.sb-header-actions{display:flex;align-items:center;gap:6px}
.tier-badge{font-size:10px;font-weight:600;padding:3px 9px;border-radius:20px;letter-spacing:.04em}
.tier-free{background:rgba(255,255,255,.13);color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.25)}
.tier-pro,.tier-lifetime{background:#FDE047;color:#78350F;border:none}
.icon-btn{background:rgba(255,255,255,.1);border:none;border-radius:6px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,.8);transition:background .15s,color .15s}
.icon-btn:hover{background:rgba(255,255,255,.2);color:#fff}
.icon-btn.spinning svg{animation:spin .8s linear infinite}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.announcement-banner{background:linear-gradient(90deg,#f59e0b,#f97316);color:#1a1a1a;font-size:12px;font-weight:600;padding:8px 14px;text-align:center;line-height:1.4}
.stats-row{display:flex;align-items:center;padding:10px 14px;background:var(--blue-deep);gap:0}
.stat-card{flex:1;text-align:center}
.stat-num{font-size:22px;font-weight:700;line-height:1;margin-bottom:2px}
.stat-num.detected{color:#60A5FA}.stat-num.followed{color:#4ADE80}.stat-num.pending{color:#FDE047}
.stat-label{font-size:10px;color:rgba(255,255,255,.5);letter-spacing:.02em}
.stat-divider{width:1px;height:28px;background:rgba(255,255,255,.12)}
.filter-row{display:flex;gap:5px;padding:10px 12px 6px;overflow-x:auto;scrollbar-width:none;background:#fff;border-bottom:1px solid var(--gray-200)}
.filter-row::-webkit-scrollbar{display:none}
.filter-chip{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;border:1.5px solid var(--gray-200);background:#fff;font-size:11px;font-weight:500;color:var(--gray-600);cursor:pointer;white-space:nowrap;transition:all .15s;font-family:inherit}
.filter-chip:hover{border-color:var(--blue-mid);color:var(--blue-mid)}
.filter-chip.active{background:var(--blue-deep);border-color:var(--blue-deep);color:#fff}
.chip-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.dot-im{background:#1D4ED8}.dot-jd{background:#C2410C}.dot-ti{background:#6D28D9}
.status-filter-row{display:flex;gap:4px;padding:6px 12px 8px;overflow-x:auto;scrollbar-width:none;background:#fff}
.status-filter-row::-webkit-scrollbar{display:none}
.status-chip{padding:3px 9px;border-radius:4px;border:1px solid var(--gray-200);background:#fff;font-size:11px;color:var(--gray-600);cursor:pointer;white-space:nowrap;font-family:inherit;transition:all .15s}
.status-chip:hover{border-color:var(--blue-mid);color:var(--blue-mid)}
.status-chip.active{background:var(--blue-light);border-color:var(--blue-mid);color:var(--blue-mid);font-weight:500}
.search-row{padding:0 12px 8px;background:#fff;border-bottom:1px solid var(--gray-200)}
.search-wrap{position:relative}
.search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none}
.search-input{width:100%;border:1.5px solid var(--gray-200);border-radius:8px;padding:7px 10px 7px 32px;font-size:12px;font-family:inherit;color:var(--gray-900);background:var(--gray-50);outline:none;transition:border-color .15s}
.search-input:focus{border-color:var(--blue-mid);background:#fff}
.lead-list{flex:1;overflow-y:auto;padding:8px 10px;display:flex;flex-direction:column;gap:8px;height:calc(100vh - 280px)}
.lead-list::-webkit-scrollbar{width:3px}
.lead-list::-webkit-scrollbar-thumb{background:var(--gray-200);border-radius:2px}
.lead-card{background:#fff;border:1.5px solid var(--gray-200);border-radius:10px;padding:11px 12px;transition:border-color .15s,box-shadow .15s;position:relative}
.lead-card:hover{border-color:var(--blue-border);box-shadow:0 2px 10px rgba(12,45,94,.06)}
.lead-card.just-sent{border-color:#86EFAC;background:#F0FDF4}
.lc-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;gap:6px}
.lc-name{font-size:13px;font-weight:600;color:var(--gray-900);line-height:1.2;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.platform-badge{font-size:9px;font-weight:600;padding:2px 7px;border-radius:20px;white-space:nowrap;flex-shrink:0;letter-spacing:.02em}
.badge-indiamart{background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE}
.badge-justdial{background:#FFF7ED;color:#C2410C;border:1px solid #FED7AA}
.badge-tradeindia{background:#F5F3FF;color:#6D28D9;border:1px solid #DDD6FE}
.lc-product{font-size:12px;color:var(--gray-700);margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lc-meta{display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap}
.lc-city{font-size:11px;background:var(--gray-100);color:var(--gray-600);padding:2px 7px;border-radius:4px}
.lc-time{font-size:11px;color:var(--gray-400);margin-left:auto}
.lc-status{font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;letter-spacing:.01em}
.status-pending{background:#FEF9C3;color:#854D0E}
.status-followed_up{background:#DCFCE7;color:#166534}
.status-called_back{background:#DBEAFE;color:#1E40AF}
.status-interested{background:#F3E8FF;color:#6B21A8}
.status-closed_won{background:#DCFCE7;color:#14532D}
.status-closed_lost{background:#FEE2E2;color:#991B1B}
.lc-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.btn-wa{display:flex;align-items:center;gap:5px;background:var(--green-wa);color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:12px;font-weight:500;font-family:inherit;cursor:pointer;transition:background .15s,transform .1s;flex:1;justify-content:center}
.btn-wa:hover{background:var(--green-wa-dark)}.btn-wa:active{transform:scale(.97)}
.btn-wa:disabled{background:var(--gray-300);cursor:not-allowed;transform:none}
.btn-wa.sent{background:var(--green-sent)}
.btn-wa-loading{display:flex;align-items:center;gap:6px;background:var(--gray-200);color:var(--gray-600);border:none;border-radius:6px;padding:6px 12px;font-size:12px;font-family:inherit;flex:1;justify-content:center;cursor:default}
.loading-dot{width:6px;height:6px;background:var(--gray-400);border-radius:50%;animation:bounce .8s ease-in-out infinite}
.loading-dot:nth-child(2){animation-delay:.15s}.loading-dot:nth-child(3){animation-delay:.3s}
@keyframes bounce{0%,80%,100%{transform:scale(.7);opacity:.5}40%{transform:scale(1);opacity:1}}
.btn-status-toggle{background:none;border:1.5px solid var(--gray-200);border-radius:6px;padding:5px 8px;font-size:11px;color:var(--gray-600);cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap}
.btn-status-toggle:hover{border-color:var(--blue-mid);color:var(--blue-mid)}
.btn-notes-toggle{background:none;border:1.5px solid var(--gray-200);border-radius:6px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--gray-400);transition:all .15s;flex-shrink:0}
.btn-notes-toggle:hover{border-color:var(--blue-mid);color:var(--blue-mid)}
.status-dropdown{background:#fff;border:1.5px solid var(--gray-200);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.1);margin-top:6px;overflow:hidden}
.status-opt{padding:8px 12px;font-size:12px;cursor:pointer;color:var(--gray-700);transition:background .1s;font-family:inherit;width:100%;background:none;border:none;text-align:left;display:flex;align-items:center;gap:8px}
.status-opt:hover{background:var(--gray-50)}
.notes-area{margin-top:8px;display:none}.notes-area.open{display:block}
.notes-textarea{width:100%;border:1.5px solid var(--gray-200);border-radius:6px;padding:8px 10px;font-size:12px;font-family:inherit;color:var(--gray-700);resize:none;outline:none;min-height:60px;transition:border-color .15s}
.notes-textarea:focus{border-color:var(--blue-mid)}
.btn-save-note{margin-top:5px;background:var(--blue-mid);color:#fff;border:none;border-radius:6px;padding:5px 12px;font-size:11px;font-family:inherit;cursor:pointer;float:right}
.btn-save-note:hover{background:var(--blue-deep)}
.empty-state{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center;color:var(--gray-600)}
.empty-illustration{font-size:40px;margin-bottom:12px}
.empty-title{font-size:14px;font-weight:600;color:var(--gray-700);margin-bottom:6px}
.empty-sub{font-size:12px;color:var(--gray-600);line-height:1.5;margin-bottom:16px}
.empty-links{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.platform-link{font-size:12px;font-weight:500;padding:6px 14px;border-radius:6px;text-decoration:none;transition:opacity .15s}
.platform-link:hover{opacity:.85}
.im-link{background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE}
.jd-link{background:#FFF7ED;color:#C2410C;border:1px solid #FED7AA}
.bottom-bar{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-top:1px solid var(--gray-200);background:var(--gray-50);position:sticky;bottom:0}
.bottom-count{font-size:11px;color:var(--gray-600)}
.bottom-actions{display:flex;gap:5px}
.btn-export{display:flex;align-items:center;gap:4px;background:#fff;border:1px solid var(--gray-200);border-radius:5px;padding:4px 10px;font-size:11px;color:var(--gray-700);cursor:pointer;font-family:inherit;transition:background .15s}
.btn-export:hover{background:var(--gray-100)}
.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;display:flex;align-items:flex-end;justify-content:center;padding:0}
.ai-modal{background:#fff;border-radius:16px 16px 0 0;padding:18px 16px 20px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 -8px 32px rgba(0,0,0,.15);animation:slideUp .25s ease-out}
@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
.ai-modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.ai-modal-title{display:flex;align-items:center;gap:7px;font-size:15px;font-weight:600;color:var(--blue-deep)}
.modal-close-btn{background:var(--gray-100);border:none;border-radius:6px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--gray-600);transition:background .15s}
.modal-close-btn:hover{background:var(--gray-200)}
.ai-modal-buyer{background:var(--gray-50);border:1px solid var(--gray-200);border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:12px;color:var(--gray-700)}
.buyer-name{font-weight:600;color:var(--gray-900);display:block;margin-bottom:3px}
.phone-badge{display:inline-flex;align-items:center;gap:4px;background:var(--blue-light);color:var(--blue-mid);font-size:11px;padding:2px 8px;border-radius:4px;border:1px solid var(--blue-border)}
.ai-msg-label-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.ai-msg-label{font-size:11px;color:var(--gray-600)}
.regen-btn{display:flex;align-items:center;gap:4px;background:none;border:none;color:var(--blue-mid);font-size:11px;cursor:pointer;font-family:inherit;padding:3px 6px;border-radius:4px;transition:background .15s}
.regen-btn:hover{background:var(--blue-light)}
.regen-btn.spinning svg{animation:spin .8s linear infinite}
.ai-textarea{width:100%;border:1.5px solid var(--gray-200);border-radius:8px;padding:10px 12px;font-size:13px;font-family:inherit;color:var(--gray-700);resize:vertical;outline:none;line-height:1.55;transition:border-color .15s;min-height:100px}
.ai-textarea:focus{border-color:var(--blue-mid)}
.ai-textarea:disabled{background:var(--gray-50);color:var(--gray-400)}
.ai-modal-actions{display:flex;gap:8px;margin-top:12px}
.btn-cancel-modal{background:var(--gray-100);color:var(--gray-700);border:1px solid var(--gray-200);border-radius:8px;padding:10px 16px;font-size:13px;font-family:inherit;cursor:pointer;transition:background .15s}
.btn-cancel-modal:hover{background:var(--gray-200)}
.btn-send-wa{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:var(--green-wa);color:#fff;border:none;border-radius:8px;padding:10px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:background .15s,transform .1s}
.btn-send-wa:hover{background:var(--green-wa-dark)}.btn-send-wa:active{transform:scale(.98)}
.upgrade-modal{background:#fff;border-radius:16px 16px 0 0;padding:18px 16px 24px;width:100%;max-height:90vh;overflow-y:auto;animation:slideUp .25s ease-out}
.upgrade-header{display:flex;align-items:center;justify-content:space-between;font-size:15px;font-weight:700;color:var(--blue-deep);margin-bottom:16px}
.plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.plan-card{border:1.5px solid var(--gray-200);border-radius:10px;padding:12px;position:relative}
.plan-card.plan-highlight{border-color:var(--blue-mid);background:var(--blue-light)}
.plan-badge{position:absolute;top:-1px;right:10px;background:var(--blue-mid);color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:0 0 5px 5px;letter-spacing:.04em}
.plan-name{font-size:12px;font-weight:600;color:var(--blue-deep);margin-bottom:4px}
.plan-price{font-size:18px;font-weight:800;color:var(--blue-mid);margin-bottom:8px}
.plan-features{list-style:none}
.plan-features li{font-size:11px;color:var(--gray-700);margin-bottom:3px}
.upi-box{background:#F0FDF4;border:1px solid #86EFAC;border-radius:8px;padding:12px;font-size:12px;color:#166534;line-height:1.7;margin-bottom:12px}
.btn-activate-link{width:100%;background:none;border:1.5px solid var(--blue-mid);border-radius:8px;padding:10px;font-size:12px;font-weight:500;color:var(--blue-mid);cursor:pointer;font-family:inherit;transition:background .15s}
.btn-activate-link:hover{background:var(--blue-light)}
.toast{position:fixed;bottom:60px;left:50%;transform:translateX(-50%) translateY(10px);background:var(--gray-900);color:#fff;padding:8px 16px;border-radius:8px;font-size:12px;z-index:99999;opacity:0;transition:opacity .2s,transform .2s;white-space:nowrap;pointer-events:none}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.toast.success{background:#166534}.toast.error{background:var(--red)}
.offline-banner{background:#FEF3C7;color:#92400E;font-size:11px;padding:6px 14px;text-align:center;display:none}
</style>
</head>
<body>

<header class="sb-header">
  <div class="sb-logo">
    <div class="sb-logo-text">
      <span class="sb-brand">⚡ LeadPing</span>
      <span class="sb-tagline">Lead Follow-Up</span>
    </div>
  </div>
  <div class="sb-header-actions">
    <span id="tier-badge" class="tier-badge tier-${esc(tier)}">${tier === 'lifetime' ? '✨ Lifetime' : tier === 'pro' ? '⚡ Pro' : 'Free'}</span>
    <button id="refresh-btn" class="icon-btn" title="Refresh leads">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
    </button>
  </div>
</header>

<div id="announcement-banner" class="announcement-banner" style="display:none"></div>
<div id="offline-banner" class="offline-banner">⚠️ Offline — showing cached data</div>

<div class="stats-row">
  <div class="stat-card"><div id="stat-detected" class="stat-num detected">0</div><div class="stat-label">Detected</div></div>
  <div class="stat-divider"></div>
  <div class="stat-card"><div id="stat-followed" class="stat-num followed">0</div><div class="stat-label">Followed Up</div></div>
  <div class="stat-divider"></div>
  <div class="stat-card"><div id="stat-pending" class="stat-num pending">0</div><div class="stat-label">Pending</div></div>
</div>

<div class="filter-row">
  <button class="filter-chip active" data-filter="all">All</button>
  <button class="filter-chip" data-filter="indiamart"><span class="chip-dot dot-im"></span>IndiaMART</button>
  <button class="filter-chip" data-filter="justdial"><span class="chip-dot dot-jd"></span>JustDial</button>
  <button class="filter-chip" data-filter="tradeindia"><span class="chip-dot dot-ti"></span>TradeIndia</button>
</div>

<div class="status-filter-row">
  <button class="status-chip active" data-status="all">All Status</button>
  <button class="status-chip" data-status="pending">⏳ Pending</button>
  <button class="status-chip" data-status="followed_up">✅ Followed</button>
  <button class="status-chip" data-status="interested">⭐ Interested</button>
</div>

<div class="search-row">
  <div class="search-wrap">
    <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input type="text" id="search-input" class="search-input" placeholder="Search leads...">
  </div>
</div>

<div id="lead-list" class="lead-list"></div>

<div id="empty-state" class="empty-state" style="display:none">
  <div class="empty-illustration">⚡</div>
  <div class="empty-title">LeadPing is watching</div>
  <div class="empty-sub">Open IndiaMART, JustDial, or TradeIndia to auto-detect leads.</div>
  <div class="empty-links">
    <a href="https://leadmanager.indiamart.com/" target="_blank" class="platform-link im-link">Open IndiaMART</a>
    <a href="https://my.justdial.com/" target="_blank" class="platform-link jd-link">Open JustDial</a>
  </div>
</div>

<div class="bottom-bar">
  <span id="total-count" class="bottom-count">0 leads today</span>
  <div class="bottom-actions">
    <button id="export-csv" class="btn-export">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      CSV
    </button>
    <button id="export-json" class="btn-export">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      JSON
    </button>
  </div>
</div>

<!-- AI MODAL -->
<div id="ai-modal" class="modal-backdrop" style="display:none">
  <div class="ai-modal">
    <div class="ai-modal-header">
      <div class="ai-modal-title"><span>📱</span><span>Send WhatsApp Message</span></div>
      <button id="ai-modal-close" class="modal-close-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="ai-modal-buyer" id="ai-modal-buyer"></div>
    <div class="ai-msg-label-row">
      <span class="ai-msg-label">✨ AI-generated message (editable)</span>
      <button id="ai-regen-btn" class="regen-btn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23,4 23,10 17,10"/><polyline points="1,20 1,14 7,14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        Regenerate
      </button>
    </div>
    <textarea id="ai-textarea" class="ai-textarea" rows="5" placeholder="Generating message..."></textarea>
    <div class="ai-modal-actions">
      <button id="ai-cancel-btn" class="btn-cancel-modal">Cancel</button>
      <button id="ai-send-btn" class="btn-send-wa">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
        Send on WhatsApp
      </button>
    </div>
  </div>
</div>

<!-- UPGRADE MODAL -->
<div id="upgrade-modal" class="modal-backdrop" style="display:none">
  <div class="upgrade-modal">
    <div class="upgrade-header">
      <span>🚀 Upgrade to LeadPing Pro</span>
      <button id="upgrade-close" class="modal-close-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="plan-grid">
      <div class="plan-card">
        <div class="plan-name">Free</div><div class="plan-price">₹0</div>
        <ul class="plan-features"><li>10 WhatsApp/day</li><li>3 AI messages/day</li><li>IndiaMART only</li></ul>
      </div>
      <div class="plan-card plan-highlight">
        <div class="plan-badge">POPULAR</div>
        <div class="plan-name">Lifetime</div><div class="plan-price" id="upgrade-price">₹1,999</div>
        <ul class="plan-features"><li>✅ Unlimited WhatsApp</li><li>✅ Unlimited AI</li><li>✅ All 3 platforms</li><li>✅ Forever, no renewal</li></ul>
      </div>
    </div>
    <div class="upi-box">
      💳 Pay <strong id="upgrade-price-text">₹1,999</strong> to <strong id="upgrade-upi">leadping@upi</strong><br>
      📱 Send screenshot to WhatsApp: <strong id="upgrade-wa">+91 9999999999</strong>
    </div>
    <button id="go-activate-btn" class="btn-activate-link">Already bought? Enter license key →</button>
  </div>
</div>

<script>
var USER_ID = '${esc(userId)}';
var USER_TIER = '${esc(tier)}';
var BACKEND_URL = '${esc(backendUrl)}';

var allLeads = [];
var currentFilter = 'all';
var currentStatusFilter = 'all';
var currentSearchQuery = '';
var activeModalLead = null;
var pollInterval = null;

// ── INIT ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  loadLeads();
  bindEvents();
  loadRemoteConfig();
  // Poll for new leads every 10 seconds (content scripts push to backend)
  pollInterval = setInterval(loadLeads, 10000);
  // Listen for messages from parent extension frame
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'LP_NEW_LEADS') loadLeads();
    if (e.data && e.data.type === 'LP_AI_RESPONSE') handleAIResponse(e.data);
  });
});

function loadLeads() {
  if (!USER_ID) { showEmpty(); return; }
  fetch(BACKEND_URL + '/api/leads?user_id=' + encodeURIComponent(USER_ID))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data && Array.isArray(data.leads)) {
        allLeads = data.leads.sort(function(a, b) { return (b.detected_at || 0) - (a.detected_at || 0); });
        renderStats();
        renderLeads();
        updateFooterCount();
        hideOfflineBanner();
      }
    })
    .catch(function() { showOfflineBanner(); });
}

function loadRemoteConfig() {
  fetch(BACKEND_URL + '/api/config' + (USER_ID ? '?user_id=' + encodeURIComponent(USER_ID) : ''))
    .then(function(r) { return r.json(); })
    .then(function(cfg) {
      if (cfg.announcement && cfg.announcement.text) {
        var b = document.getElementById('announcement-banner');
        if (b) { b.textContent = cfg.announcement.text; b.style.display = 'block'; }
      }
      if (cfg.upgrade) {
        var p = document.getElementById('upgrade-price-text');
        var u = document.getElementById('upgrade-upi');
        var w = document.getElementById('upgrade-wa');
        if (p && cfg.upgrade.pricing) p.textContent = '₹' + (cfg.upgrade.pricing.lifetime || 1999);
        if (u && cfg.upgrade.upi_id) u.textContent = cfg.upgrade.upi_id;
        if (w && cfg.upgrade.whatsapp_number) w.textContent = cfg.upgrade.whatsapp_number;
      }
    })
    .catch(function() {});
}

// ── STATS ──────────────────────────────────────────────────────────────

function renderStats() {
  var now = new Date(); var ds = new Date(now); ds.setHours(0,0,0,0); var de = new Date(now); de.setHours(23,59,59,999);
  var today = allLeads.filter(function(l) { var d = new Date(l.detected_at||0); return d>=ds&&d<=de; });
  setText('stat-detected', today.length);
  setText('stat-followed', today.filter(function(l){return l.status&&l.status!=='pending';}).length);
  setText('stat-pending',  today.filter(function(l){return !l.status||l.status==='pending';}).length);
}

function updateFooterCount() {
  var now = new Date(); var ds = new Date(now); ds.setHours(0,0,0,0); var de = new Date(now); de.setHours(23,59,59,999);
  var n = allLeads.filter(function(l){var d=new Date(l.detected_at||0);return d>=ds&&d<=de;}).length;
  setText('total-count', n + ' lead' + (n!==1?'s':'') + ' today');
}

// ── RENDER ──────────────────────────────────────────────────────────────

var PLAT = {indiamart:'IndiaMART',justdial:'JustDial',tradeindia:'TradeIndia'};
var STAT_LABELS = {pending:'⏳ Pending',followed_up:'✅ Followed Up',called_back:'📞 Called Back',interested:'⭐ Interested',closed_won:'🏆 Won',closed_lost:'❌ Lost'};
var STAT_OPTS = [{v:'pending',l:'⏳ Pending'},{v:'followed_up',l:'✅ Followed Up'},{v:'called_back',l:'📞 Called Back'},{v:'interested',l:'⭐ Interested'},{v:'closed_won',l:'🏆 Closed Won'},{v:'closed_lost',l:'❌ Closed Lost'}];

function getFiltered() {
  return allLeads.filter(function(l) {
    if (currentFilter!=='all'&&l.platform!==currentFilter) return false;
    if (currentStatusFilter!=='all'&&l.status!==currentStatusFilter) return false;
    if (currentSearchQuery) {
      var h = [l.buyer_name,l.product,l.city,l.company,l.buyer_phone].join(' ').toLowerCase();
      if (h.indexOf(currentSearchQuery)===-1) return false;
    }
    return true;
  });
}

function renderLeads() {
  var list = document.getElementById('lead-list');
  var empty = document.getElementById('empty-state');
  if (!list) return;
  var filtered = getFiltered();
  list.innerHTML = '';
  if (!filtered.length) { list.style.display='none'; if(empty)empty.style.display='flex'; return; }
  list.style.display='flex'; if(empty)empty.style.display='none';
  filtered.forEach(function(l) { list.appendChild(buildCard(l)); });
}

function showEmpty() {
  var list = document.getElementById('lead-list');
  var empty = document.getElementById('empty-state');
  if(list)list.style.display='none';
  if(empty)empty.style.display='flex';
}

function buildCard(lead) {
  var status = lead.status||'pending';
  var platform = lead.platform||'indiamart';
  var card = el('div','lead-card'); card.dataset.id = lead.lead_id||lead._id||'';

  var top = el('div','lc-top');
  var nameEl = el('div','lc-name'); nameEl.textContent = lead.buyer_name||'Unknown Buyer';
  var platBadge = el('span','platform-badge badge-'+platform); platBadge.textContent = PLAT[platform]||platform;
  top.appendChild(nameEl); top.appendChild(platBadge);

  var prodEl = el('div','lc-product'); prodEl.innerHTML = '<span>📦</span> ' + esc(lead.product||'Product not detected');

  var meta = el('div','lc-meta');
  var cityEl = el('span','lc-city'); cityEl.textContent = '📍 '+(lead.city||'Unknown');
  var timeEl = el('span','lc-time'); timeEl.textContent = timeAgo(lead.detected_at);
  meta.appendChild(cityEl); meta.appendChild(timeEl);

  var actions = el('div','lc-actions');

  var waBtn = el('button','btn-wa');
  if (status!=='pending'&&status!=='called_back') { waBtn.classList.add('sent'); waBtn.innerHTML='<span>✅</span> Sent'; }
  else waBtn.innerHTML = '<span>📱</span> WhatsApp';
  if (!lead.buyer_phone) { waBtn.disabled=true; waBtn.title='Phone number not available'; }
  waBtn.addEventListener('click', function(){ handleWA(lead, waBtn, card); });

  var statusBadge = el('span','lc-status status-'+status);
  statusBadge.id = 'status-'+(lead.lead_id||lead._id||'');
  statusBadge.textContent = STAT_LABELS[status]||'⏳ Pending';

  var statusToggle = el('button','btn-status-toggle'); statusToggle.textContent='↓'; statusToggle.title='Change status';
  statusToggle.addEventListener('click',function(e){e.stopPropagation();toggleDropdown(lead,card,statusToggle,statusBadge);});

  var notesToggle = el('button','btn-notes-toggle');
  notesToggle.title='Add notes';
  notesToggle.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  notesToggle.addEventListener('click',function(){toggleNotes(lead,card);});

  actions.appendChild(waBtn); actions.appendChild(statusBadge); actions.appendChild(statusToggle); actions.appendChild(notesToggle);

  var notesArea = el('div','notes-area'); notesArea.id='notes-area-'+(lead.lead_id||lead._id||'');
  var notesTA = el('textarea','notes-textarea'); notesTA.id='notes-ta-'+(lead.lead_id||lead._id||'');
  notesTA.placeholder='Add notes about this lead...'; notesTA.value=lead.notes||''; notesTA.rows=2;
  var saveNoteBtn = el('button','btn-save-note'); saveNoteBtn.textContent='Save Note';
  saveNoteBtn.addEventListener('click',function(){saveNote(lead,notesTA.value,saveNoteBtn);});
  notesArea.appendChild(notesTA); notesArea.appendChild(saveNoteBtn);

  card.appendChild(top); card.appendChild(prodEl); card.appendChild(meta); card.appendChild(actions); card.appendChild(notesArea);
  return card;
}

// ── WA BUTTON ──────────────────────────────────────────────────────────

function handleWA(lead, btn, card) {
  if (!lead.buyer_phone) { showToast('No phone number available', 'error'); return; }
  // Check usage
  fetch(BACKEND_URL + '/api/usage/check?user_id=' + encodeURIComponent(USER_ID) + '&type=whatsapp')
    .then(function(r){return r.json();})
    .then(function(usage){
      if (usage && usage.allowed===false) { showUpgradeModal(); return; }
      startGenerating(lead, btn, card);
    })
    .catch(function(){ startGenerating(lead, btn, card); });
}

function startGenerating(lead, btn, card) {
  var origContent = btn.innerHTML;
  btn.disabled=true; btn.className='btn-wa-loading';
  btn.innerHTML='<div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div>';

  // Ask parent extension to generate via background.js (has GROQ key access)
  // Fall back to direct backend call
  var done = false;
  function finish(msg) {
    if (done) return; done=true;
    btn.disabled=false; btn.className='btn-wa'; btn.innerHTML=origContent;
    openAIModal(lead, msg);
  }

  // Try via postMessage to parent extension
  window.parent.postMessage({
    type: 'LP_GENERATE_AI',
    user_id: USER_ID,
    buyer_name: lead.buyer_name||'',
    product: lead.product||'',
    city: lead.city||'',
    company: lead.company||'',
    platform: lead.platform||'indiamart',
    lead_id: lead.lead_id||lead._id||''
  }, '*');

  // Also directly call backend as primary path
  fetch(BACKEND_URL + '/api/ai/generate', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      user_id: USER_ID,
      buyer_name: lead.buyer_name||'',
      product: lead.product||'',
      city: lead.city||'',
      company: lead.company||'',
      platform: lead.platform||'indiamart'
    })
  })
  .then(function(r){return r.json();})
  .then(function(data){ finish(data.message || 'Namaste! Kab baat ho sakti hai? 🙏'); })
  .catch(function(){ finish('Namaste! Aapka inquiry mila. Kab baat ho sakti hai? 🙏'); });
}

function handleAIResponse(data) {
  // Called if parent extension sends back AI response
}

// ── AI MODAL ──────────────────────────────────────────────────────────

function openAIModal(lead, message) {
  activeModalLead = lead;
  var buyerEl = document.getElementById('ai-modal-buyer');
  if (buyerEl) {
    buyerEl.innerHTML =
      '<span class="buyer-name">'+esc(lead.buyer_name||'Unknown Buyer')+'</span>' +
      (lead.buyer_phone ? '<span class="phone-badge">📞 +91 '+esc(lead.buyer_phone)+'</span>' : '<span style="font-size:11px;color:#9CA3AF">No phone number</span>') +
      (lead.product ? '<div style="font-size:11px;margin-top:4px;color:#6B7280">📦 '+esc(lead.product)+'</div>' : '');
  }
  var ta = document.getElementById('ai-textarea');
  if (ta) { ta.value=message; ta.disabled=false; }
  document.getElementById('ai-modal').style.display='flex';
}

function closeAIModal() {
  document.getElementById('ai-modal').style.display='none';
  activeModalLead=null;
}

function handleAISend() {
  if (!activeModalLead) return;
  var lead = activeModalLead;
  var ta = document.getElementById('ai-textarea');
  var msg = ta ? ta.value.trim() : '';
  if (!msg) { showToast('Message cannot be empty','error'); return; }
  if (!lead.buyer_phone) { showToast('No phone number available','error'); return; }

  var phone = String(lead.buyer_phone).replace(/\D/g,'');
  if (phone.length===12&&phone.startsWith('91')) phone=phone.slice(2);
  if (phone.length===10&&'6789'.includes(phone[0])) {
    var waUrl = 'https://wa.me/91'+phone+'?text='+encodeURIComponent(msg);
    window.open(waUrl,'_blank');
  } else {
    showToast('Invalid phone number','error'); return;
  }

  // Update backend
  var leadId = lead.lead_id||lead._id||'';
  fetch(BACKEND_URL + '/api/leads/status', {
    method:'PATCH',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({user_id:USER_ID, lead_id:leadId, status:'followed_up', message_sent:msg})
  }).catch(function(){});
  fetch(BACKEND_URL + '/api/usage/increment', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({user_id:USER_ID, type:'whatsapp', lead_id:leadId})
  }).catch(function(){});

  // Update local
  allLeads.forEach(function(l){if((l.lead_id||l._id)===leadId){l.status='followed_up';l.followed_up_at=Date.now();}});
  updateCardAfterSend(leadId);
  renderStats();
  closeAIModal();
  showToast('WhatsApp opened! Lead marked as followed up ✅','success');
}

function updateCardAfterSend(leadId) {
  var statusEl = document.getElementById('status-'+leadId);
  if (statusEl) { statusEl.className='lc-status status-followed_up'; statusEl.textContent='✅ Followed Up'; }
  var card = document.querySelector('[data-id="'+leadId+'"]');
  if (card) {
    var waBtn = card.querySelector('.btn-wa');
    if (waBtn) { waBtn.classList.add('sent'); waBtn.innerHTML='<span>✅</span> Sent'; }
    card.classList.add('just-sent');
  }
}

function handleRegen() {
  if (!activeModalLead) return;
  var lead = activeModalLead;
  var ta = document.getElementById('ai-textarea');
  var regenBtn = document.getElementById('ai-regen-btn');
  if (ta) { ta.disabled=true; ta.value='Regenerating...'; }
  if (regenBtn) regenBtn.classList.add('spinning');
  fetch(BACKEND_URL + '/api/ai/generate', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({user_id:USER_ID,buyer_name:lead.buyer_name||'',product:lead.product||'',city:lead.city||'',company:lead.company||'',platform:lead.platform||'indiamart'})
  })
  .then(function(r){return r.json();})
  .then(function(d){if(ta){ta.value=d.message||'Namaste! Kab baat ho sakti hai? 🙏';ta.disabled=false;}if(regenBtn)regenBtn.classList.remove('spinning');})
  .catch(function(){if(ta){ta.value='Namaste! Kab baat ho sakti hai? 🙏';ta.disabled=false;}if(regenBtn)regenBtn.classList.remove('spinning');});
}

// ── STATUS DROPDOWN ──────────────────────────────────────────────────

var openDropdownId = null;
function toggleDropdown(lead, card, toggleBtn, statusBadge) {
  var existing = document.getElementById('dropdown-'+(lead.lead_id||lead._id));
  if (existing) { existing.remove(); openDropdownId=null; return; }
  if (openDropdownId) { var old=document.getElementById('dropdown-'+openDropdownId); if(old)old.remove(); openDropdownId=null; }
  var dd = el('div','status-dropdown'); dd.id='dropdown-'+(lead.lead_id||lead._id);
  STAT_OPTS.forEach(function(opt){
    var btn=el('button','status-opt'); btn.textContent=opt.l;
    if(lead.status===opt.v) btn.style.fontWeight='600';
    btn.addEventListener('click',function(){changeStatus(lead,opt.v,statusBadge,card);dd.remove();openDropdownId=null;});
    dd.appendChild(btn);
  });
  card.appendChild(dd); openDropdownId=(lead.lead_id||lead._id);
  setTimeout(function(){
    document.addEventListener('click',function handler(e){
      if(!dd.contains(e.target)&&e.target!==toggleBtn){dd.remove();openDropdownId=null;document.removeEventListener('click',handler);}
    });
  },10);
}

function changeStatus(lead, newStatus, statusBadge, card) {
  var leadId = lead.lead_id||lead._id||'';
  lead.status=newStatus;
  if(statusBadge){statusBadge.className='lc-status status-'+newStatus;statusBadge.textContent=STAT_LABELS[newStatus]||newStatus;}
  fetch(BACKEND_URL+'/api/leads/status',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:USER_ID,lead_id:leadId,status:newStatus})}).catch(function(){});
  renderStats();
  showToast('Status updated ✓','success');
}

// ── NOTES ──────────────────────────────────────────────────────────────

function toggleNotes(lead, card) {
  var area = document.getElementById('notes-area-'+(lead.lead_id||lead._id));
  if (area) {
    area.classList.toggle('open');
    if(area.classList.contains('open')){var ta=document.getElementById('notes-ta-'+(lead.lead_id||lead._id));if(ta)ta.focus();}
  }
}

function saveNote(lead, notes, btn) {
  var leadId = lead.lead_id||lead._id||'';
  fetch(BACKEND_URL+'/api/leads/status',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:USER_ID,lead_id:leadId,notes:notes})})
    .then(function(){if(btn){btn.textContent='✅ Saved';setTimeout(function(){btn.textContent='Save Note';},1500);}})
    .catch(function(){});
  allLeads.forEach(function(l){if((l.lead_id||l._id)===leadId)l.notes=notes;});
}

// ── UPGRADE MODAL ──────────────────────────────────────────────────────

function showUpgradeModal() { document.getElementById('upgrade-modal').style.display='flex'; }
function closeUpgradeModal() { document.getElementById('upgrade-modal').style.display='none'; }

// ── EXPORT ──────────────────────────────────────────────────────────────

function exportCSV() {
  var headers=['lead_id','platform','buyer_name','buyer_phone','product','city','company','status','detected_at','notes'];
  var rows=[headers.join(',')];
  allLeads.forEach(function(l){rows.push(headers.map(function(h){var v=l[h]||'';if(h==='detected_at')v=v?new Date(v).toISOString():'';return '"'+String(v).replace(/"/g,'""')+'"';}).join(','));});
  downloadBlob(rows.join('\\n'),'leadping-'+dateStr()+'.csv','text/csv');
  showToast('CSV exported ✓','success');
}
function exportJSON() {
  downloadBlob(JSON.stringify(allLeads,null,2),'leadping-'+dateStr()+'.json','application/json');
  showToast('JSON exported ✓','success');
}
function downloadBlob(content,filename,type) {
  var blob=new Blob([content],{type:type}); var url=URL.createObjectURL(blob);
  var a=document.createElement('a'); a.href=url; a.download=filename; a.click();
  setTimeout(function(){URL.revokeObjectURL(url);},1000);
}

// ── BIND EVENTS ──────────────────────────────────────────────────────────

function bindEvents() {
  document.querySelectorAll('.filter-chip').forEach(function(chip){
    chip.addEventListener('click',function(){
      document.querySelectorAll('.filter-chip').forEach(function(c){c.classList.remove('active');});
      chip.classList.add('active'); currentFilter=chip.dataset.filter; renderLeads();
    });
  });
  document.querySelectorAll('.status-chip').forEach(function(chip){
    chip.addEventListener('click',function(){
      document.querySelectorAll('.status-chip').forEach(function(c){c.classList.remove('active');});
      chip.classList.add('active'); currentStatusFilter=chip.dataset.status; renderLeads();
    });
  });
  var si=document.getElementById('search-input');
  if(si)si.addEventListener('input',function(){currentSearchQuery=si.value.trim().toLowerCase();renderLeads();});

  var rb=document.getElementById('refresh-btn');
  if(rb)rb.addEventListener('click',function(){rb.classList.add('spinning');loadLeads();setTimeout(function(){rb.classList.remove('spinning');},800);});

  document.getElementById('ai-modal-close').addEventListener('click',closeAIModal);
  document.getElementById('ai-cancel-btn').addEventListener('click',closeAIModal);
  document.getElementById('ai-modal').addEventListener('click',function(e){if(e.target===this)closeAIModal();});
  document.getElementById('ai-send-btn').addEventListener('click',handleAISend);
  document.getElementById('ai-regen-btn').addEventListener('click',handleRegen);
  document.getElementById('upgrade-close').addEventListener('click',closeUpgradeModal);
  document.getElementById('upgrade-modal').addEventListener('click',function(e){if(e.target===this)closeUpgradeModal();});
  document.getElementById('go-activate-btn').addEventListener('click',function(){closeUpgradeModal();window.parent.postMessage({type:'LP_OPEN_OPTIONS'},'*');});
  document.getElementById('export-csv').addEventListener('click',exportCSV);
  document.getElementById('export-json').addEventListener('click',exportJSON);
}

// ── HELPERS ──────────────────────────────────────────────────────────────

function showOfflineBanner(){var b=document.getElementById('offline-banner');if(b)b.style.display='block';}
function hideOfflineBanner(){var b=document.getElementById('offline-banner');if(b)b.style.display='none';}
function el(tag,cls){var e=document.createElement(tag);if(cls)e.className=cls;return e;}
function setText(id,val){var e=document.getElementById(id);if(e)e.textContent=String(val);}
function esc(str){return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function timeAgo(ts){if(!ts)return '';var d=Date.now()-ts,m=Math.floor(d/60000);if(m<1)return 'Just now';if(m<60)return m+'m ago';var h=Math.floor(m/60);if(h<24)return h+'h ago';return Math.floor(h/24)+'d ago';}
function dateStr(){return new Date().toISOString().slice(0,10);}

var toastTimer=null;
function showToast(msg,type){
  var t=document.getElementById('toast-el');
  if(!t){t=document.createElement('div');t.id='toast-el';t.className='toast';document.body.appendChild(t);}
  t.textContent=msg; t.className='toast '+(type||'success');
  clearTimeout(toastTimer);
  requestAnimationFrame(function(){t.classList.add('show');toastTimer=setTimeout(function(){t.classList.remove('show');},2800);});
}
</script>
</body>
</html>`;
}
