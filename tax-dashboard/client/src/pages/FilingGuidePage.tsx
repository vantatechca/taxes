import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, ChevronDown, ChevronRight, ExternalLink, AlertTriangle,
  CheckSquare, Square, Info, Shield, Building2, DollarSign, FileText,
  Calendar, MapPin, Scale, Landmark, Globe, ClipboardCheck, Receipt,
  KeyRound, UserCheck, RefreshCw, BadgeAlert, Banknote, ScrollText,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Tab = 'canada' | 'us';

interface ChecklistItem {
  key: string;
  label: string;
}

interface SectionDef {
  id: string;
  title: string;
  icon: React.ElementType;
  badge: { label: string; color: string };
  content: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Checklists (saved to localStorage)
// ---------------------------------------------------------------------------
const CA_CHECKLIST: ChecklistItem[] = [
  { key: 'ca_clicsequr', label: 'Register for ClicSEQUR account' },
  { key: 'ca_mondossier', label: 'Access Mon Dossier for businesses' },
  { key: 'ca_link_companies', label: 'Link all 4 companies via NEQ' },
  { key: 'ca_tps_tvq_registered', label: 'Confirm TPS/TVQ registration for all companies' },
  { key: 'ca_q1_filed', label: 'File Q1 TPS/TVQ return (due Apr 30)' },
  { key: 'ca_q2_filed', label: 'File Q2 TPS/TVQ return (due Jul 31)' },
  { key: 'ca_q3_filed', label: 'File Q3 TPS/TVQ return (due Oct 31)' },
  { key: 'ca_q4_filed', label: 'File Q4 TPS/TVQ return (due Jan 31)' },
  { key: 'ca_t2_filed', label: 'File T2 Corporate Income Tax (federal)' },
  { key: 'ca_co17_filed', label: 'File CO-17 (provincial income tax)' },
  { key: 'ca_annual_decl', label: 'File REQ Annual Declaration (all 4 companies)' },
  { key: 'ca_addresses_current', label: 'Verify company addresses are up to date' },
];

const US_CHECKLIST: ChecklistItem[] = [
  { key: 'us_llc_structure', label: 'Review LLC tax election for each company' },
  { key: 'us_federal_return', label: 'File federal tax returns (1065 or Schedule C)' },
  { key: 'us_de_franchise', label: 'Pay Delaware Annual Franchise Tax ($300)' },
  { key: 'us_ny_biennial', label: 'File New York Biennial Statement' },
  { key: 'us_ny_publication', label: 'Complete NY Publication Requirement (if new)' },
  { key: 'us_ny_it204ll', label: 'File NY IT-204-LL (LLC filing fee)' },
  { key: 'us_wy_annual', label: 'File Wyoming Annual Report' },
  { key: 'us_estimated_q1', label: 'Pay Q1 estimated tax (due Apr 15)' },
  { key: 'us_estimated_q2', label: 'Pay Q2 estimated tax (due Jun 15)' },
  { key: 'us_estimated_q3', label: 'Pay Q3 estimated tax (due Sep 15)' },
  { key: 'us_estimated_q4', label: 'Pay Q4 estimated tax (due Jan 15)' },
  { key: 'us_sales_tax_review', label: 'Evaluate sales tax nexus & registration needs' },
];

const LS_KEY = 'filing_guide_checklist';

function loadChecked(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveChecked(data: Record<string, boolean>) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Reusable small components
// ---------------------------------------------------------------------------
function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
    >
      {children}
      <ExternalLink size={13} className="shrink-0" />
    </a>
  );
}

function ExtButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
    >
      {children}
      <ExternalLink size={14} />
    </a>
  );
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mt-4">
      <AlertTriangle size={20} className="text-yellow-400 shrink-0 mt-0.5" />
      <div className="text-sm text-yellow-200">{children}</div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg mt-4">
      <Info size={20} className="text-green-400 shrink-0 mt-0.5" />
      <div className="text-sm text-green-200">{children}</div>
    </div>
  );
}

function WhyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mt-4">
      <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
      <div className="text-sm text-blue-200"><span className="font-semibold text-blue-300">Why this matters:</span> {children}</div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold shrink-0 mt-0.5">
        {n}
      </span>
      <div className="text-sm text-slate-300 leading-relaxed">{children}</div>
    </div>
  );
}

function DeadlineTable({ rows }: { rows: { period: string; due: string }[] }) {
  return (
    <div className="overflow-x-auto mt-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-2 px-3 text-slate-400 font-medium">Period</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium">Filing Deadline</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-700/50">
              <td className="py-2 px-3 text-slate-300">{r.period}</td>
              <td className="py-2 px-3 text-white font-medium">{r.due}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeeTable({ rows }: { rows: { range: string; fee: string }[] }) {
  return (
    <div className="overflow-x-auto mt-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-2 px-3 text-slate-400 font-medium">NY-Source Gross Income</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium">LLC Filing Fee</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-700/50">
              <td className="py-2 px-3 text-slate-300">{r.range}</td>
              <td className="py-2 px-3 text-white font-medium">{r.fee}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accordion
// ---------------------------------------------------------------------------
function Accordion({ section, isOpen, onToggle }: { section: SectionDef; isOpen: boolean; onToggle: () => void }) {
  const Icon = section.icon;
  const badgeClasses: Record<string, string> = {
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-700/50 transition-colors"
      >
        <Icon size={20} className="text-blue-400 shrink-0" />
        <span className="text-white font-semibold flex-1">{section.title}</span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${badgeClasses[section.badge.color] || badgeClasses.blue}`}>
          {section.badge.label}
        </span>
        {isOpen ? (
          <ChevronDown size={18} className="text-slate-400 shrink-0" />
        ) : (
          <ChevronRight size={18} className="text-slate-400 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-700">
          {section.content}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checklist component
// ---------------------------------------------------------------------------
function FilingChecklist({
  items,
  checked,
  onToggle,
}: {
  items: ChecklistItem[];
  checked: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  const done = items.filter(i => checked[i.key]).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={18} className="text-blue-400" />
          <h3 className="text-white font-semibold">Your Filing Checklist</h3>
        </div>
        <span className="text-sm text-slate-400">
          {done}/{items.length} complete ({pct}%)
        </span>
      </div>
      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-700 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {items.map(item => {
          const isDone = !!checked[item.key];
          return (
            <button
              key={item.key}
              onClick={() => onToggle(item.key)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                isDone
                  ? 'bg-green-500/10 text-green-300'
                  : 'hover:bg-slate-700/50 text-slate-300'
              }`}
            >
              {isDone ? (
                <CheckSquare size={16} className="text-green-400 shrink-0" />
              ) : (
                <Square size={16} className="text-slate-500 shrink-0" />
              )}
              <span className={isDone ? 'line-through opacity-70' : ''}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canada sections content
// ---------------------------------------------------------------------------
function CaSection1_ClicSEQUR() {
  return (
    <div className="space-y-2">
      <Step n={1}>
        Go to <ExtLink href="https://www.clicsequr.gouv.qc.ca">ClicSEQUR</ExtLink> &mdash; this is Quebec's
        central authentication system for <strong className="text-white">all</strong> government services.
      </Step>
      <Step n={2}>
        Click <strong className="text-white">"S'inscrire"</strong> (Register). You will need your SIN or business number.
      </Step>
      <Step n={3}>
        Complete identity verification. Revenu Quebec mails a code to your address &mdash; expect <strong className="text-white">5&ndash;10 business days</strong>.
      </Step>
      <Step n={4}>
        Once your account is activated, go to Mon Dossier for businesses:{' '}
        <ExtLink href="https://mon-dossier-entreprise.revenuquebec.ca">mon-dossier-entreprise.revenuquebec.ca</ExtLink>
      </Step>
      <Step n={5}>
        Link each of your companies using their <strong className="text-white">NEQ</strong> (Quebec Enterprise Number) &mdash; found on your incorporation documents.
      </Step>

      <WhyBox>
        ClicSEQUR is the <strong>only</strong> way to access Revenu Quebec online services. Without it you would
        have to file paper forms or hire someone to file on your behalf.
      </WhyBox>

      <WarningBox>
        <strong>Each company needs to be linked separately</strong> to your Mon Dossier account. Having four
        Inc./Ltee companies means you must link all four via their individual NEQ numbers.
      </WarningBox>

      <div className="flex flex-wrap gap-3 mt-4">
        <ExtButton href="https://www.clicsequr.gouv.qc.ca">Open ClicSEQUR</ExtButton>
        <ExtButton href="https://mon-dossier-entreprise.revenuquebec.ca">Open Mon Dossier</ExtButton>
      </div>
    </div>
  );
}

function CaSection2_TPSTVQ() {
  return (
    <div className="space-y-3">
      <h4 className="text-white font-medium mt-2">If already registered</h4>
      <p className="text-sm text-slate-300">
        Check <ExtLink href="https://mon-dossier-entreprise.revenuquebec.ca">Mon Dossier</ExtLink> &mdash;
        your TPS and TVQ numbers will be displayed for each linked company.
      </p>

      <h4 className="text-white font-medium mt-4">If NOT registered</h4>
      <Step n={1}>
        Visit the registration page:{' '}
        <ExtLink href="https://www.revenuquebec.ca/en/businesses/consumption-taxes/gsthst-and-qst/registering-for-the-gsthst-and-qst/">
          Registering for the GST/HST and QST
        </ExtLink>
      </Step>
      <Step n={2}>
        You can register online through Mon Dossier once you have ClicSEQUR access.
      </Step>
      <Step n={3}>
        Alternatively, submit form <strong className="text-white">LM-1-V</strong> (Application for Registration):{' '}
        <ExtLink href="https://www.revenuquebec.ca/en/online-services/forms-and-publications/current-details/lm-1-v/">
          Download LM-1-V
        </ExtLink>
      </Step>
      <Step n={4}>
        You will receive a <strong className="text-white">GST number (RT####)</strong> and a{' '}
        <strong className="text-white">QST number (TQ####)</strong>.
      </Step>

      <WhyBox>
        In Quebec, Revenu Quebec administers <strong>both</strong> the federal GST (TPS) and provincial QST (TVQ).
        You file <strong>one combined return</strong> &mdash; unlike other provinces where you deal with CRA separately.
      </WhyBox>

      <InfoBox>
        <strong>$30,000 threshold:</strong> If annual revenue is under $30K per company, you are a "small supplier"
        and registration is optional. <strong>However</strong>, once you register you <em>must</em> file even if
        revenue is $0 for the period.
      </InfoBox>
    </div>
  );
}

function CaSection3_QuarterlyFiling() {
  return (
    <div className="space-y-3">
      <Step n={1}>
        Login to <ExtLink href="https://mon-dossier-entreprise.revenuquebec.ca">Mon Dossier</ExtLink>.
      </Step>
      <Step n={2}>
        Navigate to <strong className="text-white">"Produire une declaration"</strong> (File a return).
      </Step>
      <Step n={3}>
        Select the reporting period (quarterly).
      </Step>

      <h4 className="text-white font-medium mt-4">Quarterly Deadlines</h4>
      <DeadlineTable
        rows={[
          { period: 'Q1 (Jan 1 \u2013 Mar 31)', due: 'April 30' },
          { period: 'Q2 (Apr 1 \u2013 Jun 30)', due: 'July 31' },
          { period: 'Q3 (Jul 1 \u2013 Sep 30)', due: 'October 31' },
          { period: 'Q4 (Oct 1 \u2013 Dec 31)', due: 'January 31' },
        ]}
      />

      <h4 className="text-white font-medium mt-5">What You Need</h4>
      <ul className="space-y-2 text-sm text-slate-300 ml-4 list-disc">
        <li><strong className="text-white">Total sales</strong> for the quarter</li>
        <li><strong className="text-white">TPS collected</strong> &mdash; 5% of taxable sales</li>
        <li><strong className="text-white">TVQ collected</strong> &mdash; 9.975% of taxable sales</li>
        <li><strong className="text-white">Input Tax Credits (ITC)</strong> &mdash; TPS you paid on business expenses</li>
        <li><strong className="text-white">Input Tax Refunds (ITR)</strong> &mdash; TVQ you paid on business expenses</li>
        <li><strong className="text-white">Net amount</strong> = Collected &minus; Credits. Positive means you owe; negative means a refund.</li>
      </ul>

      <h4 className="text-white font-medium mt-5">Payment</h4>
      <p className="text-sm text-slate-300">
        Pay through <ExtLink href="https://mon-dossier-entreprise.revenuquebec.ca">Mon Dossier</ExtLink> via
        bank transfer, or at any financial institution.
      </p>

      <WhyBox>
        ITC and ITR are how you recover tax paid on business expenses. This is
        money you are leaving on the table if you do not claim them &mdash; every business purchase where you paid
        TPS/TVQ can be claimed back.
      </WhyBox>

      <WarningBox>
        <strong>Late filing penalties:</strong> 5% of amount owing + 1% per month (up to 12 months).
        Interest also accrues daily. File on time even if you owe $0.
      </WarningBox>
    </div>
  );
}

function CaSection4_AddressChanges() {
  return (
    <div className="space-y-3">
      <h4 className="text-white font-medium">Company Address (Quebec)</h4>
      <Step n={1}>
        Go to the Registraire des entreprises du Quebec (REQ):{' '}
        <ExtLink href="https://www.registreentreprises.gouv.qc.ca">registreentreprises.gouv.qc.ca</ExtLink>
      </Step>
      <Step n={2}>
        Login with your ClicSEQUR credentials (same as Mon Dossier).
      </Step>
      <Step n={3}>
        Navigate to <strong className="text-white">"Mettre a jour"</strong> (Update) then{' '}
        <strong className="text-white">"Modifier l'adresse"</strong> (Change address).
      </Step>

      <InfoBox>
        Updating your address with REQ automatically updates it with:
        <ul className="list-disc ml-5 mt-1">
          <li>REQ (business registry)</li>
          <li>Revenu Quebec (tax authority)</li>
        </ul>
        <strong className="text-green-300 mt-1 block">It does NOT automatically update CRA.</strong>
      </InfoBox>

      <h4 className="text-white font-medium mt-5">CRA Address Change (Federal)</h4>
      <p className="text-sm text-slate-300">
        You must update CRA separately:{' '}
        <ExtLink href="https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/changes-your-business/change-address.html">
          CRA Change of Address
        </ExtLink>
      </p>

      <WhyBox>
        Having the wrong address means you will not receive important tax notices, and it can cause penalties
        if CRA considers mail to have been delivered.
      </WhyBox>

      <div className="flex flex-wrap gap-3 mt-4">
        <ExtButton href="https://www.registreentreprises.gouv.qc.ca">Open REQ</ExtButton>
        <ExtButton href="https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/changes-your-business/change-address.html">CRA Address Change</ExtButton>
      </div>
    </div>
  );
}

function CaSection5_CorporateIncomeTax() {
  return (
    <div className="space-y-3">
      <h4 className="text-white font-medium">Federal: T2 Corporate Income Tax Return</h4>
      <ul className="space-y-2 text-sm text-slate-300 ml-4 list-disc">
        <li>Filed with the CRA</li>
        <li>Due: <strong className="text-white">6 months after fiscal year-end</strong></li>
        <li>
          File online through{' '}
          <ExtLink href="https://www.canada.ca/en/revenue-agency/services/e-services/digital-services-businesses/business-account.html">
            CRA My Business Account
          </ExtLink>
          , or use certified tax software
        </li>
      </ul>

      <h4 className="text-white font-medium mt-5">Provincial: CO-17 Return</h4>
      <ul className="space-y-2 text-sm text-slate-300 ml-4 list-disc">
        <li>Filed with Revenu Quebec</li>
        <li>Due: <strong className="text-white">Same deadline as T2</strong> (6 months after fiscal year-end)</li>
        <li>File through <ExtLink href="https://mon-dossier-entreprise.revenuquebec.ca">Mon Dossier</ExtLink></li>
      </ul>

      <WhyBox>
        This is your annual company profit tax &mdash; completely separate from TPS/TVQ. Even if your company
        had no profit, you still need to file both the T2 and CO-17.
      </WhyBox>

      <div className="flex flex-wrap gap-3 mt-4">
        <ExtButton href="https://www.canada.ca/en/revenue-agency/services/e-services/digital-services-businesses/business-account.html">CRA My Business Account</ExtButton>
        <ExtButton href="https://mon-dossier-entreprise.revenuquebec.ca">Mon Dossier (CO-17)</ExtButton>
      </div>
    </div>
  );
}

function CaSection6_AnnualDeclaration() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">
        Every Quebec company <strong className="text-white">must</strong> file an Annual Declaration with the
        Registraire des entreprises (REQ).
      </p>

      <Step n={1}>
        Go to{' '}
        <ExtLink href="https://www.registreentreprises.gouv.qc.ca">registreentreprises.gouv.qc.ca</ExtLink>
      </Step>
      <Step n={2}>
        Login with ClicSEQUR, select your company, and file the annual declaration.
      </Step>

      <ul className="space-y-2 text-sm text-slate-300 ml-4 list-disc mt-3">
        <li>Due: Between the <strong className="text-white">anniversary of registration</strong> and <strong className="text-white">60 days after</strong></li>
        <li>Fee: <strong className="text-white">$89 per company</strong> (as of 2024)</li>
        <li>You have 4 companies &mdash; that is $356 total per year</li>
      </ul>

      <WarningBox>
        <strong>This is NOT a tax return</strong> &mdash; it is a corporate registration update confirming your
        company details (directors, address, activities). If you do not file, your company can be{' '}
        <strong>struck off the registry (dissolved)</strong>.
      </WarningBox>

      <div className="flex flex-wrap gap-3 mt-4">
        <ExtButton href="https://www.registreentreprises.gouv.qc.ca">Open REQ</ExtButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// US sections content
// ---------------------------------------------------------------------------
function UsSection1_LLCObligations() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">
        All 3 of your US companies are <strong className="text-white">LLCs</strong>. How they are taxed depends on
        their membership structure and elections:
      </p>

      <ul className="space-y-2 text-sm text-slate-300 ml-4 list-disc">
        <li>
          <strong className="text-white">Single-member LLC</strong> &mdash; "disregarded entity" for tax purposes.
          Income flows to your personal return (Schedule C on Form 1040).
        </li>
        <li>
          <strong className="text-white">Multi-member LLC</strong> &mdash; taxed as a partnership. Must file
          Form 1065 and issue Schedule K-1 to each member.
        </li>
        <li>
          You <strong className="text-white">can elect</strong> S-Corp taxation (Form 2553) or C-Corp taxation (Form 8832).
        </li>
      </ul>

      <WhyBox>
        The default LLC tax treatment might not be optimal. An S-Corp election can save self-employment tax
        if profits exceed roughly $40K/year per company, because you split income between salary (subject to
        FICA) and distributions (not subject to FICA).
      </WhyBox>

      <InfoBox>
        <strong>Tip:</strong> Talk to a CPA about S-Corp election before your next filing year. The election
        must be filed within 75 days of the start of the tax year (or the IRS may grant late-election relief).
      </InfoBox>
    </div>
  );
}

function UsSection2_FederalReturns() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">
        IRS portal for small businesses:{' '}
        <ExtLink href="https://www.irs.gov/businesses/small-businesses-self-employed">
          irs.gov/businesses/small-businesses-self-employed
        </ExtLink>
      </p>

      <h4 className="text-white font-medium mt-3">Which form to file?</h4>
      <ul className="space-y-2 text-sm text-slate-300 ml-4 list-disc">
        <li><strong className="text-white">Form 1065</strong> (Partnership Return) &mdash; if multi-member LLC</li>
        <li><strong className="text-white">Schedule C on Form 1040</strong> &mdash; if single-member LLC</li>
      </ul>

      <h4 className="text-white font-medium mt-4">Filing Deadlines</h4>
      <DeadlineTable
        rows={[
          { period: 'Partnerships (Form 1065)', due: 'March 15' },
          { period: 'Sole props / Single-member (Schedule C)', due: 'April 15' },
        ]}
      />

      <p className="text-sm text-slate-300 mt-3">
        E-file through:{' '}
        <ExtLink href="https://www.irs.gov/e-file-providers/e-file-for-business-and-self-employed-taxpayers">
          IRS E-file for Business
        </ExtLink>
      </p>

      <h4 className="text-white font-medium mt-5">Estimated Quarterly Tax Payments</h4>
      <p className="text-sm text-slate-300">
        Use{' '}
        <ExtLink href="https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes">
          Form 1040-ES
        </ExtLink>{' '}
        to make quarterly estimated payments:
      </p>
      <DeadlineTable
        rows={[
          { period: 'Q1 estimated payment', due: 'April 15' },
          { period: 'Q2 estimated payment', due: 'June 15' },
          { period: 'Q3 estimated payment', due: 'September 15' },
          { period: 'Q4 estimated payment', due: 'January 15' },
        ]}
      />

      <WhyBox>
        Even if your LLC passes through to your personal return, you still need to file the business returns.
        Missing the filing deadline triggers penalties even if no tax is owed.
      </WhyBox>

      <div className="flex flex-wrap gap-3 mt-4">
        <ExtButton href="https://www.irs.gov/businesses/small-businesses-self-employed">IRS Small Business Portal</ExtButton>
        <ExtButton href="https://www.irs.gov/e-file-providers/e-file-for-business-and-self-employed-taxpayers">IRS E-File</ExtButton>
      </div>
    </div>
  );
}

function UsSection3_Delaware() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">
        Delaware Division of Corporations:{' '}
        <ExtLink href="https://corp.delaware.gov">corp.delaware.gov</ExtLink>
      </p>

      <ul className="space-y-2 text-sm text-slate-300 ml-4 list-disc">
        <li>Annual Franchise Tax: <strong className="text-white">$300/year</strong> for LLCs</li>
        <li>Due: <strong className="text-white">June 1</strong> every year</li>
        <li>
          File & pay online:{' '}
          <ExtLink href="https://corp.delaware.gov/paytaxes/">corp.delaware.gov/paytaxes</ExtLink>
        </li>
        <li><strong className="text-white">No state income tax</strong> for LLCs not operating in Delaware</li>
        <li><strong className="text-white">No sales tax</strong> in Delaware &mdash; one of only 5 states with no sales tax</li>
      </ul>

      <WarningBox>
        If you miss the franchise tax: <strong>$200 penalty</strong> + <strong>1.5% monthly interest</strong>.
        The state can also void your LLC's good standing.
      </WarningBox>

      <InfoBox>
        <strong>Why Delaware:</strong> Most LLC-friendly state in the US. No state income tax on
        out-of-state revenue, strong privacy laws, well-established business court (Court of Chancery),
        and fast filing times.
      </InfoBox>

      <div className="flex flex-wrap gap-3 mt-4">
        <ExtButton href="https://corp.delaware.gov/paytaxes/">Pay DE Franchise Tax</ExtButton>
      </div>
    </div>
  );
}

function UsSection4_NewYork() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">
        NY Department of State:{' '}
        <ExtLink href="https://www.dos.ny.gov/corps/">dos.ny.gov/corps</ExtLink>
      </p>

      <h4 className="text-white font-medium mt-3">Biennial Statement</h4>
      <ul className="space-y-2 text-sm text-slate-300 ml-4 list-disc">
        <li>File every <strong className="text-white">2 years</strong>, fee is <strong className="text-white">$9</strong></li>
      </ul>

      <h4 className="text-white font-medium mt-4">Publication Requirement</h4>
      <WarningBox>
        New York <strong>requires</strong> new LLCs to publish a formation notice in <strong>2 newspapers</strong> for{' '}
        <strong>6 consecutive weeks</strong>. This can cost <strong>$500&ndash;$1,500</strong> depending on the county.
        You must file a Certificate of Publication with the DOS within 120 days of formation.{' '}
        <ExtLink href="https://dos.ny.gov/certificate-publication">More info</ExtLink>
      </WarningBox>

      <h4 className="text-white font-medium mt-4">IT-204-LL &mdash; LLC Filing Fee</h4>
      <p className="text-sm text-slate-300">Based on NY-source gross income:</p>
      <FeeTable
        rows={[
          { range: 'Under $100K', fee: '$0' },
          { range: '$100K \u2013 $250K', fee: '$50' },
          { range: '$250K \u2013 $500K', fee: '$175' },
          { range: '$500K \u2013 $1M', fee: '$500' },
          { range: 'Over $1M', fee: '$1,500' },
        ]}
      />

      <p className="text-sm text-slate-300 mt-3">
        File through:{' '}
        <ExtLink href="https://www.tax.ny.gov/online/">tax.ny.gov/online</ExtLink>
      </p>

      <h4 className="text-white font-medium mt-4">Sales Tax Registration (if applicable)</h4>
      <p className="text-sm text-slate-300">
        If you sell taxable goods or services in NY:{' '}
        <ExtLink href="https://www.tax.ny.gov/bus/st/stidx.htm">NY Sales Tax Registration</ExtLink>
      </p>

      <WhyBox>
        New York has aggressive tax enforcement and the publication requirement catches many new LLC owners
        off guard. Failure to publish does not dissolve the LLC but it loses its ability to sue in NY courts.
      </WhyBox>

      <div className="flex flex-wrap gap-3 mt-4">
        <ExtButton href="https://www.dos.ny.gov/corps/">NY Dept of State</ExtButton>
        <ExtButton href="https://www.tax.ny.gov/online/">NY Tax Online</ExtButton>
      </div>
    </div>
  );
}

function UsSection5_Wyoming() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">
        Wyoming Secretary of State:{' '}
        <ExtLink href="https://sos.wyo.gov">sos.wyo.gov</ExtLink>
      </p>

      <ul className="space-y-2 text-sm text-slate-300 ml-4 list-disc">
        <li>Annual Report due: <strong className="text-white">First day of your anniversary month</strong></li>
        <li>Fee: <strong className="text-white">$60 minimum</strong> (or $60 per $250,000 of assets in WY)</li>
        <li>
          File online:{' '}
          <ExtLink href="https://wyobiz.wyo.gov">wyobiz.wyo.gov</ExtLink>
        </li>
        <li><strong className="text-white">No state income tax</strong></li>
        <li><strong className="text-white">No franchise tax</strong> beyond the annual report fee</li>
        <li><strong className="text-white">No sales tax on services</strong> (only on tangible goods)</li>
      </ul>

      <InfoBox>
        <strong>Why Wyoming:</strong> Most tax-friendly state in the US. Minimal reporting requirements,
        strong asset protection laws (charging order protection), no state income tax, and lifetime proxy
        allows for maximum privacy.
      </InfoBox>

      <div className="flex flex-wrap gap-3 mt-4">
        <ExtButton href="https://wyobiz.wyo.gov">File WY Annual Report</ExtButton>
      </div>
    </div>
  );
}

function UsSection6_SalesTax() {
  return (
    <div className="space-y-3">
      <WarningBox>
        You are <strong>not currently collecting sales tax</strong> but you should evaluate whether you need to.
        If you sell taxable goods or services and meet economic nexus thresholds, you are legally required to collect.
      </WarningBox>

      <h4 className="text-white font-medium mt-4">When must you register?</h4>
      <ul className="space-y-2 text-sm text-slate-300 ml-4 list-disc">
        <li>You sell taxable goods or services</li>
        <li>You have <strong className="text-white">economic nexus</strong>: typically <strong className="text-white">$100K+ in sales</strong> or <strong className="text-white">200+ transactions</strong> in a state</li>
      </ul>

      <h4 className="text-white font-medium mt-4">State-by-State Breakdown</h4>

      <div className="space-y-3 mt-3">
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <h5 className="text-white font-medium flex items-center gap-2">
            <span className="text-lg">DE</span> Delaware
          </h5>
          <p className="text-sm text-green-400 mt-1 font-medium">No sales tax &mdash; nothing to do.</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <h5 className="text-white font-medium flex items-center gap-2">
            <span className="text-lg">NY</span> New York
          </h5>
          <ul className="text-sm text-slate-300 mt-2 space-y-1 list-disc ml-4">
            <li>
              Register at{' '}
              <ExtLink href="https://www.tax.ny.gov/bus/st/stidx.htm">tax.ny.gov/bus/st/stidx.htm</ExtLink>
            </li>
            <li>Rate: <strong className="text-white">4% state</strong> + up to <strong className="text-white">4.875% local</strong> (total up to 8.875%)</li>
          </ul>
        </div>

        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <h5 className="text-white font-medium flex items-center gap-2">
            <span className="text-lg">WY</span> Wyoming
          </h5>
          <ul className="text-sm text-slate-300 mt-2 space-y-1 list-disc ml-4">
            <li>
              Register at{' '}
              <ExtLink href="https://revenue.wyo.gov">revenue.wyo.gov</ExtLink>
            </li>
            <li>Rate: <strong className="text-white">4% state</strong> + up to <strong className="text-white">2% local</strong> (total up to 6%)</li>
          </ul>
        </div>
      </div>

      <h4 className="text-white font-medium mt-5">Marketplace Facilitator Laws</h4>
      <p className="text-sm text-slate-300">
        If you sell through platforms like Shopify, Amazon, Etsy, etc., the <strong className="text-white">marketplace</strong> may
        collect and remit sales tax on your behalf in most states. Check each platform's documentation.
      </p>

      <WhyBox>
        Not collecting when you should creates a <strong>growing liability</strong>. States are aggressive about
        enforcement since the 2018 <em>South Dakota v. Wayfair</em> Supreme Court decision, which allowed states
        to require sales tax collection from out-of-state sellers based on economic nexus alone.
      </WhyBox>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section definitions
// ---------------------------------------------------------------------------
const CA_SECTIONS: SectionDef[] = [
  {
    id: 'ca-clicsequr',
    title: 'Getting Access \u2014 ClicSEQUR & Mon Dossier',
    icon: KeyRound,
    badge: { label: 'Action Required', color: 'red' },
    content: <CaSection1_ClicSEQUR />,
  },
  {
    id: 'ca-tps-tvq',
    title: 'TPS/TVQ Registration',
    icon: Receipt,
    badge: { label: 'Action Required', color: 'red' },
    content: <CaSection2_TPSTVQ />,
  },
  {
    id: 'ca-quarterly',
    title: 'Filing Your Quarterly TPS/TVQ Return',
    icon: Calendar,
    badge: { label: 'Quarterly', color: 'yellow' },
    content: <CaSection3_QuarterlyFiling />,
  },
  {
    id: 'ca-address',
    title: 'Address Changes',
    icon: MapPin,
    badge: { label: 'Reference', color: 'blue' },
    content: <CaSection4_AddressChanges />,
  },
  {
    id: 'ca-income-tax',
    title: 'Corporate Income Tax (T2 & CO-17)',
    icon: Landmark,
    badge: { label: 'Annual', color: 'yellow' },
    content: <CaSection5_CorporateIncomeTax />,
  },
  {
    id: 'ca-annual-decl',
    title: 'Annual Declaration (REQ)',
    icon: ScrollText,
    badge: { label: 'Annual', color: 'yellow' },
    content: <CaSection6_AnnualDeclaration />,
  },
];

const US_SECTIONS: SectionDef[] = [
  {
    id: 'us-llc',
    title: 'Understanding Your LLC Obligations',
    icon: Scale,
    badge: { label: 'Reference', color: 'blue' },
    content: <UsSection1_LLCObligations />,
  },
  {
    id: 'us-federal',
    title: 'Federal Tax Returns (IRS)',
    icon: Landmark,
    badge: { label: 'Annual', color: 'yellow' },
    content: <UsSection2_FederalReturns />,
  },
  {
    id: 'us-delaware',
    title: 'Delaware LLC',
    icon: Building2,
    badge: { label: 'Annual', color: 'yellow' },
    content: <UsSection3_Delaware />,
  },
  {
    id: 'us-new-york',
    title: 'New York LLC',
    icon: Building2,
    badge: { label: 'Action Required', color: 'red' },
    content: <UsSection4_NewYork />,
  },
  {
    id: 'us-wyoming',
    title: 'Wyoming LLC',
    icon: Building2,
    badge: { label: 'Annual', color: 'yellow' },
    content: <UsSection5_Wyoming />,
  },
  {
    id: 'us-sales-tax',
    title: 'Sales Tax \u2014 Should You Register?',
    icon: DollarSign,
    badge: { label: 'Action Required', color: 'red' },
    content: <UsSection6_SalesTax />,
  },
];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function FilingGuidePage() {
  const [activeTab, setActiveTab] = useState<Tab>('canada');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState<Record<string, boolean>>(loadChecked);

  // Persist checklist to localStorage on change
  useEffect(() => {
    saveChecked(checked);
  }, [checked]);

  const toggleSection = useCallback((id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleCheck = useCallback((key: string) => {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const expandAll = useCallback((sections: SectionDef[]) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      sections.forEach(s => next.add(s.id));
      return next;
    });
  }, []);

  const collapseAll = useCallback((sections: SectionDef[]) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      sections.forEach(s => next.delete(s.id));
      return next;
    });
  }, []);

  const sections = activeTab === 'canada' ? CA_SECTIONS : US_SECTIONS;
  const checklist = activeTab === 'canada' ? CA_CHECKLIST : US_CHECKLIST;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BookOpen size={24} className="text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Tax Filing Guide</h1>
        </div>
        <p className="text-sm text-slate-400">
          Comprehensive step-by-step reference for all your filing obligations across 7 companies.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('canada')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'canada'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <span className="text-lg">&#127464;&#127462;</span>
          Canada
          <span className="text-xs opacity-70">(4 companies)</span>
        </button>
        <button
          onClick={() => setActiveTab('us')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'us'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <span className="text-lg">&#127482;&#127480;</span>
          United States
          <span className="text-xs opacity-70">(3 companies)</span>
        </button>
      </div>

      {/* Checklist */}
      <FilingChecklist items={checklist} checked={checked} onToggle={toggleCheck} />

      {/* Expand / Collapse controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          {activeTab === 'canada' ? 'Canadian Filing Guide' : 'US Filing Guide'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => expandAll(sections)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Expand all
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => collapseAll(sections)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Accordions */}
      <div className="space-y-3">
        {sections.map(section => (
          <Accordion
            key={section.id}
            section={section}
            isOpen={openSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>

      {/* Footer note */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
        <p className="text-xs text-slate-500">
          This guide is for reference only and does not constitute legal or tax advice.
          Consult a qualified accountant or tax professional for your specific situation.
          Last updated: 2024.
        </p>
      </div>
    </div>
  );
}
