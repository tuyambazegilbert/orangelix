import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteSourceLocator } from "@metagptx/vite-plugin-source-locator";
import dotenv from "dotenv";

dotenv.config();

function youtubeBackendPlugin(): Plugin {
  return {
    name: "youtube-geo-backend-api",
    configureServer(server) {
      server.middlewares.use("/api/geo-discovery", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        let body = "";
        req.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });

        req.on("end", async () => {
          try {
            const params = JSON.parse(body || "{}");
            const { ServerYouTubeGateway } = await server.ssrLoadModule("./src/server/youtube-discovery.ts");

            if (params.action === "search") {
              const videoIds = await ServerYouTubeGateway.searchVideos(params);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ videoIds }));
              return;
            }

            if (params.action === "details") {
              const details = await ServerYouTubeGateway.getVideoDetails(params.videoIds || []);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ details }));
              return;
            }

            if (params.action === "check-availability") {
              const result = await ServerYouTubeGateway.checkVideoAvailability(params.videoId);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
              return;
            }

            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Invalid action" }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Server discovery error" }));
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [
    viteSourceLocator({
      prefix: "gilbert",
    }),
    react(),
    youtubeBackendPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
