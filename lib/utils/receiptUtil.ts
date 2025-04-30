/**
 * Prints the receipt content directly to the printer
 * @param elementId The ID of the HTML element containing the receipt
 */
export const printReceipt = (elementId: string): void => {
    const printContent = document.getElementById(elementId);
    if (!printContent) {
        console.error(`Element with ID ${elementId} not found`);
        return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
        console.error('Unable to access iframe document');
        document.body.removeChild(iframe);
        return;
    }

    const printStyles = `
        <style>
            @media print {
                body, html {
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                    background: white;
                }
                #print-container {
                    width: 80mm;
                    margin: 0 auto;
                    padding: 24px;
                    max-width: 448px; 
                    background: white;
                    color: #000;
                    box-sizing: border-box;
                }
                .text-center {
                    text-align: center;
                }
                .mb-4 {
                    margin-bottom: 16px;
                }
                .font-bold {
                    font-weight: 700;
                }
                .text-lg {
                    font-size: 18px;
                }
                .text-xs {
                    font-size: 12px;
                }
                .border-t, .border-b {
                    border-top: 1px solid #e5e7eb;
                    border-bottom: 1px solid #e5e7eb;
                }
                .py-2 {
                    padding-top: 8px;
                    padding-bottom: 8px;
                }
                .mb-3 {
                    margin-bottom: 12px;
                }
                .flex {
                    display: flex;
                }
                .justify-between {
                    justify-content: space-between;
                }
                .font-medium {
                    font-weight: 500;
                }
                .grid {
                    display: grid;
                }
                .grid-cols-12 {
                    grid-template-columns: repeat(12, minmax(0, 1fr));
                }
                .col-span-6 {
                    grid-column: span 6 / span 6;
                }
                .col-span-2 {
                    grid-column: span 2 / span 2;
                }
                .col-span-1 {
                    grid-column: span 1 / span 1;
                }
                .col-span-3 {
                    grid-column: span 3 / span 3;
                }
                .pb-1 {
                    padding-bottom: 4px;
                }
                .mb-1 {
                    margin-bottom: 4px;
                }
                .py-1 {
                    padding-top: 4px;
                    padding-bottom: 4px;
                }
                .border-b {
                    border-bottom: 1px solid #f3f4f6;
                }
                .truncate {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .text-right {
                    text-align: right;
                }
                .mt-2 {
                    margin-top: 8px;
                }
                .text-sm {
                    font-size: 14px;
                }
                .text-gray-500 {
                    color: #6b7280;
                }
                .mt-6 {
                    margin-top: 24px;
                }
                .pt-2 {
                    padding-top: 8px;
                }
            }
        </style>
    `;
    const printContainer = `<div id="print-container">${printContent.innerHTML}</div>`;

    doc.open();
    doc.writeln(`
        <html lang="en">
            <head>
                ${printStyles}
            <title>Mai Sophany Sound</title></head>
            <body>
                ${printContainer}
            </body>
        </html>
    `);
    doc.close();

    // Trigger print after iframe content is loaded
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // Clean up by removing the iframe after printing
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 1000); // Delay to ensure print dialog appears
};