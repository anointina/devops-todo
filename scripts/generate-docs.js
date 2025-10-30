#!/usr/bin/env node

/**
 * Documentation Generator Script
 * Generates PDF reports and presentations from markdown files
 */

const fs = require('fs');
const path = require('path');

// Check if required packages are installed
const requiredPackages = ['markdown-pdf', 'puppeteer'];
let missingPackages = [];

requiredPackages.forEach(pkg => {
  try {
    require.resolve(pkg);
  } catch (e) {
    missingPackages.push(pkg);
  }
});

if (missingPackages.length > 0) {
  console.log('📦 Installing required packages...');
  console.log(`npm install ${missingPackages.join(' ')}`);
  console.log('\nAfter installation, run this script again.');
  process.exit(1);
}

const markdownpdf = require('markdown-pdf');

// Configuration
const config = {
  cssPath: path.join(__dirname, 'styles.css'),
  paperFormat: 'A4',
  paperOrientation: 'portrait',
  paperBorder: '2cm',
  renderDelay: 1000,
  runningsPath: path.join(__dirname, 'runnings.js')
};

// Create output directory
const outputDir = path.join(__dirname, '..', 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create CSS file for PDF styling
const cssContent = `
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #2c3e50;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
}

h2 {
  color: #34495e;
  border-bottom: 1px solid #bdc3c7;
  padding-bottom: 5px;
}

h3 {
  color: #7f8c8d;
}

code {
  background-color: #f8f9fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

pre {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 5px;
  padding: 15px;
  overflow-x: auto;
}

blockquote {
  border-left: 4px solid #3498db;
  margin: 0;
  padding-left: 20px;
  font-style: italic;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 20px 0;
}

th, td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.page-break {
  page-break-before: always;
}

@media print {
  body {
    margin: 0;
    padding: 0;
  }
}
`;

fs.writeFileSync(path.join(__dirname, 'styles.css'), cssContent);

// Create runnings.js for headers and footers
const runningsContent = `
module.exports = {
  header: {
    height: '1cm',
    contents: '<div style="text-align: center; font-size: 10px; color: #666;">DevOps Todo Application - Project Documentation</div>'
  },
  footer: {
    height: '1cm',
    contents: '<div style="text-align: center; font-size: 10px; color: #666;">Page {{page}} of {{pages}}</div>'
  }
};
`;

fs.writeFileSync(path.join(__dirname, 'runnings.js'), runningsContent);

// Documents to convert
const documents = [
  {
    input: '../README.md',
    output: 'DevOps-Todo-Overview.pdf',
    title: 'DevOps Todo Application - Overview'
  },
  {
    input: '../docs/PROJECT_REPORT.md',
    output: 'DevOps-Todo-Project-Report.pdf',
    title: 'DevOps Todo Application - Detailed Project Report'
  },
  {
    input: '../docs/ARCHITECTURE_DIAGRAM.md',
    output: 'DevOps-Todo-Architecture.pdf',
    title: 'DevOps Todo Application - Architecture Documentation'
  },
  {
    input: '../docs/VIVA_QUESTIONS.md',
    output: 'DevOps-Todo-Viva-Questions.pdf',
    title: 'DevOps Todo Application - Interview Questions & Answers'
  },
  {
    input: '../docs/IMPROVEMENT_PLAN.md',
    output: 'DevOps-Todo-Improvement-Plan.pdf',
    title: 'DevOps Todo Application - Enhancement Roadmap'
  }
];

// Function to generate PDF
function generatePDF(doc) {
  return new Promise((resolve, reject) => {
    const inputPath = path.join(__dirname, doc.input);
    const outputPath = path.join(outputDir, doc.output);

    if (!fs.existsSync(inputPath)) {
      console.log(`❌ Input file not found: ${inputPath}`);
      resolve();
      return;
    }

    console.log(`📄 Generating ${doc.output}...`);

    markdownpdf({
      ...config,
      preProcessMd: function() {
        return function(data) {
          // Add title page
          const titlePage = `# ${doc.title}\n\n---\n\n`;
          return titlePage + data;
        };
      }
    })
    .from(inputPath)
    .to(outputPath, function(err) {
      if (err) {
        console.log(`❌ Error generating ${doc.output}:`, err.message);
        reject(err);
      } else {
        console.log(`✅ Generated ${doc.output}`);
        resolve();
      }
    });
  });
}

// Generate all PDFs
async function generateAllPDFs() {
  console.log('🚀 Starting PDF generation...\n');

  for (const doc of documents) {
    try {
      await generatePDF(doc);
    } catch (error) {
      console.log(`❌ Failed to generate ${doc.output}`);
    }
  }

  // Generate combined report
  console.log('\n📚 Generating combined report...');
  await generateCombinedReport();

  console.log('\n✨ PDF generation complete!');
  console.log(`📁 Output directory: ${outputDir}`);
  
  // List generated files
  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.pdf'));
  console.log('\n📋 Generated files:');
  files.forEach(file => {
    const stats = fs.statSync(path.join(outputDir, file));
    const size = (stats.size / 1024).toFixed(1);
    console.log(`   • ${file} (${size} KB)`);
  });
}

// Generate combined report
async function generateCombinedReport() {
  const combinedContent = `# DevOps Todo Application - Complete Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Detailed Project Report](#detailed-project-report)
3. [Architecture Documentation](#architecture-documentation)
4. [Interview Questions & Answers](#interview-questions--answers)
5. [Enhancement Roadmap](#enhancement-roadmap)

---

<div class="page-break"></div>

## Project Overview

${fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8')}

<div class="page-break"></div>

## Detailed Project Report

${fs.readFileSync(path.join(__dirname, '../docs/PROJECT_REPORT.md'), 'utf8')}

<div class="page-break"></div>

## Architecture Documentation

${fs.readFileSync(path.join(__dirname, '../docs/ARCHITECTURE_DIAGRAM.md'), 'utf8')}

<div class="page-break"></div>

## Interview Questions & Answers

${fs.readFileSync(path.join(__dirname, '../docs/VIVA_QUESTIONS.md'), 'utf8')}

<div class="page-break"></div>

## Enhancement Roadmap

${fs.readFileSync(path.join(__dirname, '../docs/IMPROVEMENT_PLAN.md'), 'utf8')}
`;

  const combinedPath = path.join(__dirname, 'combined-report.md');
  fs.writeFileSync(combinedPath, combinedContent);

  return new Promise((resolve, reject) => {
    markdownpdf(config)
      .from(combinedPath)
      .to(path.join(outputDir, 'DevOps-Todo-Complete-Documentation.pdf'), function(err) {
        if (err) {
          console.log('❌ Error generating combined report:', err.message);
          reject(err);
        } else {
          console.log('✅ Generated DevOps-Todo-Complete-Documentation.pdf');
          // Clean up temporary file
          fs.unlinkSync(combinedPath);
          resolve();
        }
      });
  });
}

// Create PowerPoint generation script
function createPowerPointScript() {
  const pptScript = `
# PowerPoint Generation Script
# This script helps convert the presentation outline to PowerPoint

# Option 1: Using pandoc (if installed)
# pandoc docs/PRESENTATION_OUTLINE.md -o output/DevOps-Todo-Presentation.pptx

# Option 2: Manual conversion steps
echo "📊 PowerPoint Generation Guide:"
echo ""
echo "1. Open PowerPoint"
echo "2. Create new presentation with professional template"
echo "3. Use docs/PRESENTATION_OUTLINE.md as content guide"
echo "4. Add the following slides based on the outline:"
echo "   - Title slide"
echo "   - Agenda"
echo "   - Project overview"
echo "   - Technology stack"
echo "   - Architecture diagrams"
echo "   - Live demo preparation"
echo "   - Results and achievements"
echo "   - Future enhancements"
echo "   - Q&A"
echo ""
echo "3. Include diagrams from docs/ARCHITECTURE_DIAGRAM.md"
echo "4. Add screenshots of your running application"
echo "5. Save as DevOps-Todo-Presentation.pptx"
echo ""
echo "💡 Tips:"
echo "   - Keep slides clean and readable"
echo "   - Use consistent fonts and colors"
echo "   - Include code snippets sparingly"
echo "   - Practice the presentation timing"
`;

  fs.writeFileSync(path.join(__dirname, 'generate-ppt.sh'), pptScript);
  console.log('📊 Created PowerPoint generation guide: scripts/generate-ppt.sh');
}

// Main execution
if (require.main === module) {
  generateAllPDFs()
    .then(() => {
      createPowerPointScript();
      console.log('\n🎉 Documentation generation complete!');
      console.log('\n📋 Next steps:');
      console.log('   1. Review generated PDF files in output/ directory');
      console.log('   2. Use scripts/generate-ppt.sh for PowerPoint creation');
      console.log('   3. Practice your presentation with docs/PRESENTATION_OUTLINE.md');
      console.log('   4. Review viva questions in DevOps-Todo-Viva-Questions.pdf');
    })
    .catch(error => {
      console.error('❌ Error during generation:', error);
      process.exit(1);
    });
}

module.exports = { generateAllPDFs, generatePDF };