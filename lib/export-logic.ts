import { TrialLogEntry } from "../types";

const convertToCSV = (log: TrialLogEntry[]): string => {
    if (log.length === 0) return '';
    
    const headers = Object.keys(log[0]);
    const csvRows = [headers.join(',')];

    for (const row of log) {
        const values = headers.map(header => {
            const val = row[header as keyof TrialLogEntry];
            if (typeof val === 'string') {
                return `"${val.replace(/"/g, '""')}"`;
            }
            if (typeof val === 'number' && val !== null) {
                return val.toFixed(4);
            }
            return val;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
};

const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

export const exportToCsv = (log: TrialLogEntry[]) => {
    const csvContent = convertToCSV(log);
    downloadFile(csvContent, 'visual_rhythm_results.csv', 'text/csv;charset=utf-8;');
};

export const exportToJson = (log: TrialLogEntry[]) => {
    const jsonContent = JSON.stringify(log, null, 2);
    downloadFile(jsonContent, 'visual_rhythm_results.json', 'application/json');
};
