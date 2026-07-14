import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const A4_WIDTH_CM = 21;
const A4_HEIGHT_CM = 29.7;

export async function downloadPageAsPdf(
    element: HTMLElement,
    filename: string,
    backgroundColor: string,
    onDone?: () => void
) {
    try {
        const pageElements = Array.from(element.querySelectorAll<HTMLElement>('[data-pdf-page]'));
        const pages = pageElements.length ? pageElements : [element];
        const pdf = new jsPDF({ unit: 'cm', format: 'a4', orientation: 'portrait' });

        for (const [index, page] of pages.entries()) {
            const canvas = await html2canvas(page, {
                scale: 3,
                useCORS: true,
                backgroundColor
            });
            const image = canvas.toDataURL('image/jpeg', 1);
            const imageHeight = (A4_WIDTH_CM * canvas.height) / canvas.width;

            if (index > 0) pdf.addPage();
            pdf.addImage(image, 'JPEG', 0, 0, A4_WIDTH_CM, Math.min(imageHeight, A4_HEIGHT_CM));
        }

        pdf.save(filename);
    } finally {
        if (onDone) onDone();
    }
}
