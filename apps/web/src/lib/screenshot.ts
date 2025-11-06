import { toPng } from 'html-to-image';

export async function captureScreenshot(elementId: string, filename: string = 'screenshot.png'): Promise<void> {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  try {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2, // For better quality on Retina displays
      backgroundColor: getComputedStyle(element).backgroundColor || '#FFFFFF',
    });

    // Download the image
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
    throw error;
  }
}

export async function captureElement(element: HTMLElement): Promise<string> {
  try {
    return await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: getComputedStyle(element).backgroundColor || '#FFFFFF',
    });
  } catch (error) {
    console.error('Failed to capture element:', error);
    throw error;
  }
}

