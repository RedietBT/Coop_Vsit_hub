package com.example.coop_vsit_hub.user_and_auth.security;

import javax.net.SocketFactory;
import javax.net.ssl.*;
import java.io.IOException;
import java.net.InetAddress;
import java.net.Socket;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;

/**
 * Development-only SocketFactory that bypasses SSL certificate validation for internal bank LDAPS.
 *
 * ⚠️ SECURITY WARNING: This class disables all SSL certificate validation (MITM vulnerability).
 * It must NEVER be used in production environments.
 * It is only engaged when 'coopbank.ad.ssl.trust-all=true' is explicitly configured for offline/dev testing.
 */
@Deprecated
public class TrustAllSSLSocketFactory extends SSLSocketFactory {

    private SSLSocketFactory factory;

    public TrustAllSSLSocketFactory() {
        try {
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, new TrustManager[]{new X509TrustManager() {
                @Override
                public void checkClientTrusted(X509Certificate[] chain, String authType) {}

                @Override
                public void checkServerTrusted(X509Certificate[] chain, String authType) {}

                @Override
                public X509Certificate[] getAcceptedIssuers() {
                    return new X509Certificate[0];
                }
            }}, new SecureRandom());
            factory = sslContext.getSocketFactory();
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize TrustAllSSLSocketFactory: " + e.getMessage(), e);
        }
    }

    public static SocketFactory getDefault() {
        return new TrustAllSSLSocketFactory();
    }

    @Override
    public String[] getDefaultCipherSuites() {
        return factory.getDefaultCipherSuites();
    }

    @Override
    public String[] getSupportedCipherSuites() {
        return factory.getSupportedCipherSuites();
    }

    @Override
    public Socket createSocket() throws IOException {
        return factory.createSocket();
    }

    @Override
    public Socket createSocket(Socket s, String host, int port, boolean autoClose) throws IOException {
        return factory.createSocket(s, host, port, autoClose);
    }

    @Override
    public Socket createSocket(String host, int port) throws IOException {
        return factory.createSocket(host, port);
    }

    @Override
    public Socket createSocket(String host, int port, InetAddress localHost, int localPort) throws IOException {
        return factory.createSocket(host, port, localHost, localPort);
    }

    @Override
    public Socket createSocket(InetAddress host, int port) throws IOException {
        return factory.createSocket(host, port);
    }

    @Override
    public Socket createSocket(InetAddress address, int port, InetAddress localAddress, int localPort) throws IOException {
        return factory.createSocket(address, port, localAddress, localPort);
    }
}
