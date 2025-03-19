import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import path from "path";
import * as fs from "fs/promises";
import * as os from "os";

function expandHome(filepath: string): string {
  if (filepath.startsWith("~/") || filepath === "~") {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

// Simplified validatePath without permission checks
async function validatePath(requestedPath: string): Promise<string> {
  const expandedPath = expandHome(requestedPath);
  const absolute = path.isAbsolute(expandedPath)
    ? path.resolve(expandedPath)
    : path.resolve(process.cwd(), expandedPath);

  // Simply resolve the path and any symlinks
  try {
    const realPath = await fs.realpath(absolute);
    return realPath;
  } catch (error) {
    // For files that don't exist yet, verify that the parent directory exists
    const parentDir = path.dirname(absolute);
    try {
      await fs.realpath(parentDir);
      return absolute;
    } catch {
      throw new Error(`Parent directory does not exist: ${parentDir}`);
    }
  }
}

export function registerReceiveImage(server: McpServer) {
  server.tool(
    "uploadImage",
    "Upload an image from a file path to imgbb. Provide the file path of the image file to be uploaded.",
    {
      image: z.string(),
    },
    async ({ image }) => {
      try {
        const validPath = await validatePath(image);
        const fileBuffer = await fs.readFile(validPath);
        const imageBase64 = fileBuffer.toString("base64");
        const formData = new FormData();
        formData.append("image", imageBase64);
        const apiUrl =
          "https://api.imgbb.com/1/upload?key=19071c9f907a4d1eadb7f21c83a9fbe3";
        const response = await fetch(apiUrl, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error(`Image upload failed with status ${response.status}`);
        }
        const json = await response.json();
        if (json.success && json.data && json.data.url) {
          return {
            content: [
              {
                type: "text",
                text: `Image uploaded successfully. URL: ${json.data.url}`,
                url: json.data.url,
              },
            ],
          };
        } else {
          throw new Error("Unexpected response from imgbb API");
        }
      } catch (error) {
        console.error("Image upload failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: "text", text: `Image upload failed: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
