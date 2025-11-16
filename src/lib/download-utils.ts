import JSZip from "jszip";
import { toast } from "sonner";
import { filterAIGeneratedFiles } from "./filter-ai-files";

interface DownloadResult {
  success: boolean;
  fileCount?: number;
  error?: string;
}

/**
 * Downloads AI-generated files from a fragment as a ZIP archive
 * @param files - The raw files object from the fragment
 * @param fragmentId - The fragment ID for naming the download
 * @returns Promise with download result
 */
export async function downloadFragmentFiles(
  files: Record<string, unknown>,
  fragmentId: string
): Promise<DownloadResult> {
  // Normalize files to Record<string, string>
  const normalizedFiles = Object.entries(files).reduce<Record<string, string>>(
    (acc, [path, content]) => {
      if (typeof content === "string") {
        acc[path] = content;
      }
      return acc;
    },
    {}
  );

  // Check if there are any files
  const hasFiles = Object.keys(normalizedFiles).length > 0;
  if (!hasFiles) {
    toast.error("No files available to download yet.");
    return { success: false, error: "No files available" };
  }

  // Filter to only AI-generated files
  const aiGeneratedFiles = filterAIGeneratedFiles(normalizedFiles);
  const fileEntries = Object.entries(aiGeneratedFiles);

  if (fileEntries.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      const filteredOutFiles = Object.keys(normalizedFiles).filter(
        (filePath) => !(filePath in aiGeneratedFiles)
      );
      console.debug("Fragment download skipped: no AI-generated files after filtering", {
        fragmentId,
        filteredOutFiles,
      });
    }
    toast.error("No AI-generated files are ready to download.");
    return { success: false, error: "No AI-generated files" };
  }

  let objectUrl: string | null = null;
  let downloadLink: HTMLAnchorElement | null = null;

  try {
    const zip = new JSZip();

    // Add each file to the ZIP
    fileEntries.forEach(([filename, content]) => {
      zip.file(filename, content);
    });

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: "blob" });
    objectUrl = URL.createObjectURL(zipBlob);

    // Create and trigger download
    downloadLink = document.createElement("a");
    downloadLink.href = objectUrl;
    downloadLink.download = `ai-generated-code-${fragmentId}.zip`;
    document.body.appendChild(downloadLink);
    downloadLink.click();

    toast.success(`Downloaded ${fileEntries.length} file${fileEntries.length === 1 ? "" : "s"}`);
    
    return { success: true, fileCount: fileEntries.length };
  } catch (error) {
    console.error("Download failed:", error);
    toast.error("Failed to download files. Please try again.");
    return { success: false, error: "Download failed" };
  } finally {
    // Cleanup
    if (downloadLink) {
      downloadLink.remove();
    }

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}
