import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const testsDir = path.join(process.cwd(), 'tests');

    let summaryText: string | null = null;
    let reportJson: Record<string, unknown> | null = null;

    // Read summary text file
    const summaryPath = path.join(testsDir, 'loadtest-summary-10k.txt');
    if (fs.existsSync(summaryPath)) {
      summaryText = fs.readFileSync(summaryPath, 'utf-8');
    }

    // Read JSON report
    const reportPath = path.join(testsDir, 'loadtest-report-10k.json');
    if (fs.existsSync(reportPath)) {
      try {
        const raw = fs.readFileSync(reportPath, 'utf-8');
        reportJson = JSON.parse(raw);
      } catch {
        // ignore parse errors
      }
    }

    // Also check for the basic loadtest results
    const basicSummaryPath = path.join(testsDir, 'loadtest-summary.txt');
    if (!summaryText && fs.existsSync(basicSummaryPath)) {
      summaryText = fs.readFileSync(basicSummaryPath, 'utf-8');
    }

    const basicReportPath = path.join(testsDir, 'loadtest-report.json');
    if (!reportJson && fs.existsSync(basicReportPath)) {
      try {
        const raw = fs.readFileSync(basicReportPath, 'utf-8');
        reportJson = JSON.parse(raw);
      } catch {
        // ignore parse errors
      }
    }

    const hasResults = !!(summaryText || reportJson);

    return NextResponse.json({
      success: true,
      hasResults,
      summary: summaryText,
      report: reportJson,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[admin/loadtest-results] Error:', message);
    return NextResponse.json(
      { success: false, error: 'Operation failed', details: message },
      { status: 500 }
    );
  }
}
