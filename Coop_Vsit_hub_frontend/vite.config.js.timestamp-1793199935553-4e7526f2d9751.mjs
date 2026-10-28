// vite.config.js
import { defineConfig, loadEnv } from "file:///C:/Users/elsha/OneDrive/Documents/coop%20projects/Coop_Vsit_hub/Coop_Vsit_hub_frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/elsha/OneDrive/Documents/coop%20projects/Coop_Vsit_hub/Coop_Vsit_hub_frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/elsha/OneDrive/Documents/coop%20projects/Coop_Vsit_hub/Coop_Vsit_hub_frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
import fs from "fs";
var __vite_injected_original_dirname = "C:\\Users\\elsha\\OneDrive\\Documents\\coop projects\\Coop_Vsit_hub\\Coop_Vsit_hub_frontend";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL || "http://localhost:8080";
  const port = parseInt(env.VITE_PORT, 10) || 3e3;
  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    server: {
      port,
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true,
          secure: false
        },
        "/rooms": {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            const cleanPath = req.url.split("?")[0].replace(/^\//, "");
            const localFile = path.resolve(__vite_injected_original_dirname, "public", cleanPath);
            if (fs.existsSync(localFile)) {
              return req.url;
            }
          }
        },
        "/uploads": {
          target: apiUrl,
          changeOrigin: true,
          secure: false
        },
        "/images": {
          target: apiUrl,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxlbHNoYVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudHNcXFxcY29vcCBwcm9qZWN0c1xcXFxDb29wX1ZzaXRfaHViXFxcXENvb3BfVnNpdF9odWJfZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGVsc2hhXFxcXE9uZURyaXZlXFxcXERvY3VtZW50c1xcXFxjb29wIHByb2plY3RzXFxcXENvb3BfVnNpdF9odWJcXFxcQ29vcF9Wc2l0X2h1Yl9mcm9udGVuZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvZWxzaGEvT25lRHJpdmUvRG9jdW1lbnRzL2Nvb3AlMjBwcm9qZWN0cy9Db29wX1ZzaXRfaHViL0Nvb3BfVnNpdF9odWJfZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXHJcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tICdAdGFpbHdpbmRjc3Mvdml0ZSdcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJ1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcclxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKVxyXG4gIGNvbnN0IGFwaVVybCA9IGVudi5WSVRFX0FQSV9VUkwgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MCdcclxuICBjb25zdCBwb3J0ID0gcGFyc2VJbnQoZW52LlZJVEVfUE9SVCwgMTApIHx8IDMwMDBcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgcmVhY3QoKSxcclxuICAgICAgdGFpbHdpbmRjc3MoKVxyXG4gICAgXSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lLCAnLi9zcmMnKVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIHBvcnQsXHJcbiAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgICB0YXJnZXQ6IGFwaVVybCxcclxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAgIHNlY3VyZTogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgICcvcm9vbXMnOiB7XHJcbiAgICAgICAgICB0YXJnZXQ6IGFwaVVybCxcclxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgICBieXBhc3M6IChyZXEpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY2xlYW5QYXRoID0gcmVxLnVybC5zcGxpdCgnPycpWzBdLnJlcGxhY2UoL15cXC8vLCAnJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsRmlsZSA9IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lLCAncHVibGljJywgY2xlYW5QYXRoKTtcclxuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMobG9jYWxGaWxlKSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiByZXEudXJsOyAvLyBTZXJ2ZSBkaXJlY3RseSBmcm9tIHB1YmxpYy8gd2l0aG91dCBwcm94eWluZ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICAnL3VwbG9hZHMnOiB7XHJcbiAgICAgICAgICB0YXJnZXQ6IGFwaVVybCxcclxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAgIHNlY3VyZTogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgICcvaW1hZ2VzJzoge1xyXG4gICAgICAgICAgdGFyZ2V0OiBhcGlVcmwsXHJcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgICBzZWN1cmU6IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdjLFNBQVMsY0FBYyxlQUFlO0FBQ3RlLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFVBQVU7QUFDakIsT0FBTyxRQUFRO0FBSmYsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBQzNDLFFBQU0sU0FBUyxJQUFJLGdCQUFnQjtBQUNuQyxRQUFNLE9BQU8sU0FBUyxJQUFJLFdBQVcsRUFBRSxLQUFLO0FBRTVDLFNBQU87QUFBQSxJQUNMLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxJQUNkO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBcUIsT0FBTztBQUFBLE1BQ2hEO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ047QUFBQSxNQUNBLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxVQUNOLFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQSxRQUNWO0FBQUEsUUFDQSxVQUFVO0FBQUEsVUFDUixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxRQUFRO0FBQUEsVUFDUixRQUFRLENBQUMsUUFBUTtBQUNmLGtCQUFNLFlBQVksSUFBSSxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUMsRUFBRSxRQUFRLE9BQU8sRUFBRTtBQUN6RCxrQkFBTSxZQUFZLEtBQUssUUFBUSxrQ0FBcUIsVUFBVSxTQUFTO0FBQ3ZFLGdCQUFJLEdBQUcsV0FBVyxTQUFTLEdBQUc7QUFDNUIscUJBQU8sSUFBSTtBQUFBLFlBQ2I7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBQ0EsWUFBWTtBQUFBLFVBQ1YsUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFVBQ2QsUUFBUTtBQUFBLFFBQ1Y7QUFBQSxRQUNBLFdBQVc7QUFBQSxVQUNULFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQSxRQUNWO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
