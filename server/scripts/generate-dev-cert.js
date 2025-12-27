// Generate self-signed SSL certificate for development using node-forge
// This script doesn't require OpenSSL to be installed

import forge from "node-forge";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const certsDir = path.join(__dirname, "..", "certs");
const keyPath = path.join(certsDir, "key.pem");
const certPath = path.join(certsDir, "cert.pem");

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
  console.log("✅ Created certs directory");
}

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log("⚠️  Certificates already exist!");
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  console.log("   Delete them first if you want to regenerate.");
  process.exit(0);
}

console.log("🔐 Generating self-signed SSL certificate...");

try {
  // Generate key pair
  const keys = forge.pki.rsa.generateKeyPair(2048);
  
  // Create certificate
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01" + Math.floor(Math.random() * 1000000000).toString(16);
  
  // Set certificate attributes
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1); // Valid for 1 year
  
  const attrs = [
    { name: "countryName", value: "IL" },
    { name: "stateOrProvinceName", value: "Israel" },
    { name: "localityName", value: "TelAviv" },
    { name: "organizationName", value: "SecureMsg" },
    { name: "commonName", value: "localhost" },
  ];
  
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  
  // Add extensions
  cert.setExtensions([
    {
      name: "basicConstraints",
      cA: true,
    },
    {
      name: "keyUsage",
      keyCertSign: true,
      digitalSignature: true,
      keyEncipherment: true,
    },
    {
      name: "subjectAltName",
      altNames: [
        {
          type: 2, // DNS
          value: "localhost",
        },
        {
          type: 2, // DNS
          value: "127.0.0.1",
        },
        {
          type: 7, // IP
          ip: "127.0.0.1",
        },
        {
          type: 7, // IP
          ip: "::1",
        },
      ],
    },
  ]);
  
  // Sign certificate
  cert.sign(keys.privateKey);
  
  // Convert to PEM format
  const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
  const certPem = forge.pki.certificateToPem(cert);
  
  // Write to files
  fs.writeFileSync(keyPath, privateKeyPem, { mode: 0o600 });
  fs.writeFileSync(certPath, certPem, { mode: 0o644 });
  
  console.log("✅ Certificate generated successfully!");
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  console.log("");
  console.log("⚠️  Note: Browsers will show a security warning for self-signed certificates.");
  console.log("   Click 'Advanced' → 'Proceed to localhost' to continue.");
  console.log("");
  console.log("🚀 HTTPS will be enabled automatically when you start the server!");
} catch (error) {
  console.error("❌ Failed to generate certificate:", error.message);
  process.exit(1);
}

