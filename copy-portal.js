const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'VIDYACRM', 'src');
const destDir = path.join(__dirname, 'client-portal', 'src');

const filesToCopy = [
  // Layout
  { src: 'layouts/ClientPortalLayout.jsx', dest: 'layouts/ClientPortalLayout.jsx' },
  { src: 'layouts/ClientPortalLayout.module.css', dest: 'layouts/ClientPortalLayout.module.css' },
  
  // Dashboard (moving to pages/ClientDashboard for simplicity in new app)
  { src: 'components/ClientPortal/ClientDashboard.jsx', dest: 'pages/ClientDashboard/ClientDashboard.jsx' },
  { src: 'components/ClientPortal/ClientDashboard.module.css', dest: 'pages/ClientDashboard/ClientDashboard.module.css' },

  // Pages
  { src: 'pages/ClientPortal/ClientProfile.jsx', dest: 'pages/ClientProfile/ClientProfile.jsx' },
  { src: 'pages/ClientPortal/ClientProfile.module.css', dest: 'pages/ClientProfile/ClientProfile.module.css' },
  { src: 'pages/ClientPortal/ClientAssets.jsx', dest: 'pages/ClientAssets/ClientAssets.jsx' },
  { src: 'pages/ClientPortal/ClientAssets.module.css', dest: 'pages/ClientAssets/ClientAssets.module.css' },
  { src: 'pages/ClientPortal/ClientDocuments.jsx', dest: 'pages/ClientDocuments/ClientDocuments.jsx' },
  { src: 'pages/ClientPortal/ClientDocuments.module.css', dest: 'pages/ClientDocuments/ClientDocuments.module.css' },
  { src: 'pages/ClientPortal/ClientInvoices.jsx', dest: 'pages/ClientInvoices/ClientInvoices.jsx' },
  { src: 'pages/ClientPortal/ClientInvoices.module.css', dest: 'pages/ClientInvoices/ClientInvoices.module.css' },
  { src: 'pages/ClientPortal/ClientTransactions.jsx', dest: 'pages/ClientTransactions/ClientTransactions.jsx' },
  { src: 'pages/ClientPortal/ClientTransactions.module.css', dest: 'pages/ClientTransactions/ClientTransactions.module.css' },
];

filesToCopy.forEach(({ src, dest }) => {
  const srcPath = path.join(srcDir, src);
  const destPath = path.join(destDir, dest);
  
  if (fs.existsSync(srcPath)) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${src} to ${dest}`);
  } else {
    console.warn(`Source not found: ${srcPath}`);
  }
});

console.log('Copy complete!');
