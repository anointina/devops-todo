#!/bin/bash

# DevOps Todo Application - Documentation Setup Script
# This script sets up the documentation generation environment

echo "🚀 Setting up documentation generation environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Create package.json for documentation tools
echo "📦 Creating package.json for documentation tools..."
cat > package.json << EOF
{
  "name": "devops-todo-docs",
  "version": "1.0.0",
  "description": "Documentation generation tools for DevOps Todo Application",
  "main": "scripts/generate-docs.js",
  "scripts": {
    "generate-docs": "node scripts/generate-docs.js",
    "generate-pdf": "node scripts/generate-docs.js",
    "setup": "npm install"
  },
  "devDependencies": {
    "markdown-pdf": "^10.0.0",
    "puppeteer": "^21.0.0"
  },
  "keywords": ["devops", "documentation", "pdf", "markdown"],
  "author": "DevOps Student",
  "license": "MIT"
}
EOF

# Install documentation dependencies
echo "📥 Installing documentation dependencies..."
npm install

# Make scripts executable
chmod +x scripts/generate-docs.js
chmod +x scripts/generate-ppt.sh

# Create output directory
mkdir -p output

echo "✅ Documentation environment setup complete!"
echo ""
echo "📋 Available commands:"
echo "   npm run generate-docs  - Generate all PDF documentation"
echo "   node scripts/generate-docs.js  - Generate PDFs directly"
echo "   bash scripts/generate-ppt.sh  - PowerPoint generation guide"
echo ""
echo "📁 Generated files will be saved in the 'output/' directory"
echo ""
echo "🎯 Next steps:"
echo "   1. Run 'npm run generate-docs' to generate PDF documentation"
echo "   2. Review the generated files in the output/ directory"
echo "   3. Use the presentation outline for creating PowerPoint slides"
echo "   4. Practice your presentation and prepare for viva questions"