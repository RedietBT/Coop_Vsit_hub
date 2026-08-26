package com.example.coop_vsit_hub.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.util.Enumeration;
import java.util.List;

/**
 * Reverse-proxies requests from /mailhog/** to the embedded MailHog web service on localhost:8025.
 * Enables live cloud email inspection on Render at https://<your-render-url>/mailhog
 */
@Controller
@Slf4j
public class MailHogProxyController {

    private static final String MAILHOG_TARGET = "http://127.0.0.1:8025";

    @RequestMapping(value = {"/mailhog", "/mailhog/**"})
    public void proxyMailhog(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String uri = request.getRequestURI();
        String queryString = request.getQueryString();
        
        // Ensure /mailhog has trailing slash for HTML asset relative paths
        if (uri.equals("/mailhog")) {
            response.sendRedirect("/mailhog/");
            return;
        }

        String targetUrl = MAILHOG_TARGET + uri + (queryString != null ? "?" + queryString : "");

        try {
            URL url = URI.create(targetUrl).toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod(request.getMethod());
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(5000);

            // Copy request headers
            Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames != null && headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                if (!headerName.equalsIgnoreCase("host") && !headerName.equalsIgnoreCase("content-length")) {
                    conn.setRequestProperty(headerName, request.getHeader(headerName));
                }
            }

            // Copy request body if present
            if ("POST".equalsIgnoreCase(request.getMethod()) || "PUT".equalsIgnoreCase(request.getMethod())) {
                conn.setDoOutput(true);
                try (InputStream in = request.getInputStream(); OutputStream out = conn.getOutputStream()) {
                    in.transferTo(out);
                }
            }

            // Copy response code and headers
            int responseCode = conn.getResponseCode();
            response.setStatus(responseCode);

            for (String headerKey : conn.getHeaderFields().keySet()) {
                if (headerKey != null && !headerKey.equalsIgnoreCase("Transfer-Encoding")) {
                    response.setHeader(headerKey, conn.getHeaderField(headerKey));
                }
            }

            // Copy response body
            InputStream responseStream = (responseCode >= 400) ? conn.getErrorStream() : conn.getInputStream();
            if (responseStream != null) {
                try (responseStream; OutputStream out = response.getOutputStream()) {
                    responseStream.transferTo(out);
                }
            }
        } catch (Exception e) {
            log.warn("MailHog proxy unreachable at {}: {}", targetUrl, e.getMessage());
            response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
            response.setContentType("text/html");
            response.getWriter().write("<h2>MailHog Service Starting or Unavailable</h2><p>Please ensure MailHog is running in the background container.</p>");
        }
    }
}
