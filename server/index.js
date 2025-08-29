import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { accessSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1000mb' }));

// Encontrar Chrome en el sistema
const findChrome = () => {
    const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`,
        `C:\\Users\\${process.env.USERNAME}\\AppData\\Roaming\\Google\\Chrome\\Application\\chrome.exe`,
    ];
    
    for (const path of possiblePaths) {
        try {
            accessSync(path);
            console.log(`Found browser at: ${path}`);
            return path;
        } catch {
            // Continue searching
        }
    }
    
    console.log('No Chrome/Edge browser found in common locations');
    return null;
};

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Render server is running!',
        timestamp: new Date().toISOString(),
        chrome: !!findChrome()
    });
});

// Create COmponent endpoint
app.post('/api/generate-component', async (req, res) => {
    try {
        const { code, filename = 'ComponentRendered.tsx' } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: 'Code content is required' });
        }
        
        const filePath = join(__dirname, '../src/render', filename);
         
        await fs.mkdir(dirname(filePath), { recursive: true });
         
        await fs.writeFile(filePath, code, 'utf8');
        
        console.log(`✅ Component generated: ${filePath}`);
        
        res.json({ 
            success: true, 
            message: `${filename} generated successfully`,
            path: filePath
        });
        
    } catch (error) {
        console.error('Error generating component:', error);
        res.status(500).json({ 
            error: 'Failed to generate component',
            details: error.message 
        });
    }
});

// Generate Screenshot endpoint
app.post('/api/capture-screenshot', async (req, res) => {
    let browser = null;
    
    try {
        const { 
            canvasId = 'render-canvas', 
            viewport = { width: 800, height: 600 } 
        } = req.body;
        
        console.log(`📸 Starting screenshot capture from /render route`);
        console.log(`🎯 Target element ID: ${canvasId}`);
        console.log(`📏 Viewport: ${viewport.width}x${viewport.height}`);
        
        const chromePath = findChrome();
        if (!chromePath) {
            throw new Error('Chrome browser not found');
        }

        browser = await puppeteer.launch({
            executablePath: chromePath,
            headless: false,
            devtools: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security'
            ],
            timeout: 30000
        });

        const page = await browser.newPage();
         
        await page.setViewport({
            width: Math.max(viewport.width, 800),
            height: Math.max(viewport.height, 600),
            deviceScaleFactor: 2
        });
 
        const renderUrl = 'http://localhost:5173/render'; // Url to the render page
        console.log(`🌐 Loading frontend render page: ${renderUrl}`);
        
        try {
            await page.goto(renderUrl, { 
                waitUntil: ['networkidle0', 'domcontentloaded'],
                timeout: 30000 
            });
        } catch (navigationError) {
            console.error(`❌ Failed to navigate to ${renderUrl}:`, navigationError.message);
            throw new Error(`Frontend not accessible at ${renderUrl}. Make sure the frontend is running.`);
        }

        console.log('⏳ Waiting for component to render...');
         
        let waitAttempts = 0;
        const maxWaitTime = 10;
        let elementsReady = false;
        
        while (!elementsReady && waitAttempts < maxWaitTime) {
            try {
                elementsReady = await page.evaluate((targetCanvasId) => {
                    const canvas = document.getElementById(targetCanvasId);
                    const readyIndicator = document.getElementById('render-ready');
                    const rootDiv = document.getElementById('root');
                    
                    console.log('🔍 [BROWSER] Checking elements:', {
                        canvas: !!canvas,
                        ready: !!readyIndicator,
                        root: !!rootDiv,
                        canvasChildren: canvas ? canvas.children.length : 0
                    });
                    
                    return !!(canvas && readyIndicator && rootDiv);
                }, canvasId);
                
                if (!elementsReady) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    waitAttempts++;
                    console.log(`⏳ Waiting... attempt ${waitAttempts}`);
                }
            } catch (evalError) {
                console.warn(`Evaluation error on attempt ${waitAttempts}:`, evalError.message);
                waitAttempts++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        if (!elementsReady) {
            console.warn('⚠️ Elements not fully ready, but proceeding with screenshot');
        }

        console.log(`📸 Taking screenshot of element: #${canvasId}`);
         
        let screenshot;
        try {
            const element = await page.$(`#${canvasId}`);
            if (element) {
                screenshot = await element.screenshot({
                    type: 'png',
                    omitBackground: true
                });
                console.log('✅ Element screenshot captured successfully');
            } else {
                console.log('⚠️ Target element not found, taking full page screenshot');
                screenshot = await page.screenshot({
                    type: 'png',
                    fullPage: false,
                    omitBackground: true
                });
            }
        } catch (screenshotError) {
            console.warn('Screenshot error, trying full page:', screenshotError.message);
            screenshot = await page.screenshot({
                type: 'png',
                fullPage: false,
                omitBackground: true
            });
        }

        await browser.close();
        browser = null;

        console.log('🎉 Screenshot completed successfully!');
        
        res.set({
            'Content-Type': 'image/png',
            'Content-Length': screenshot.length,
            'Cache-Control': 'no-cache'
        });
        
        res.send(screenshot);
        
    } catch (error) {
        console.error('❌ Screenshot capture failed:', error);
        
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }
        
        res.status(500).json({ 
            error: 'Screenshot capture failed',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
 
app.listen(PORT, () => {
    console.log(`🚀 Render server running on http://localhost:${PORT}`);
    console.log(`🔍 Chrome found: ${!!findChrome()}`);
    console.log('📁 Available endpoints:');
    console.log('  - GET  /api/test');
    console.log('  - POST /api/generate-component');
    console.log('  - POST /api/capture-screenshot');
});